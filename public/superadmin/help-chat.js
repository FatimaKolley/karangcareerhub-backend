 /* const API_URL =
  "http://localhost:5000/api";
  const socket =
io("http://localhost:5000");*/
const API_URL ="https://karangcareerhub-api.onrender.com/api";
const socket = io("https://karangcareerhub-api.onrender.com");


const token =
  localStorage.getItem("adminToken");

  const admin =
  JSON.parse(localStorage.getItem("adminData") || "{}");

  if(!admin.id){
  console.error("Admin not logged in");
  };

  const params = new URLSearchParams(window.location.search);
  const receiverId = params.get("admin");


  if(admin?.id){
    socket.emit("joinRoom", {
      userId: admin.id
    });
  }
  
const messagesDiv =
  document.getElementById("messages");
    // ==========================
// LOAD ADMINS AUTOMATICALLY
// ==========================

async function loadAdmins() {

  try {

    const response = await fetch(
      `${API_URL}/super-admin/admins`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    const admins =
      await response.json();

    const adminList =
      document.getElementById(
        "adminList"
      );

    adminList.innerHTML = "";

    admins.forEach(adminData => {

      // don't show yourself
      if (
        Number(adminData.id) ===
        Number(admin.id)
      ) return;

      adminList.innerHTML += `
        <a
          href="help-chat.html?admin=${adminData.id}"
          class="admin-item"
        >
          ${adminData.fullname}
        </a>
      `;
    });

  } catch(error) {

    console.log(error);
  }
}

loadAdmins();

// ==========================
// ONLINE USERS
// ==========================
socket.on(
  "onlineUsers",
  (users) => {

    document.getElementById(
      "onlineUsers"
    ).innerText =
      `Online Users: ${users.join(", ")}`;
  }
);


// ==========================
// RECEIVE MESSAGE
// ==========================
socket.on(
  "receiveMessage",
  (data) => {

    // ignore own messages
    if (
      Number(data.senderId) ===
      Number(admin.id)
    ) {
      return;
    }

    addMessage(
      data.senderId,
      data.message,
      data.created_at
    );
  }
);


// ==========================
// TYPING
// ==========================
socket.on("typing", () => {

  document.getElementById(
    "typing"
  ).innerText = "Typing...";
});

socket.on("stopTyping", () => {

  document.getElementById(
    "typing"
  ).innerText = "";
});

// ==========================
// LOAD OLD MESSAGES
// ==========================
async function loadMessages() {

  try {

    const response = await fetch(
      `${API_URL}/admin-chat/${receiverId}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    const messages =
      await response.json();

    messagesDiv.innerHTML = "";

    messages.forEach(msg => {

      addMessage(
        msg.sender_id,
        msg.message,
        msg.created_at
      );
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

  } catch(error) {

    console.log(error);
  }
}
if(receiverId){
  loadMessages();
}

// ==========================
// SEND MESSAGE
// ==========================
document.getElementById(
  "sendBtn"
).addEventListener(
  "click",
  async () => {

    const input =
      document.getElementById(
        "messageInput"
      );

      const message =
      input.value.trim();
    
    if (!message) return;
    if (!receiverId) {
      showToast("Select an admin first");
      return;
    }
    
    const data = {
      senderId: admin.id,
      receiverId,
      message
    };

    // Save to DB
    await fetch(
      `${API_URL}/admin-chat/send`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`
        },

        body: JSON.stringify(data)
      }
    );

    // Send realtime

    addMessage(
      admin.id,
      message,
      new Date()
    );

    input.value = "";

    socket.emit(
      "stopTyping",
      data
    );
  }
);


// ==========================
// TYPING EVENTS
// ==========================
document.getElementById(
  "messageInput"
).addEventListener(
  "input",
  () => {

    if(receiverId){
      socket.emit("typing", {
        senderId: admin.id,
        receiverId
      });
    }

    setTimeout(() => {

      if(receiverId){
        socket.emit("stopTyping", {
          senderId: admin.id,
          receiverId
        });
      }

    }, 1000);
  }
);


// ==========================
// ADD MESSAGE
// ==========================
function addMessage(
  senderId,
  message,
  createdAt = null
) {

  const div =
    document.createElement("div");

  div.style.marginBottom = "10px";

  div.style.display = "flex";

  div.style.justifyContent =
    Number(senderId) === Number(admin.id)
      ? "flex-end"
      : "flex-start";

  let time = "";

  if (createdAt) {

    const date =
      new Date(createdAt);

    time =
      date.toLocaleString();
  }

  div.innerHTML = `
    <div style="
      background:
      ${Number(senderId) === Number(admin.id)
        ? '#043972'
        : '#e4e6eb'};

      color:
      ${Number(senderId) === Number(admin.id)
        ? 'white'
        : 'black'};

      padding:10px;
      border-radius:10px;
      max-width:70%;
    ">

      <div>
        ${message}
      </div>

      <div style="
        font-size:11px;
        margin-top:5px;
        opacity:0.7;
        text-align:right;
      ">
        ${time}
      </div>

    </div>
  `;

  messagesDiv.appendChild(div);

  messagesDiv.scrollTop =
    messagesDiv.scrollHeight;
}

socket.on("unreadCount", (count) => {
  updateBadge(count);
});

function updateBadge(count){

  const badge = document.getElementById("notificationBadge");
  if(!badge) return;

  if(count <= 0){
    badge.style.display = "none";
    badge.innerText = "";
    return;
  }

  badge.style.display = "inline-flex";
  badge.innerText = count;
}

function showToast(message, type = "info") {

  const container =
    document.getElementById(
      "toastContainer"
    );

  const toast =
    document.createElement("div");

  toast.className =
    `toast ${type}`;

  toast.innerText =
    message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}