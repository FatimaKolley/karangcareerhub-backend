const API_URL = "https://karangcareerhub-api.onrender.com/api";
const SOCKET_URL = "https://karangcareerhub-api.onrender.com";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

// =============================================
// AUTH
// =============================================
const user = JSON.parse(localStorage.getItem("user") || "{}");
const token = localStorage.getItem("token");

if (!user.id || !token) {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

const senderId = String(user.id);
let receiverId = null;
let onlineUsers = [];
let selectedUserRequestId = 0;

// =============================================
// URL PARAMS
// =============================================
const urlParams = new URLSearchParams(window.location.search);
const targetUserId = urlParams.get("user");

// =============================================
// HELPERS
// =============================================
function getAuthHeaders() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
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

function scrollMessagesToBottom() {
  const container = document.getElementById("messages");

  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function updateBadge(count = 0) {
  const badge = document.getElementById("notificationBadge");

  if (!badge) return;

  badge.textContent = count;
  badge.style.display = count > 0 ? "inline-block" : "none";
}

function updateOnlineStatusUI() {
  document.querySelectorAll("[id^='status-']").forEach(el => {
    const id = el.id.replace("status-", "");

    el.textContent = onlineUsers.includes(String(id))
      ? "🟢 Online"
      : "⚫ Offline";
  });
}

// =============================================
// SOCKET CONNECTION
// =============================================
socket.on("connect", () => {
  console.log("✅ Socket connected");

  socket.emit("joinRoom", {
    userId: senderId
  });

  loadUnread();
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket connection error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("⚠️ Socket disconnected:", reason);
});

socket.on("reconnect", () => {
  console.log("🔄 Socket reconnected");

  socket.emit("joinRoom", {
    userId: senderId
  });

  loadUnread();
});

// =============================================
// RECEIVE MESSAGE
// =============================================
socket.on("receiveMessage", (data) => {
  const incomingSender = String(
    data.senderId || data.sender_id
  );

  // Message from me
  if (data.self) {
    displayMessage(data, true);
    return;
  }

  // Only show if chat is currently open
  if (incomingSender === String(receiverId)) {
    displayMessage(data, false);

    // Mark instantly as read
    markMessagesAsRead(receiverId);
  }

  // Browser notification
  if (
    document.hidden &&
    incomingSender !== String(receiverId) &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    const notification = new Notification("New Message", {
      body: data.message || "You received a message"
    });

    notification.onclick = () => {
      window.focus();
    };
  }

  loadUnread();
});

// =============================================
// NOTIFICATION PERMISSION
// =============================================
document.addEventListener("click", () => {
  if (
    "Notification" in window &&
    Notification.permission !== "granted"
  ) {
    Notification.requestPermission();
  }
}, { once: true });

// =============================================
// UNREAD COUNT
// =============================================
socket.on("unreadCount", (count) => {
  updateBadge(count);
});

async function loadUnread() {
  try {
    const res = await fetch(`${API_URL}/chat/unread`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      throw new Error("Unread fetch failed");
    }

    const data = await res.json();

    updateBadge(data.unread || 0);

  } catch (err) {
    console.error("Unread count error:", err);
  }
}

// =============================================
// LOAD CHAT USERS
// =============================================
async function loadChatUsers() {
  try {
    const res = await fetch(
      `${API_URL}/chat/users/${senderId}`,
      {
        headers: getAuthHeaders()
      }
    );

    if (!res.ok) {
      throw new Error("Failed to load chat users");
    }

    const users = await res.json();

    const container = document.getElementById("chatUsers");

    if (!container) return;

    container.innerHTML = "";

    if (!Array.isArray(users) || users.length === 0) {
      container.innerHTML = `
        <p class="empty-chat-users">
          No chats available yet.
        </p>
      `;
      return;
    }

    users.forEach(u => {
      const div = document.createElement("div");

      div.className = "chat-user";

      div.innerHTML = `
        <div class="chat-user-name">
          ${escapeHTML(u.first_name || "")}
          ${escapeHTML(u.last_name || "")}
        </div>

        <span id="status-${u.id}">
          ⚫ Offline
        </span>
      `;

      div.addEventListener("click", () => {
        selectUser(u);
      });

      container.appendChild(div);
    });

    updateOnlineStatusUI();

    // Auto open target user
    if (targetUserId) {
      const target = users.find(
        u => String(u.id) === String(targetUserId)
      );

      if (target) {
        selectUser(target);
        return;
      }
    }

    // Open first user
    selectUser(users[0]);

  } catch (err) {
    console.error("Load chat users error:", err);

    const container = document.getElementById("chatUsers");

    if (container) {
      container.innerHTML = `
        <p class="error-text">
          Failed to load chats.
        </p>
      `;
    }
  }
}

// =============================================
// SELECT USER
// =============================================
async function selectUser(u) {
  try {
    if (!u || !u.id) return;

    receiverId = String(u.id);

    // Prevent race condition
    const requestId = ++selectedUserRequestId;

    const header = document.getElementById("chatHeader");

    if (header) {
      header.innerHTML = `
        ${escapeHTML(u.first_name || "")}
        ${escapeHTML(u.last_name || "")}
        <span id="status-${u.id}">
          ${onlineUsers.includes(receiverId)
            ? "🟢 Online"
            : "⚫ Offline"}
        </span>
      `;
    }

    const messagesContainer = document.getElementById("messages");

    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <p class="loading-chat">
          Loading messages...
        </p>
      `;
    }

    // Mark messages as read
    await markMessagesAsRead(receiverId);

    // Load messages
    const res = await fetch(
      `${API_URL}/chat/messages/${senderId}/${receiverId}`,
      {
        headers: getAuthHeaders()
      }
    );

    if (!res.ok) {
      throw new Error("Failed to load messages");
    }

    const messages = await res.json();

    // Ignore outdated request
    if (requestId !== selectedUserRequestId) {
      return;
    }

    if (messagesContainer) {
      messagesContainer.innerHTML = "";
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      if (messagesContainer) {
        messagesContainer.innerHTML = `
          <p class="empty-chat">
            No messages yet.
          </p>
        `;
      }

      return;
    }

    messages.forEach(msg => {
      displayMessage(
        msg,
        String(msg.sender_id || msg.senderId) === senderId
      );
    });

    scrollMessagesToBottom();
    loadUnread();

  } catch (err) {
    console.error("Select user error:", err);

    const container = document.getElementById("messages");

    if (container) {
      container.innerHTML = `
        <p class="error-text">
          Failed to load messages.
        </p>
      `;
    }
  }
}

// =============================================
// MARK READ
// =============================================
async function markMessagesAsRead(userId) {
  try {
    await fetch(
      `${API_URL}/chat/messages/read/${userId}/${senderId}`,
      {
        method: "PUT",
        headers: getAuthHeaders()
      }
    );

  } catch (err) {
    console.error("Mark read error:", err);
  }
}

// =============================================
// SEND MESSAGE
// =============================================
function sendMessage() {
  const input = document.getElementById("messageInput");

  if (!input) return;

  const message = input.value.trim();

  if (!receiverId) {
    alert("Please select a chat first.");
    return;
  }

  if (!message) {
    return;
  }

  socket.emit("sendMessage", {
    senderId,
    receiverId,
    message
  });

  input.value = "";

  socket.emit("stopTyping", {
    senderId,
    receiverId
  });
}

// =============================================
// ENTER KEY SEND
// =============================================
const messageInput = document.getElementById("messageInput");

if (messageInput) {
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  messageInput.addEventListener("input", () => {
    handleTyping();
  });
}

// =============================================
// DISPLAY MESSAGE
// =============================================
function displayMessage(data, isMe) {
  const container = document.getElementById("messages");

  if (!container) return;

  // Prevent duplicate messages
  const tempId = `
    ${data.senderId || data.sender_id}
    ${data.message}
    ${data.created_at}
  `;

  if (
    document.querySelector(`[data-msg-id="${CSS.escape(tempId)}"]`)
  ) {
    return;
  }

  const div = document.createElement("div");

  div.className = isMe ? "me" : "them";

  div.setAttribute("data-msg-id", tempId);

  const time = new Date(
    data.created_at || Date.now()
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  div.innerHTML = `
    <p>${escapeHTML(data.message || "")}</p>
    <small>${time}</small>
  `;

  container.appendChild(div);

  scrollMessagesToBottom();
}

// =============================================
// TYPING INDICATOR
// =============================================
let typingTimeout;

function handleTyping() {
  if (!receiverId) return;

  socket.emit("typing", {
    senderId,
    receiverId
  });

  clearTimeout(typingTimeout);

  typingTimeout = setTimeout(() => {
    socket.emit("stopTyping", {
      senderId,
      receiverId
    });
  }, 1000);
}

socket.on("typing", ({ senderId: typingUser }) => {
  if (String(typingUser) === String(receiverId)) {
    const indicator = document.getElementById("typingIndicator");

    if (indicator) {
      indicator.textContent = "Typing...";
    }
  }
});

socket.on("stopTyping", ({ senderId: typingUser }) => {
  if (String(typingUser) === String(receiverId)) {
    const indicator = document.getElementById("typingIndicator");

    if (indicator) {
      indicator.textContent = "";
    }
  }
});

// =============================================
// ONLINE STATUS
// =============================================
socket.on("onlineUsers", (users) => {
  onlineUsers = users.map(String);

  updateOnlineStatusUI();
});

// =============================================
// INIT
// =============================================
(async function initChat() {
  try {
    await loadUnread();
    await loadChatUsers();

  } catch (err) {
    console.error("Chat init error:", err);
  }
})();