/*const socket =
io("http://localhost:5000");

const API_URL =
"http://localhost:5000/api";*/
const API_URL =
  "https://karangcareerhub-api.onrender.com/api";

const socket =
  io("https://karangcareerhub-api.onrender.com");

const token =
  localStorage.getItem("adminToken");

const admin =
  JSON.parse(
    localStorage.getItem("adminData")
  );

  let receiverId = null;

const messagesDiv =
  document.getElementById("messages");

// JOIN ROOM
socket.emit("joinRoom", {
  userId: admin.id
});

// ==========================
// ONLINE USERS
// ==========================
socket.on(
  "onlineUsers",
  (users) => {

    document.getElementById(
      "onlineUsers"
    ).innerHTML =
      `
      <strong>Online Users</strong>
      <br><br>
      ${users.join("<br>")}
      `;
  }
);

// ==========================
// RECEIVE MESSAGE
// ==========================
socket.on("receiveMessage", (data) => {

  if(Number(data.senderId) === Number(admin.id)) return;

  addMessage(
    data.message,
    "received",
    data.created_at
  );
});

// ==========================
// TYPING
// ==========================
socket.on("typing", () => {

  document.getElementById(
    "typing"
  ).innerText =
    "Typing...";
});

socket.on("stopTyping", () => {

  document.getElementById(
    "typing"
  ).innerText = "";
});


// ==========================
// LOAD SUPER ADMIN
// ==========================
async function loadSuperAdmin() {
  try {
    const response = await fetch(
      `${API_URL}/super-admin/super-admin`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      console.log("Auth failed:", response.status);
      return;
    }

    const superAdmin = await response.json();

    console.log("Super Admin:", superAdmin);

    if (!superAdmin?.id) {
      showToast("Super admin not found");
      return;
    }

    receiverId = superAdmin.id;

    console.log("Receiver ID set:", receiverId);

  } catch (error) {
    console.log(error);
  }
}

async function init() {

  await loadSuperAdmin();

  await loadMessages();

}

init();

// ==========================
// FILE UPLOAD
// ==========================
async function uploadChatFile() {

  const fileInput =
    document.getElementById(
      "chatFile"
    );

  const file =
    fileInput.files[0];

  if (!file) return null;

  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  const response = await fetch(
    `${API_URL}/chat-upload`,
    {
      method:"POST",
      body:formData
    }
  );

  return await response.json();
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

    let uploadedFile = null;

    if (
      document.getElementById(
        "chatFile"
      ).files.length > 0
    ) {

      uploadedFile =
        await uploadChatFile();
    }

    const data = {

      senderId: admin.id,

      receiverId,

      message,

      fileUrl:
        uploadedFile?.fileUrl || null,

      fileType:
        uploadedFile?.fileType || null
    };

        // SAVE TO DATABASE
    await fetch(
      `${API_URL}/admin-chat/send`,
      {
        method:"POST",

        headers:{
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`
        },

        body:JSON.stringify(data)
      }
    );

    // REALTIME SOCKET

    addMessage(
      message,
      "sent",
      new Date()
    );

    input.value = "";

    document.getElementById(
      "chatFile"
    ).value = "";

    socket.emit(
      "stopTyping",
      data
    );
  }
);

// ==========================
// TYPING EVENT
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
  message,
  type,
  createdAt = null
) {

  const div =
    document.createElement("div");

  div.classList.add(
    "message",
    type
  );

  let time = "";

  if (createdAt) {

    const date =
      new Date(createdAt);

    time =
      date.toLocaleString();
  }

  div.innerHTML = `
    <div>
      ${message}
    </div>

    <small
      style="
        display:block;
        margin-top:5px;
        opacity:0.7;
        font-size:11px;
      "
    >
      ${time}
    </small>
  `;

  messagesDiv.appendChild(div);

  messagesDiv.scrollTop =
    messagesDiv.scrollHeight;
}


// ==========================
// LOAD OLD MESSAGES
// ==========================

async function loadMessages() {

  if (!receiverId) return;

  try {

    const response = await fetch(
      `${API_URL}/admin-chat/${receiverId}`,
      {
        headers:{
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
        msg.message,

        Number(msg.sender_id) ===
        Number(admin.id)
          ? "sent"
          : "received",

        msg.created_at
      );
    });

  } catch(error) {

    console.log(error);
  }
}

socket.on("notification", (data) => {
  showToast(
    "New message from admin!",
    "success"
  );});

  socket.on("newNotification", (data) => {

    showToast(
      `${data.title}: ${data.message}`,
      "info"
    );
  
  });
  
  socket.on("unreadCount", (count) => {
    updateBadge(count);
  });

 function updateBadge(count){

  const badge =
    document.getElementById(
      "notificationBadge"
    );

  if(count <= 0){

    badge.style.display =
      "none";

    return;
  }

  badge.style.display =
    "inline-flex";

  badge.innerText =
    count;
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