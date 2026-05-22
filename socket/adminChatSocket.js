const onlineUsers = {};

const adminChatSocket = (io) => {

  io.on("connection", (socket) => {

    console.log("New socket connected");

    // ==========================
    // USER ONLINE
    // ==========================
    socket.on("join", (adminId) => {

      onlineUsers[adminId] = socket.id;

      io.emit(
        "onlineUsers",
        Object.keys(onlineUsers)
      );
    });

    // ==========================
    // SEND MESSAGE
    // ==========================
    socket.on("sendMessage", (data) => {

      const {
        senderId,
        receiverId,
        message
      } = data;

      const receiverSocketId =
        onlineUsers[receiverId];

      if (receiverSocketId) {

        io.to(receiverSocketId)
          .emit("receiveMessage", data);
      }
    });

    // ==========================
    // TYPING
    // ==========================
    socket.on("typing", (data) => {

      const receiverSocketId =
        onlineUsers[data.receiverId];

      if (receiverSocketId) {

        io.to(receiverSocketId)
          .emit("typing", data);
      }
    });

    // ==========================
    // STOP TYPING
    // ==========================
    socket.on("stopTyping", (data) => {

      const receiverSocketId =
        onlineUsers[data.receiverId];

      if (receiverSocketId) {

        io.to(receiverSocketId)
          .emit("stopTyping", data);
      }
    });

    // ==========================
    // DISCONNECT
    // ==========================
    socket.on("disconnect", () => {

      for (const adminId in onlineUsers) {

        if (
          onlineUsers[adminId] === socket.id
        ) {
          delete onlineUsers[adminId];
        }
      }

      io.emit(
        "onlineUsers",
        Object.keys(onlineUsers)
      );

      console.log("Socket disconnected");
    });
  });
};

export default adminChatSocket;