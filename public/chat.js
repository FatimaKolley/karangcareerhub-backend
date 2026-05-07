const API_URL = "https://karangcareerhub-api.onrender.com/api";
const SOCKET_URL = "https://karangcareerhub-api.onrender.com";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"]
});

const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!user.id) {
  window.location.href = "login.html";
}

const senderId = user.id;
let receiverId = null;

// JOIN ROOM
socket.on("connect", () => {
  socket.emit("joinRoom", { userId: String(senderId) });
});

// RECEIVE MESSAGE
socket.on("receiveMessage", (data) => {

  // show in chat
  if (data.senderId == receiverId) {
    displayMessage(data, false);
  }

  // 🔔 notification (only when not active chat)
  if (data.senderId != receiverId && Notification.permission === "granted") {
    const notification = new Notification("New Message", {
      body: data.message
    });

    notification.onclick = () => {
      window.focus();
    };
  }
});

document.addEventListener("click", () => {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
}, { once: true });

// 🔔 UNREAD COUNT
socket.on("unreadCount", (count) => {
  const badge = document.getElementById("notificationBadge");

  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline-block" : "none";
  }
});

// ONLINE USERS
socket.on("onlineUsers", (users) => {
  users.forEach(userId => {
    const el = document.getElementById(`status-${userId}`);
    if (el) el.textContent = "🟢 Online";
  });
});

// LOAD CHAT USERS
async function loadChatUsers() {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${API_URL}/chat/users/${senderId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const users = await res.json();

  const container = document.getElementById("chatUsers");
  container.innerHTML = "";

  users.forEach(u => {
    const div = document.createElement("div");
    div.className = "chat-user";

    div.innerHTML = `
      ${u.first_name} ${u.last_name}
      <span id="status-${u.id}">⚫</span>
    `;

    div.onclick = () => selectUser(u);

    container.appendChild(div);
  });

  if (users.length > 0) {
    selectUser(users[0]);
  }
}

// SELECT USER
async function selectUser(u) {
  receiverId = u.id;

  const token = localStorage.getItem("token");

  document.getElementById("chatHeader").innerHTML =
    `${u.first_name} ${u.last_name} <span id="status-${u.id}">⚫</span>`;

  document.getElementById("messages").innerHTML = "";

  // mark as read
  await fetch(
    `${API_URL}/chat/messages/read/${receiverId}/${senderId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  // load messages
  const res = await fetch(
    `${API_URL}/chat/messages/${senderId}/${receiverId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const messages = await res.json();

  messages.forEach(msg => {
    displayMessage(msg, (msg.sender_id || msg.senderId) == senderId);
    });

  loadUnread();
}

// SEND MESSAGE ✅ (NOW WORKS)
function sendMessage() {
  const input = document.getElementById("messageInput");
  const message = input.value;

  if (!receiverId || !message.trim()) {
    alert("Select a chat and type a message");
    return;
  }

  const data = {
    senderId,
    receiverId,
    message
  };

  socket.emit("sendMessage", data);
  displayMessage(data, true);

  input.value = "";
}

// DISPLAY MESSAGE
function displayMessage(data, isMe) {
  const div = document.createElement("div");
  div.className = isMe ? "me" : "them";

  const time = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  div.innerHTML = `
    <p>${escapeHTML(data.message)}</p>
    <small>${time}</small>
  `;

  const container = document.getElementById("messages");
  container.appendChild(div);

  container.scrollTop = container.scrollHeight;
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[m]);
}

// TYPING
let typingTimeout;

function handleTyping() {
  socket.emit("typing", { senderId, receiverId });

  clearTimeout(typingTimeout);

  typingTimeout = setTimeout(() => {
    socket.emit("stopTyping", { senderId, receiverId });
  }, 1000);
}

socket.on("typing", () => {
  document.getElementById("typingIndicator").textContent = "Typing...";
});

socket.on("stopTyping", () => {
  document.getElementById("typingIndicator").textContent = "";
});

// ONLINE STATUS
socket.on("userOnline", (userId) => {
  const el = document.getElementById(`status-${userId}`);
  if (el) el.textContent = "🟢 Online";
});

socket.on("userOffline", (userId) => {
  const el = document.getElementById(`status-${userId}`);
  if (el) el.textContent = "⚫ Offline";
});

// LOAD UNREAD
async function loadUnread() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/chat/unread`, {
      headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  const badge = document.getElementById("notificationBadge");

  if (badge) {
    badge.textContent = data.unread;
    badge.style.display = data.unread > 0 ? "inline-block" : "none";
  }
}

// NOTIFICATION PERMISSION
if ("Notification" in window) {
  Notification.requestPermission();
}

socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

// INIT
loadChatUsers();