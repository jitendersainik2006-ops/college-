const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 3000;
const publicDir = __dirname;
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "db.json");

const defaultTasks = [
  {
    id: "task-1",
    title: "Define launch goals",
    type: "Strategy",
    priority: "High",
    due: "2026-06-01",
    done: true
  },
  {
    id: "task-2",
    title: "Create landing page wireframe",
    type: "Design",
    priority: "Medium",
    due: "2026-06-03",
    done: true
  },
  {
    id: "task-3",
    title: "Review campaign budget",
    type: "Finance",
    priority: "High",
    due: "2026-06-04",
    done: false
  },
  {
    id: "task-4",
    title: "Prepare client presentation",
    type: "Review",
    priority: "Medium",
    due: "2026-06-07",
    done: true
  },
  {
    id: "task-5",
    title: "Finalize content calendar",
    type: "Strategy",
    priority: "Low",
    due: "2026-06-09",
    done: false
  },
  {
    id: "task-6",
    title: "Approve brand visuals",
    type: "Design",
    priority: "Medium",
    due: "2026-06-10",
    done: true
  }
];

function ensureDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(
      dbPath,
      JSON.stringify({ tasks: defaultTasks, contacts: [] }, null, 2)
    );
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 1_000_000) {
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function serveStatic(req, res) {
  const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const filePath = path.normalize(path.join(publicDir, decodeURIComponent(urlPath)));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const types = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8"
    };

    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    res.end(content);
  });
}

function cleanTask(input) {
  return {
    id: input.id || `task-${Date.now()}`,
    title: String(input.title || "").trim().slice(0, 140),
    type: ["Strategy", "Design", "Finance", "Review"].includes(input.type)
      ? input.type
      : "Strategy",
    priority: ["High", "Medium", "Low"].includes(input.priority) ? input.priority : "Medium",
    due: String(input.due || "").slice(0, 10),
    done: Boolean(input.done)
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.url === "/api/health") {
    sendJson(res, 200, { ok: true, app: "PlanForge" });
    return;
  }

  if (req.url === "/api/tasks" && req.method === "GET") {
    sendJson(res, 200, readDb().tasks);
    return;
  }

  if (req.url === "/api/tasks" && req.method === "POST") {
    try {
      const db = readDb();
      const task = cleanTask(await readBody(req));
      if (!task.title) {
        sendJson(res, 400, { error: "Task title is required." });
        return;
      }
      db.tasks.unshift(task);
      writeDb(db);
      sendJson(res, 201, task);
    } catch (error) {
      sendJson(res, 400, { error: "Invalid request body." });
    }
    return;
  }

  if (req.url.startsWith("/api/tasks/") && req.method === "PATCH") {
    try {
      const id = decodeURIComponent(req.url.split("/").pop());
      const updates = await readBody(req);
      const db = readDb();
      const task = db.tasks.find((item) => item.id === id);
      if (!task) {
        sendJson(res, 404, { error: "Task not found." });
        return;
      }
      Object.assign(task, cleanTask({ ...task, ...updates, id: task.id }));
      writeDb(db);
      sendJson(res, 200, task);
    } catch (error) {
      sendJson(res, 400, { error: "Invalid request body." });
    }
    return;
  }

  if (req.url.startsWith("/api/tasks/") && req.method === "DELETE") {
    const id = decodeURIComponent(req.url.split("/").pop());
    const db = readDb();
    db.tasks = db.tasks.filter((task) => task.id !== id);
    writeDb(db);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.url === "/api/contacts" && req.method === "POST") {
    try {
      const db = readDb();
      const input = await readBody(req);
      const email = String(input.email || "").trim().slice(0, 180);
      if (!email || !email.includes("@")) {
        sendJson(res, 400, { error: "A valid email is required." });
        return;
      }
      const contact = { id: `contact-${Date.now()}`, email, createdAt: new Date().toISOString() };
      db.contacts.unshift(contact);
      writeDb(db);
      sendJson(res, 201, contact);
    } catch (error) {
      sendJson(res, 400, { error: "Invalid request body." });
    }
    return;
  }

  serveStatic(req, res);
});

ensureDb();
server.listen(port, () => {
  console.log(`PlanForge is running at http://localhost:${port}`);
});
