import express from "express";
import db from "../db.js";
import auth from "../middleware/auth.js";


const router = express.Router();

/* ===============================
   RECORD JOB VIEW
================================ */
router.post("/record-view", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { job_id } = req.body;

    await db.execute(
      `INSERT INTO job_views (user_id, job_id) VALUES (?, ?)`,
      [userId, job_id]
    );

    res.json({ message: "View recorded" });

  } catch (err) {
    console.error("RECORD VIEW ERROR:", err);
    res.status(500).json({ error: "Failed to record view" });
  }
});

/* ===============================
   GET USER HISTORY
================================ */
router.get("/my-history", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.execute(
      `SELECT 
          j.id AS job_id,
          j.title,
          j.employer,
          j.skills,
          j.deadline,
          j.description,
          v.viewed_at
       FROM job_views v
       JOIN jobs j ON v.job_id = j.id
       WHERE v.user_id = ?
       ORDER BY v.viewed_at DESC`,
      [userId]
    );

    res.json(rows);

  } catch (err) {
    console.error("HISTORY LOAD ERROR:", err);
    res.status(500).json({ error: "Failed to load history" });
  }
});

export default router;
