const navLinks = document.querySelector(".nav-links");
const menuBtn = document.querySelector("[data-menu]");
const themeBtn = document.querySelector("[data-theme]");

const savedTheme = localStorage.getItem("imsn-theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark");
}

menuBtn?.addEventListener("click", () => {
  navLinks?.classList.toggle("open");
});

themeBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("imsn-theme", document.body.classList.contains("dark") ? "dark" : "light");
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => navLinks?.classList.remove("open"));
});

// Reveal content only when it enters the viewport.
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));

const courseSearch = document.querySelector("[data-course-search]");
const courseCards = document.querySelectorAll("[data-course]");

courseSearch?.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  courseCards.forEach((card) => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(query) ? "" : "none";
  });
});

function setError(input, message) {
  const error = input.closest("label")?.querySelector(".field-error");
  if (error) error.textContent = message;
}

document.querySelectorAll("[data-validate]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    let valid = true;

    form.querySelectorAll("[required]").forEach((input) => {
      const value = input.value.trim();
      const isEmail = input.type === "email";
      const emailOk = !isEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const ok = Boolean(value) && emailOk;
      setError(input, ok ? "" : isEmail ? "Enter a valid email address." : "This field is required.");
      if (!ok) valid = false;
    });

    const status = form.querySelector("[data-form-status]");
    if (valid && status) {
      status.textContent = "Thank you. Your request has been received.";
      form.reset();
    }
  });
});

const chatReplies = {
  admission: "Admissions are open for UG and PG enquiries. You can submit the admission form or call 01596-242219.",
  courses: "IMSN offers B.Sc. Maths/Biology, B.Com., B.A., B.C.A., M.Sc. Physics/Chemistry/Maths/Botany, and M.A. Geography.",
  contact: "Contact IMSN at ashokk@mandelia.edu.in, imsn.pilani@gmail.com, or 01596-242219.",
  hostel: "The campus information includes separate hostel support for boys and girls, plus transport facilities.",
  notice: "Current notices include admission updates, university examination updates, placement activities, and campus events."
};

function createChatWidget() {
  const tools = document.createElement("div");
  tools.className = "floating-tools";
  tools.innerHTML = `
    <button class="back-top" type="button" aria-label="Back to top">Top</button>
    <button class="chat-launch" type="button" aria-label="Open IMSN chat"><span class="chat-dot"></span>Chat</button>
  `;

  const panel = document.createElement("section");
  panel.className = "chat-panel";
  panel.setAttribute("aria-label", "IMSN web chat");
  panel.innerHTML = `
    <div class="chat-head">
      <div>
        <h3>IMSN Help Desk</h3>
        <p>Ask about admission, courses, notices, hostel, or contact.</p>
      </div>
      <button class="chat-close" type="button" aria-label="Close chat">X</button>
    </div>
    <div class="chat-body" data-chat-body>
      <div class="chat-msg">Namaste. How can I help you today?</div>
    </div>
    <div class="chat-quick">
      <button type="button" data-chat-key="admission">Admission</button>
      <button type="button" data-chat-key="courses">Courses</button>
      <button type="button" data-chat-key="notice">Notices</button>
      <button type="button" data-chat-key="hostel">Hostel</button>
      <a href="contact.html">Contact Page</a>
    </div>
    <form class="chat-form" data-chat-form>
      <input type="text" name="message" placeholder="Type your question" aria-label="Type your question">
      <button type="submit">Send</button>
    </form>
  `;

  document.body.append(panel, tools);

  const launch = tools.querySelector(".chat-launch");
  const close = panel.querySelector(".chat-close");
  const body = panel.querySelector("[data-chat-body]");
  const form = panel.querySelector("[data-chat-form]");
  const backTop = tools.querySelector(".back-top");

  function addMessage(text, type = "bot") {
    const msg = document.createElement("div");
    msg.className = `chat-msg ${type === "user" ? "user" : ""}`;
    msg.textContent = text;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
  }

  function answer(input) {
    const text = input.toLowerCase();
    if (text.includes("admission") || text.includes("apply")) return chatReplies.admission;
    if (text.includes("course") || text.includes("b.sc") || text.includes("m.sc") || text.includes("b.com")) return chatReplies.courses;
    if (text.includes("contact") || text.includes("phone") || text.includes("email")) return chatReplies.contact;
    if (text.includes("hostel") || text.includes("transport")) return chatReplies.hostel;
    if (text.includes("notice") || text.includes("exam") || text.includes("event")) return chatReplies.notice;
    return "Thanks. For exact details, please visit the Contact page or use the admission enquiry form.";
  }

  launch.addEventListener("click", () => panel.classList.toggle("open"));
  close.addEventListener("click", () => panel.classList.remove("open"));

  panel.querySelectorAll("[data-chat-key]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.chatKey;
      addMessage(button.textContent, "user");
      addMessage(chatReplies[key]);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = form.elements.message;
    const value = input.value.trim();
    if (!value) return;
    addMessage(value, "user");
    addMessage(answer(value));
    input.value = "";
  });

  backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", () => {
    backTop.classList.toggle("show", window.scrollY > 480);
  });
}

createChatWidget();
