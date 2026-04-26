import express from "express";
import db from "../db.js";
import jwt from "jsonwebtoken";
import auth from "../middleware/auth.js";
import uploadResume from "../middleware/uploadResume.js";
import { notifyUser } from "../utils/notify.js";


const router = express.Router();
//==========================
// APPLY FOR A JOB (Student)
//======================================
router.post("/", auth, uploadResume.single("resume"), async (req, res) => {
  

  try {
    const user_id = req.user.id;

    // Only students can apply
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students can apply for jobs" });
    }

    const {
      jobId,
      firstName,
      lastName,
      email,
      phonePrimary,
      phoneSecondary,
      location,
      portfolioLink,
      linkedinLink,
      githubLink,
      message
    } = req.body;

    // Validate required fields
    if (!jobId || !firstName || !lastName || !email || !phonePrimary) {
      return res.status(400).json({ error: "Please fill in all required fields" });
    }

    // Resume required
    if (!req.file) {
      return res.status(400).json({ error: "Resume / CV is required" });
    }

    // Check job exists
    const [jobRows] = await db.execute(
      `SELECT id, employer_id, title, deadline FROM jobs WHERE id = ?`,
      [jobId]
    );

    if (jobRows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const job = jobRows[0];

    // Prevent applying to expired jobs
    if (job.deadline && new Date(job.deadline) < new Date()) {
      return res.status(400).json({ error: "This job has expired. Applications are closed." });
    }

    // Prevent duplicate applications
    const [existing] = await db.execute(
      `SELECT id FROM applications WHERE user_id = ? AND job_id = ?`,
      [user_id, jobId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "You have already applied for this job" });
    }

// Save application
const [result] = await db.execute(
  `INSERT INTO applications (
    user_id, job_id, first_name, last_name, email,
    phone_primary, phone_secondary, location,
    portfolio_link, linkedin_link, github_link,
    message, resume_url, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    user_id,
    jobId,
    firstName,
    lastName,
    email,
    phonePrimary,
    phoneSecondary || "",
    location || "",
    portfolioLink || "",
    linkedinLink || "",
    githubLink || "",
    message || "",
    `/uploads/resumes/${req.file.filename}`,
    "Pending"
  ]
);

    // Try notifying employer but don't fail application if it fails
    try {
      await notifyUser(
        job.employer_id,
        "New Job Application",
        `A student applied for your job: ${job.title}`,
        "/employerDashboard.html"
      );
    } catch (err) {
      console.error("⚠️ Notification failed, but application saved:", err);
    }

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      applicationId: result.insertId
    });
    
  } catch (err) {
    console.error("❌ Apply Error:", err);
    res.status(500).json({ error: "Failed to submit application" });
  }
});



/* ==========================================================
    🧑‍🎓 GET ALL APPLICATIONS OF LOGGED-IN STUDENT
========================================================== */
router.get("/my-applications", auth, async (req, res) => {
  try {
    const user_id = req.user.id;

    const [rows] = await db.execute(
      `SELECT a.id AS application_id,
              j.title,
              j.employer,
              j.skills,
              a.message,
              a.created_at
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC`,
      [user_id]
    );

    res.json(rows);

  } catch (err) {
    console.error("❌ My Applications Error:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

/* ==========================================================
    GET ALL APPLICANTS FOR EMPLOYER'S JOBS
========================================================== */
router.get("/employer", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Access denied" });
    }

    const employer_id = req.user.id;

    const [applications] = await db.execute(
      `SELECT
      a.id AS application_id,
      a.status,
      a.message,
      a.resume_url,
      a.created_at,
    

      u.id AS student_id,
      CONCAT(u.first_name, ' ', u.last_name) AS student_name,
      u.email AS student_email,
      u.gender,
      u.skills,
      u.education,
      u.location,
      u.experience,

      j.id AS job_id,
      j.title AS job_title,
      j.category,
      j.type AS job_type,
      j.skills AS job_skills


      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.user_id = u.id
      WHERE j.employer_id = ?
      ORDER BY a.created_at DESC`,
      [employer_id]
    );

    res.json(applications);

  } catch (err) {
    console.error("❌ Employer Dashboard Error:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});




/* ==========================================================
   🤖 AI MATCH: Return best job recommendations for a user
========================================================== */
router.get("/recommendations/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // 1️⃣ Get user skills from database
    const [userRows] = await db.execute(
      `SELECT skills FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!userRows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const userSkills = userRows[0].skills
      ? userRows[0].skills.split(",").map(s => s.trim().toLowerCase())
      : [];

    if (userSkills.length === 0) {
      return res.json([]); // No skills → no recommendations
    }

    // 2️⃣ Get all jobs
    const [jobs] = await db.execute(
      `SELECT id, title, description, employer, skills
       FROM jobs`
    );

    // 3️⃣ Score jobs
    const scoredJobs = jobs.map(job => {
      const jobSkills = job.skills
        ? job.skills.split(",").map(s => s.trim().toLowerCase())
        : [];

      let score = 0;
      jobSkills.forEach(skill => {
        if (userSkills.includes(skill)) score += 20;
      });

      return { ...job, score };
    });

    // 4️⃣ Sort best → worst
    scoredJobs.sort((a, b) => b.score - a.score);

    // 5️⃣ Return top 10 only (optional)
    res.json(scoredJobs.slice(0, 10));

  } catch (err) {
    console.error("❌ AI Recommendation Error:", err);
    res.status(500).json({ error: "Failed to load recommendations" });
  }
});




/* ==========================================
   GET Application History (applied jobs)
========================================== */
router.get("/history/:userId", auth, async (req, res) => {
  try {
    const userId = req.params.userId;

    const [rows] = await db.execute(`
      SELECT 
        a.id AS application_id,
        a.status,
        a.applied_at,
        j.id AS job_id,
        j.title,
        j.employer,
        j.description
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.user_id = ?
      ORDER BY a.applied_at DESC
    `, [userId]);

    res.json(rows);

  } catch (err) {
    console.error("HISTORY ERROR:", err);
    res.status(500).json({ error: "Failed to load application history" });
  }
});


/* ==========================================
   GET Viewed Jobs History
========================================== */
router.get("/viewed/:userId", auth, async (req, res) => {
  try {
    const userId = req.params.userId;

    const [rows] = await db.execute(`
      SELECT 
        v.id AS view_id,
        v.viewed_at,
        j.id AS job_id,
        j.title,
        j.employer,
        j.description
      FROM job_views v
      JOIN jobs j ON v.job_id = j.id
      WHERE v.user_id = ?
      ORDER BY v.viewed_at DESC
    `, [userId]);

    res.json(rows);

  } catch (err) {
    console.error("VIEWED JOBS ERROR:", err);
    res.status(500).json({ error: "Failed to load viewed jobs" });
  }
});




/* ==========================================================
    UPDATE APPLICATION STATUS (Employer)
========================================================== */
router.put("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Only employers can do this" });
    }

    const { status } = req.body;
    const applicationId = req.params.id;

    // Get application + student + job
    const [rows] = await db.execute(
      `SELECT 
         a.user_id,
         j.title AS job_title
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = ?`,
      [applicationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const student_id = rows[0].user_id;
    const jobTitle = rows[0].job_title;

    // Update status
    await db.execute(
      "UPDATE applications SET status = ? WHERE id = ?",
      [status, applicationId]
    );

    // 🔔 Notify student
    await notifyUser(
      student_id,
      "Application Status Updated",
      `Your application for "${jobTitle}" is now ${status}`,
      "/dashboard/applications"
    );

    res.json({ message: "Status updated & student notified" });

  } catch (err) {
    console.error("❌ Status update error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

  
///==========================================
// applicant frofile download
//====================================
router.get("/:id/download", auth, async (req, res) => {
  try {
    const applicationId = req.params.id;

    const [rows] = await db.execute(
      `SELECT 
        a.first_name,
        a.last_name,
        a.email,
        a.phone_primary,
        a.location,
        a.message,
        a.resume_url,
        a.created_at,

        j.title AS job_title,

        u.profile_image,
        u.education,
        u.experience,
        u.date_of_birth, 
        u.skills  

      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.user_id = u.id   -- ✅ THIS IS THE FIX

      WHERE a.id = ?`,
      [applicationId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("❌ DOWNLOAD ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});


export default router;




