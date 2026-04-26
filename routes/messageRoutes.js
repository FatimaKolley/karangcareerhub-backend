import express from "express";
import db from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Send message
router.post("/", auth, async (req, res) => {
  const { receiver_id, message } = req.body;

  await db.execute(
    "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
    [req.user.id, receiver_id, message]
  );

  res.json({ success: true });
});

// Get conversation
router.get("/:userId", auth, async (req, res) => {
  const otherId = req.params.userId;

  const [rows] = await db.execute(
    `SELECT * FROM messages 
     WHERE (sender_id=? AND receiver_id=?)
     OR (sender_id=? AND receiver_id=?)
     ORDER BY created_at ASC`,
    [req.user.id, otherId, otherId, req.user.id]
  );

  res.json(rows);
});

export default router;