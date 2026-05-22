const socket =
  io("http://localhost:5000");

const token =
  localStorage.getItem("token");

const admin =
  JSON.parse(localStorage.getItem("admin"));


// Example receiver
const receiverId = 2;

socket.emit("join", admin.id);

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
      "http://localhost:5000/api/admin-chat/send",
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