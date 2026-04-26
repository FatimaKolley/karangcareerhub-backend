import express from "express";
import multer from "multer";
import path from "path";
import db from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

/* ===============================
   MULTER CONFIG
================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/jobs");
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() !== ".pdf") {
    return cb(new Error("Only PDF files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

/* =============================
   GET RECENT JOBS
============================= */
router.get("/recent/limit", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT j.*, CONCAT(u.first_name, ' ', u.last_name) AS employer_name
      FROM jobs j
      LEFT JOIN users u ON j.employer_id = u.id
      ORDER BY j.created_at DESC
      LIMIT 4
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Recent Jobs Error:", err);
    res.status(500).json({ error: "Failed to load recent jobs" });
  }
});

/* =============================
   GET POPULAR JOBS
============================= */
router.get("/popular/limit", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT j.*, CONCAT(u.first_name, ' ', u.last_name) AS employer_name
      FROM jobs j
      LEFT JOIN users u ON j.employer_id = u.id
      ORDER BY j.views DESC
      LIMIT 4
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Popular Jobs Error:", err);
    res.status(500).json({ error: "Failed to load popular jobs" });
  }
});

/* =============================
   BROWSE JOBS
============================= */
router.get("/browse", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT j.*, CONCAT(u.first_name, ' ', u.last_name) AS employer_name
      FROM jobs j
      LEFT JOIN users u ON j.employer_id = u.id
      ORDER BY j.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Browse Jobs Error:", err);
    res.status(500).json({ error: "Failed to load browse jobs" });
  }
});

/* =============================
   GET ALL JOBS
============================= */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        j.*,
        CONCAT(u.first_name, ' ', u.last_name) AS employer_name,
        COUNT(a.id) AS applicants_count
      FROM jobs j
      LEFT JOIN users u ON j.employer_id = u.id
      LEFT JOIN applications a ON j.id = a.job_id
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch Jobs Error:", err);
    res.status(500).json({ error: "Failed to load jobs" });
  }
});

/* =============================
   JOB RECOMMENDATIONS
============================= */
router.get("/recommendations/:userId", async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT skills FROM users WHERE id = ? LIMIT 1",
      [req.params.userId]
    );

    if (!users.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const userSkills = users[0].skills
      ? users[0].skills.split(",").map(s => s.trim().toLowerCase())
      : [];

    const [jobs] = await db.execute(`
      SELECT id, title, description, skills
      FROM jobs
    `);

    const matched = jobs.map(job => {
      const jobSkills = job.skills
        ? job.skills.split(",").map(s => s.trim().toLowerCase())
        : [];

      let score = 0;
      jobSkills.forEach(skill => {
        if (userSkills.includes(skill)) score += 20;
      });

      return { ...job, score };
    });

    matched.sort((a, b) => b.score - a.score);

    res.json(matched);
  } catch (err) {
    console.error("❌ Recommendations Error:", err);
    res.status(500).json({ error: "Failed to load recommendations" });
  }
});

/* =============================
   JOB VIEW HISTORY (SECURED)
============================= */
router.get("/history", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.execute(`
      SELECT 
        j.*, 
        v.viewed_at,
        CONCAT(u.first_name, ' ', u.last_name) AS employer_name
      FROM job_view v
      JOIN jobs j ON v.job_id = j.id
      LEFT JOIN users u ON j.employer_id = u.id
      WHERE v.user_id = ?
      ORDER BY v.viewed_at DESC
    `, [userId]);

    res.json(rows);
  } catch (err) {
    console.error("❌ History Error:", err);
    res.status(500).json({ error: "Failed to load history" });
  }
});

/* =============================
   SAVE JOB
============================= */
router.post("/save", auth, async (req, res) => {
  try {
    const { jobId } = req.body;

    await db.execute(
      "INSERT IGNORE INTO saved_jobs (user_id, job_id) VALUES (?, ?)",
      [req.user.id, jobId]
    );

    res.json({ message: "Job saved" });
  } catch (err) {
    console.error("❌ Save Job Error:", err);
    res.status(500).json({ error: "Failed to save job" });
  }
});

/* =============================
   GET SAVED JOBS
============================= */
router.get("/saved", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT j.*, CONCAT(u.first_name, ' ', u.last_name) AS employer_name
      FROM saved_jobs s
      JOIN jobs j ON s.job_id = j.id
      LEFT JOIN users u ON j.employer_id = u.id
      WHERE s.user_id = ?
      ORDER BY s.saved_at DESC
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    console.error("❌ Saved Jobs Error:", err);
    res.status(500).json({ error: "Failed to fetch saved jobs" });
  }
});

/* =============================
   REMOVE SAVED JOB
============================= */
router.delete("/save/:jobId", auth, async (req, res) => {
  try {
    await db.execute(
      "DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?",
      [req.user.id, req.params.jobId]
    );

    res.json({ message: "Removed" });
  } catch (err) {
    console.error("❌ Remove Error:", err);
    res.status(500).json({ error: "Failed to remove job" });
  }
});

/* =============================
   RECORD JOB VIEW (SECURE)
============================= */
router.post("/view", auth, async (req, res) => {
  try {
    const { job_id } = req.body;

    await db.execute(`
      INSERT INTO job_view (user_id, job_id, viewed_at)
      VALUES (?, ?, NOW())
    `, [req.user.id, job_id]);

    res.json({ message: "View recorded" });
  } catch (err) {
    console.error("❌ View Error:", err);
    res.status(500).json({ error: "Failed to record view" });
  }
});

/* =============================
   GET SINGLE JOB
============================= */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT j.*, 
      CONCAT(u.first_name, ' ', u.last_name) AS employer_name
      FROM jobs j
      LEFT JOIN users u ON j.employer_id = u.id
      WHERE j.id = ?
      LIMIT 1
    `, [req.params.id]);

    if (!rows.length) {
      return res.status(404).json({ error: "Job not found" });
    }

    const job = rows[0];

    job.files = job.file
      ? [{
          name: job.file,
          url: `${BASE_URL}/uploads/jobs/${job.file}`
        }]
      : [];

    res.json(job);
  } catch (err) {
    console.error("❌ Single Job Error:", err);
    res.status(500).json({ error: "Failed to load job" });
  }
});

/* =============================
   POST JOB (EMPLOYER)
============================= */
router.post("/", auth, upload.single("jobFile"), async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Only employers allowed" });
    }

    const {
      title,
      category,
      type,
      deadline,
      location,
      description,
      skills,
      experience,
      salary
    } = req.body;

    const file = req.file ? req.file.filename : null;

    const [result] = await db.execute(`
      INSERT INTO jobs 
      (title, category, type, deadline, location, description, skills, experience, salary, file, employer_id, status, views)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0)
    `, [
      title,
      category,
      type,
      deadline,
      location,
      description,
      skills || "",
      experience || 0,
      salary || "",
      file,
      req.user.id
    ]);

    res.status(201).json({
      message: "Job posted",
      jobId: result.insertId
    });

  } catch (err) {
    console.error("❌ Post Job Error:", err);
    res.status(500).json({ error: "Failed to post job" });
  }
});

export default router;