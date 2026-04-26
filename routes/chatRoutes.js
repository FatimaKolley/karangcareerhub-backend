import express from "express";
import db from "../db.js";
import auth from "../middleware/auth.js";
const router = express.Router();

// GET MESSAGES
router.get("/messages/:user1/:user2", auth, async (req, res) => {
  const { user1, user2 } = req.params;

  const [rows] = await db.execute(
    `SELECT * FROM messages 
     WHERE (sender_id=? AND receiver_id=?)
     OR (sender_id=? AND receiver_id=?)
     ORDER BY created_at ASC`,
    [user1, user2, user2, user1]
  );

  res.json(rows);
});

// GET CHAT USERS (INBOX)
router.get("/users/:userId", auth, async (req, res) => {
  const { userId } = req.params;

  const [rows] = await db.execute(`
    SELECT DISTINCT 
      u.id, u.first_name, u.last_name
    FROM messages m
    JOIN users u 
      ON u.id = IF(m.sender_id = ?, m.receiver_id, m.sender_id)
    WHERE m.sender_id = ? OR m.receiver_id = ?
  `, [userId, userId, userId]);

  res.json(rows);
});

/*=================================
unread
==============================================*/
  router.put("/messages/read/:senderId/:receiverId", auth, async (req, res) =>{
  const { senderId, receiverId } = req.params;

  await db.execute(
    "UPDATE messages SET is_read = TRUE WHERE sender_id=? AND receiver_id=?",
    [senderId, receiverId]
  );

  res.json({ success: true });
});

router.get("/unread", auth, async (req, res) => {
  const userId = req.user.id;

  const [rows] = await db.execute(
    "SELECT COUNT(*) as unread FROM messages WHERE receiver_id=? AND is_read=FALSE",
    [userId]
  );

  res.json(rows[0]);
});
export default router;