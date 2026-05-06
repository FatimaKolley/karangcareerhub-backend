import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import multer from "multer";

// DB + Routes
import db from "./db.js";
import userRoutes from "./routes/users.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationsRoutes from "./routes/applicationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";


dotenv.config();

// PATH SETUP
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// APP INIT
const app = express();

// MIDDLEWARES
app.use(cors({
  origin: "*"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
/* ===============================
   🔗 MAIN API ROUTES
=================================*/
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/chat", chatRoutes);

/* ===============================
   JOB SEARCH (kept separate)
=================================*/
app.get("/api/jobs/search", async (req, res) => {
  const { title, type, category } = req.query;
  let sql = "SELECT * FROM jobs WHERE 1=1";

  if (title) sql += ` AND (title LIKE '%${title}%' OR company LIKE '%${title}%')`;
  if (type) sql += ` AND type='${type}'`;
  if (category) sql += ` AND category='${category}'`;

  sql += " ORDER BY created_at DESC";

  try {
    const [rows] = await db.execute(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error fetching jobs" });
  }
});

/* ===============================
   MULTER ERROR HANDLER
=================================*/
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("❌ Multer Error Code:", err.code);
    console.error("❌ Multer Field:", err.field);
    console.error("❌ Full Multer Error:", err);

    return res.status(400).json({
      error: `Upload error: ${err.code}${err.field ? ` (field: ${err.field})` : ""}`
    });
  }

  if (err) {
    console.error("❌ General Error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }

  next();
});

/* ===============================
   ⚠️ SPA FALLBACK — MUST BE LAST
=================================*/
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* ===============================
   START SERVER
=================================*/
import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  }
});

// =====================
// SOCKET.IO LOGIC
// =====================
const onlineUsers = new Map();

io.on("connection", (socket) => {

  socket.on("joinRoom", ({ userId }) => {
    socket.join(String(userId));

    // ✅ mark user online
    onlineUsers.set(String(userId), socket.id);

    // 🔔 notify others
    io.emit("userOnline", userId);

    console.log("User online:", userId);
  });

  // Send message
  socket.on("sendMessage", async (data) => {
    const { senderId, receiverId, message } = data;
  
    // save with unread
    await db.execute(
      "INSERT INTO messages (sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, ?)",
      [senderId, receiverId, message, false]
    );
  
    // send message
    io.to(String(receiverId)).emit("receiveMessage", {
      ...data,
      senderName: "User" // later fetch from DB
    });
    
    // send unread count update
    const [rows] = await db.execute(
      "SELECT COUNT(*) as unread FROM messages WHERE receiver_id=? AND is_read=FALSE",
      [receiverId]
    );
  
    const unread = rows[0].unread;
  
    io.to(String(receiverId)).emit("unreadCount", rows[0].unread);
  });

  socket.on("disconnect", () => {
    let disconnectedUser = null;

    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        disconnectedUser = userId;
        onlineUsers.delete(userId);
        break;
      }
    }

    if (disconnectedUser) {
      io.emit("userOffline", disconnectedUser);
      console.log("User offline:", disconnectedUser);
    }
  });


  socket.on("typing", ({ senderId, receiverId }) => {
    socket.to(String(receiverId)).emit("typing");
  });
  
  socket.on("stopTyping", ({ senderId, receiverId }) => {
    socket.to(String(receiverId)).emit("stopTyping");
  });

  socket.emit("onlineUsers", Array.from(onlineUsers.keys()));

  
});


// START SERVER
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
