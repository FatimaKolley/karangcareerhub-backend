const API_URL ="https://karangcareerhub-api.onrender.com/api";
const socket = io("https://karangcareerhub-api.onrender.com");

const token =
  localStorage.getItem("adminToken");

const admin =
  JSON.parse(
    localStorage.getItem("adminData")
  );


// Example receiver
const receiverId = 2;

socket.emit("joinRoom", {
  userId: admin.id
});

const messagesDiv =
  document.getElementById("messages");


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

    addMessage(
      data.senderId,
      data.message
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

    const message = input.value;

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
    socket.emit(
      "sendMessage",
      data
    );

    addMessage(
      admin.id,
      message
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
  senderId,
  message
) {

  const div =
    document.createElement("div");

  div.innerHTML =
    `<strong>${senderId}</strong>: ${message}`;

  messagesDiv.appendChild(div);
}