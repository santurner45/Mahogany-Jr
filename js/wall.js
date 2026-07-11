const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const wallForm = document.getElementById("wallForm");
const wallNameInput = document.getElementById("wallName");
const wallMessageInput = document.getElementById("wallMessage");
const wallList = document.getElementById("wallList");

const adminToggle = document.getElementById("adminToggle");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminEmailInput = document.getElementById("adminEmail");
const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginError = document.getElementById("adminLoginError");
const adminBar = document.getElementById("adminBar");
const adminSignOut = document.getElementById("adminSignOut");

let messages = [];
let isAdmin = false;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildMessageItem(row) {
  const li = el("li", "wall-item");

  const head = el("div", "wall-item-head");
  head.appendChild(el("span", "wall-name", row.name));
  head.appendChild(el("span", "wall-time", formatTime(row.created_at)));
  li.appendChild(head);

  li.appendChild(el("p", "wall-msg", row.message));

  if (row.reply) {
    const replyBox = el("div", "wall-reply");
    replyBox.appendChild(el("span", "wall-reply-label", "Mahogany Jr replied"));
    replyBox.appendChild(el("p", "wall-reply-text", row.reply));
    li.appendChild(replyBox);
  }

  if (isAdmin) {
    const adminControls = el("div", "wall-admin-controls");

    if (!row.reply) {
      const replyForm = el("form", "reply-form");
      const textarea = el("textarea");
      textarea.placeholder = "Write a reply...";
      textarea.maxLength = 200;
      textarea.rows = 2;
      const submitBtn = el("button", "btn btn-primary btn-small", "Post Reply");
      submitBtn.type = "submit";
      replyForm.appendChild(textarea);
      replyForm.appendChild(submitBtn);

      replyForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const replyText = textarea.value.trim();
        if (!replyText) return;
        submitBtn.disabled = true;
        try {
          const { error } = await sb
            .from("wall_messages")
            .update({ reply: replyText, replied_at: new Date().toISOString() })
            .eq("id", row.id);
          if (error) throw error;
          await loadMessages();
        } catch (err) {
          console.error(err);
          submitBtn.disabled = false;
        }
      });

      adminControls.appendChild(replyForm);
    }

    const deleteBtn = el("button", "wall-delete-btn", "Delete");
    deleteBtn.type = "button";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Delete this message?")) return;
      try {
        const { error } = await sb.from("wall_messages").delete().eq("id", row.id);
        if (error) throw error;
        await loadMessages();
      } catch (err) {
        console.error(err);
      }
    });
    adminControls.appendChild(deleteBtn);

    li.appendChild(adminControls);
  }

  return li;
}

function renderMessages() {
  wallList.innerHTML = "";

  if (messages.length === 0) {
    wallList.appendChild(el("li", "wall-empty", "Be the first to sign the wall!"));
    return;
  }

  messages.forEach((row) => wallList.appendChild(buildMessageItem(row)));
}

async function loadMessages() {
  try {
    const { data, error } = await sb
      .from("wall_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    messages = data;
    renderMessages();
  } catch (err) {
    console.error(err);
    wallList.innerHTML = "";
    wallList.appendChild(el("li", "wall-empty", "Couldn't load the wall right now — try refreshing."));
  }
}

wallForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = wallNameInput.value.trim();
  const message = wallMessageInput.value.trim();
  if (!name || !message) return;

  const submitBtn = wallForm.querySelector("button[type=submit]");
  submitBtn.disabled = true;

  try {
    const { error } = await sb.rpc("submit_wall_message", {
      p_name: name,
      p_message: message,
    });
    if (error) throw error;

    wallForm.reset();
    await loadMessages();
  } catch (err) {
    console.error(err);
  } finally {
    submitBtn.disabled = false;
  }
});

adminToggle.addEventListener("click", () => {
  adminLoginForm.hidden = !adminLoginForm.hidden;
});

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminLoginError.hidden = true;

  try {
    const { error } = await sb.auth.signInWithPassword({
      email: adminEmailInput.value.trim(),
      password: adminPasswordInput.value,
    });
    if (error) throw error;

    adminLoginForm.reset();
  } catch (err) {
    adminLoginError.textContent = err.message || "Couldn't sign in — try again.";
    adminLoginError.hidden = false;
  }
});

adminSignOut.addEventListener("click", async () => {
  await sb.auth.signOut();
});

sb.auth.onAuthStateChange((_event, session) => {
  isAdmin = Boolean(session);
  adminToggle.hidden = isAdmin;
  adminLoginForm.hidden = true;
  adminBar.hidden = !isAdmin;
  loadMessages();
});

sb
  .channel("wall_messages_changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "wall_messages" }, () => {
    loadMessages();
  })
  .subscribe();

// Load immediately rather than waiting on auth initialization (which can be
// slow to resolve on a poor connection) — the auth listener above still
// re-fetches on sign-in/out so admin controls appear without a refresh.
loadMessages();
