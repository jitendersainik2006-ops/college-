const fallbackTasks = [
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

const api = {
  tasks: "/api/tasks",
  contacts: "/api/contacts",
  health: "/api/health"
};

const taskList = document.querySelector("#taskList");
const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const taskType = document.querySelector("#taskType");
const taskPriority = document.querySelector("#taskPriority");
const taskDue = document.querySelector("#taskDue");
const filters = document.querySelectorAll(".filter");
const progressValue = document.querySelector("#progressValue");
const totalTasks = document.querySelector("#totalTasks");
const doneTasks = document.querySelector("#doneTasks");
const contactForm = document.querySelector(".contact-form");
const backendStatus = document.querySelector("#backendStatus");
const healthMetric = document.querySelector("#healthMetric");
const openMetric = document.querySelector("#openMetric");
const priorityMetric = document.querySelector("#priorityMetric");
const focusMetric = document.querySelector("#focusMetric");

let tasks = [];
let activeFilter = "all";
let backendOnline = false;

function localTasks() {
  const stored = localStorage.getItem("planforgeTasks");
  return stored ? JSON.parse(stored) : fallbackTasks;
}

function saveLocalTasks() {
  localStorage.setItem("planforgeTasks", JSON.stringify(tasks));
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    throw new Error("Request failed");
  }

  return response.status === 204 ? null : response.json();
}

async function loadTasks() {
  try {
    await request(api.health);
    tasks = await request(api.tasks);
    backendOnline = true;
    backendStatus.textContent = "Backend connected. Tasks are saving to data/db.json.";
    backendStatus.className = "backend-status online";
  } catch (error) {
    tasks = localTasks();
    backendOnline = false;
    backendStatus.textContent = "Offline mode. Tasks are saving in this browser.";
    backendStatus.className = "backend-status offline";
  }

  renderTasks();
}

function getVisibleTasks() {
  if (activeFilter === "open") {
    return tasks.filter((task) => !task.done);
  }

  if (activeFilter === "done") {
    return tasks.filter((task) => task.done);
  }

  if (activeFilter === "high") {
    return tasks.filter((task) => task.priority === "High");
  }

  return tasks;
}

function strongestCategory() {
  const counts = tasks.reduce((result, task) => {
    result[task.type] = (result[task.type] || 0) + 1;
    return result;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
}

function updateSummary() {
  const completed = tasks.filter((task) => task.done).length;
  const open = tasks.length - completed;
  const high = tasks.filter((task) => task.priority === "High" && !task.done).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  progressValue.textContent = `${progress}%`;
  progressValue.parentElement.style.background = `
    radial-gradient(circle at center, var(--white) 58%, transparent 59%),
    conic-gradient(var(--teal) 0 ${progress}%, #d7e6e3 ${progress}% 100%)
  `;
  totalTasks.textContent = tasks.length;
  doneTasks.textContent = completed;
  healthMetric.textContent = `${progress}%`;
  openMetric.textContent = open;
  priorityMetric.textContent = high;
  focusMetric.textContent = strongestCategory();
}

function formatDueDate(date) {
  if (!date) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

function renderTasks() {
  taskList.innerHTML = "";

  getVisibleTasks().forEach((task) => {
    const item = document.createElement("li");
    item.className = `task-item ${task.done ? "done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Mark ${task.title} as done`);

    const content = document.createElement("div");
    const title = document.createElement("strong");
    const status = document.createElement("span");
    title.textContent = task.title;
    status.textContent = `${task.done ? "Completed" : "Open"} • ${task.priority} priority • ${formatDueDate(task.due)}`;
    content.append(title, status);

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const pill = document.createElement("span");
    pill.className = `pill ${task.type}`;
    pill.textContent = task.type;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-task";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);

    checkbox.addEventListener("change", () => toggleTask(task.id, checkbox.checked));
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    meta.append(pill, deleteButton);
    item.append(checkbox, content, meta);
    taskList.appendChild(item);
  });

  if (!getVisibleTasks().length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No tasks match this view.";
    taskList.appendChild(empty);
  }

  updateSummary();
}

async function addTask(task) {
  if (backendOnline) {
    try {
      const saved = await request(api.tasks, {
        method: "POST",
        body: JSON.stringify(task)
      });
      tasks.unshift(saved);
      renderTasks();
      return;
    } catch (error) {
      backendOnline = false;
      backendStatus.textContent = "Backend disconnected. Switched to browser saving.";
      backendStatus.className = "backend-status offline";
    }
  }

  tasks.unshift({ ...task, id: `local-${Date.now()}` });
  saveLocalTasks();
  renderTasks();
}

async function toggleTask(id, done) {
  const task = tasks.find((item) => item.id === id);
  if (!task) {
    return;
  }

  task.done = done;
  renderTasks();

  if (backendOnline) {
    try {
      await request(`${api.tasks}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ done })
      });
      return;
    } catch (error) {
      backendOnline = false;
      backendStatus.textContent = "Backend disconnected. Switched to browser saving.";
      backendStatus.className = "backend-status offline";
    }
  }

  saveLocalTasks();
}

async function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  renderTasks();

  if (backendOnline) {
    try {
      await request(`${api.tasks}/${encodeURIComponent(id)}`, { method: "DELETE" });
      return;
    } catch (error) {
      backendOnline = false;
      backendStatus.textContent = "Backend disconnected. Switched to browser saving.";
      backendStatus.className = "backend-status offline";
    }
  }

  saveLocalTasks();
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();

  if (!title) {
    return;
  }

  addTask({
    title,
    type: taskType.value,
    priority: taskPriority.value,
    due: taskDue.value,
    done: false
  });

  taskInput.value = "";
  taskDue.value = "";
  activeFilter = "all";
  filters.forEach((button) => button.classList.toggle("active", button.dataset.filter === "all"));
});

filters.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filters.forEach((filter) => filter.classList.remove("active"));
    button.classList.add("active");
    renderTasks();
  });
});

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = contactForm.querySelector("#email").value.trim();
  const button = contactForm.querySelector("button");
  const originalText = button.textContent;
  button.textContent = "Sending...";
  button.disabled = true;

  try {
    if (backendOnline) {
      await request(api.contacts, {
        method: "POST",
        body: JSON.stringify({ email })
      });
    }
    button.textContent = "Request Sent";
    contactForm.reset();
  } catch (error) {
    button.textContent = "Try Again";
    button.disabled = false;
    setTimeout(() => {
      button.textContent = originalText;
    }, 1600);
  }
});

loadTasks();
