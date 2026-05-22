import express from "express";
import db from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* =========================
   GET USER NOTIFICATIONS
========================= */
router.get("/", auth, async (req, res) => {

  try {

    const [rows] = await db.execute(
      `
      SELECT *
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [req.user.id]
    );

    res.json(rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to load notifications"
    });
  }
});

/* =========================
   MARK AS READ
========================= */
router.put("/:id/read", auth, async (req, res) => {

  try {

    await db.execute(
      `
      UPDATE notifications
      SET is_read = 1
      WHERE id = ?
      AND user_id = ?
      `,
      [req.params.id, req.user.id]
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to update notification"
    });
  }
});

/* =========================
   MARK ALL AS READ
========================= */
router.put("/read-all", auth, async (req, res) => {

  try {

    await db.execute(
      `
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ?
      `,
      [req.user.id]
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed"
    });
  }
});


/* =========================
   DELETE NOTIFICATION
========================= */
router.delete("/:id", auth, async (req, res) => {
  try {

    await db.execute(
      `DELETE FROM notifications
       WHERE id=? AND user_id=?`,
      [req.params.id, req.user.id]
    );

    res.json({
      message: "Notification deleted"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Delete failed"
    });
  }
});

export default router;