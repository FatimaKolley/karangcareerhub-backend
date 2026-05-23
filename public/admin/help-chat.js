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

const receiverId = 2;

const messagesDiv =
  document.getElementById("messages");

// JOIN ROOM
socket.emit(
  "joinRoom",
  {
    userId: admin.id
  }
);

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
socket.on(
  "receiveMessage",
  (data) => {

    addMessage(
      data.message,
      "received"
    );
  }
);

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

    socket.emit(
      "sendMessage",
      data
    );

    addMessage(
      message,
      "sent"
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

    socket.emit(
      "typing",
      {
        senderId: admin.id,
        receiverId
      }
    );

    setTimeout(() => {

      socket.emit(
        "stopTyping",
        {
          senderId: admin.id,
          receiverId
        }
      );

    }, 1000);
  }
);

// ==========================
// ADD MESSAGE
// ==========================
function addMessage(
  message,
  type
) {

  const div =
    document.createElement("div");

  div.classList.add(
    "message",
    type
  );

  div.innerHTML = message;

  messagesDiv.appendChild(div);

  messagesDiv.scrollTop =
    messagesDiv.scrollHeight;
}