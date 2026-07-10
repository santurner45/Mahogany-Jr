document.getElementById("year").textContent = new Date().getFullYear();

const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const STORAGE_KEY = "mahoganyJrFanWall";
const wallForm = document.getElementById("wallForm");
const wallList = document.getElementById("wallList");

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function renderEntries() {
  const entries = loadEntries();
  wallList.innerHTML = "";

  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "wall-empty";
    empty.textContent = "Be the first to sign the wall!";
    wallList.appendChild(empty);
    return;
  }

  entries.slice().reverse().forEach((entry) => {
    const item = document.createElement("li");

    const name = document.createElement("span");
    name.className = "wall-name";
    name.textContent = entry.name;

    const msg = document.createElement("span");
    msg.className = "wall-msg";
    msg.textContent = entry.message;

    item.appendChild(name);
    item.appendChild(msg);
    wallList.appendChild(item);
  });
}

wallForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nameField = document.getElementById("wallName");
  const messageField = document.getElementById("wallMessage");

  const name = nameField.value.trim();
  const message = messageField.value.trim();
  if (!name || !message) return;

  const entries = loadEntries();
  entries.push({ name, message });
  saveEntries(entries);
  renderEntries();

  wallForm.reset();
});

renderEntries();
