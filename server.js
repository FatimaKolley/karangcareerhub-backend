import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import multer from "multer";
import { createServer } from "http";
import { Server } from "socket.io";
import adminChatSocket
from "./socket/adminChatSocket.js";
import adminChatRoutes
from "./routes/adminChatRoutes.js";
import { setIO }
from "./socket/socket.js";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import xss from "xss-clean";


// =====================
// DB + ROUTES
// =====================
import db from "./db.js";
import userRoutes from "./routes/users.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationsRoutes from "./routes/applicationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import notificationRoutes from "./routes/notifications.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import chatUploadRoutes from "./routes/chatUploadRoutes.js";
import helmet from "helmet";


dotenv.config();

// =====================
// PATH SETUP
// =====================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================
// EXPRESS APP
// =====================
const app = express();
app.use(helmet());


// =====================
// CORS
// =====================
const allowedOrigins = [
  "https://karangcareerhub.netlify.app",
  "https://karangcareerhub.onrender.com",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

app.use(
  cors({
    origin(origin, callback) {
      // allow server-to-server / postman / mobile webview
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);


const limiter = rateLimit({

  windowMs: 15 * 60 * 1000,

  max: 100,

  message:
    "Too many requests. Try again later."
});

app.use(xss());
app.use(hpp());
app.use(limiter);
// =====================
// MIDDLEWARES
// =====================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// =====================
// STATIC UPLOADS
// =====================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// =====================
// HEALTH CHECK
// =====================
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "KarangCareerHub API running"
  });
});

// =====================
// API ROUTES
// =====================
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/admin-chat", adminChatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/chat-upload", chatUploadRoutes);
// =====================
// JOB SEARCH
// =====================
app.get("/api/jobs/search", async (req, res) => {
  try {
    const { title, type, category } = req.query;

    let sql = "SELECT * FROM jobs WHERE 1=1";
    const params = [];

    if (title && title.trim()) {
      sql += " AND (title LIKE ? OR company LIKE ?)";
      params.push(`%${title}%`, `%${title}%`);
    }

    if (type && type.trim()) {
      sql += " AND type = ?";
      params.push(type);
    }

    if (category && category.trim()) {
      sql += " AND category = ?";
      params.push(category);
    }

    sql += " ORDER BY created_at DESC";

    const [rows] = await db.execute(sql, params);

    res.json(rows);

  } catch (err) {
    console.error("Job search error:", err);

    res.status(500).json({
      error: "Error fetching jobs"
    });
  }
});


// =====================
// HTTP SERVER
// =====================
const httpServer = createServer(app);

// =====================
// SOCKET.IO
// =====================
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

setIO(io);

export { io };

// =====================
// ONLINE USERS
// userId => Set(socketIds)
// =====================
const onlineUsers = new Map();

// =====================
// SOCKET HELPERS
// =====================
function emitOnlineUsers() {
  io.emit(
    "onlineUsers",
    Array.from(onlineUsers.keys())
  );
}

async function emitUnreadCount(userId) {
  try {
    const [rows] = await db.execute(
      `
      SELECT COUNT(*) AS unread
      FROM messages
      WHERE receiver_id = ?
      AND is_read = FALSE
      `,
      [userId]
    );

    io.to(String(userId)).emit(
      "unreadCount",
      rows[0]?.unread || 0
    );

  } catch (err) {
    console.error("Unread count emit error:", err);
  }
}

// =====================
// SOCKET EVENTS
// =====================
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // =====================
  // JOIN ROOM
  // =====================
  socket.on("joinRoom", async ({ userId }) => {
    try {
      if (!userId) return;

      userId = String(userId);

      socket.join(userId);

      socket.userId = userId;

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }

      onlineUsers.get(userId).add(socket.id);

      emitOnlineUsers();

      await emitUnreadCount(userId);

      console.log("User online:", userId);

    } catch (err) {
      console.error("joinRoom error:", err);
    }
  });

  // =====================
  // SEND MESSAGE
  // =====================
  socket.on("sendMessage", async (data) => {
    try {
      let { senderId, receiverId, message,  fileUrl, fileType } = data;

      senderId = String(senderId);
      receiverId = String(receiverId);

      if (!senderId || !receiverId) return;

      if (!message || !message.trim()) return;

      message = message.trim();

      // save to DB
      const [result] = await db.execute(
        `
        INSERT INTO messages
        (
        sender_id,
        receiver_id,
        message,
        file_url,
        file_type,
        is_read
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          senderId,
          receiverId,
          message,
          fileUrl || null,
          fileType || null,
          false
        ]
      );

      // message payload
      const messageData = {

        id: result.insertId,
      
        senderId,
        receiverId,
        message,
      
        fileUrl,
        fileType,
      
        is_read: false,
      
        created_at: new Date()
      };

      // receiver gets message
      io.to(receiverId).emit(
        "receiveMessage",
        messageData
      );

      // sender gets own message
      socket.emit("receiveMessage", {
        ...messageData,
        self: true
      });

      // refresh unread count
      await emitUnreadCount(receiverId);

    } catch (err) {
      console.error("sendMessage error:", err);

      socket.emit("chatError", {
        message: "Failed to send message"
      });
    }
  });

  // =====================
  // TYPING
  // =====================
  socket.on("typing", ({ senderId, receiverId }) => {
    if (!receiverId) return;

    socket.to(String(receiverId)).emit("typing", {
      senderId: String(senderId)
    });
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    if (!receiverId) return;

    socket.to(String(receiverId)).emit("stopTyping", {
      senderId: String(senderId)
    });
  });

  // =====================
  // DISCONNECT
  // =====================
  socket.on("disconnect", () => {
    try {
      const userId = socket.userId;

      if (!userId) return;

      const sockets = onlineUsers.get(userId);

      if (sockets) {
        sockets.delete(socket.id);

        // remove user ONLY if all tabs/devices disconnected
        if (sockets.size === 0) {
          onlineUsers.delete(userId);

          console.log("User offline:", userId);
        }
      }

      emitOnlineUsers();

    } catch (err) {
      console.error("disconnect error:", err);
    }
  });

  // initial online list
  emitOnlineUsers();
});

// =====================
// MULTER ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer Error:", err);

    return res.status(400).json({
      error: `Upload error: ${err.code}${
        err.field ? ` (${err.field})` : ""
      }`
    });
  }

  if (err) {
    console.error("General Error:", err);

    return res.status(500).json({
      error: err.message || "Server error"
    });
  }

  next();
});



// =====================
// SPA FALLBACK
// MUST BE LAST
// =====================
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      error: "API route not found"
    });
  }

  res.sendFile(path.join(__dirname, "public/index.html"));
});
// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});