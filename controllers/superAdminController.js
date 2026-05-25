import bcrypt from "bcryptjs";
import db from "../db.js";


// ==============================
// CREATE ADMIN
// ==============================
export const createAdmin = async (req, res) => {
  try {

    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check existing admin
    const [existing] = await db.query(
      "SELECT * FROM admins WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Admin already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin
    const [result] = await db.query(
      `INSERT INTO admins
      (fullname, email, password, role)
      VALUES (?, ?, ?, ?)`,
      [fullname, email, hashedPassword, "admin"]
    );

    // Save log
    await db.query(
      `INSERT INTO admin_logs
      (admin_id, action)
      VALUES (?, ?)`,
      [
        req.admin.id,
        `Created admin ${fullname}`
      ]
    );

    res.status(201).json({
      message: "Admin created successfully",
      adminId: result.insertId,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ==============================
// GET ALL ADMINS
// ==============================
export const getAllAdmins = async (req, res) => {
  try {

    const [admins] = await db.query(
      `SELECT
        id,
        fullname,
        email,
        role,
        status,
        created_at
      FROM admins`
    );

    res.status(200).json(admins);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ==============================
// SUSPEND ADMIN
// ==============================
export const suspendAdmin = async (req, res) => {
  try {

    const adminId = req.params.id;

    // Prevent suspending super admin
    const [admins] = await db.query(
      "SELECT * FROM admins WHERE id = ?",
      [adminId]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    const admin = admins[0];
    if (admin.role === "super_admin") {
      return res.status(403).json({
        message: "Cannot suspend super admin"
      });
    }
    if (req.admin.id === parseInt(adminId)) {
      return res.status(403).json({
        message: "You cannot suspend yourself"
      });
    }

    await db.query(
      `UPDATE admins
      SET status = 'suspended'
      WHERE id = ?`,
      [adminId]
    );

    // Log action
    await db.query(
      `INSERT INTO admin_logs
      (admin_id, action)
      VALUES (?, ?)`,
      [
        req.admin.id,
        `Suspended admin ${admin.fullname}`
      ]
    );

    res.status(200).json({
      message: "Admin suspended",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ==============================
// ACTIVATE ADMIN
// ==============================
export const activateAdmin = async (req, res) => {
  try {

    const adminId = parseInt(req.params.id);

    const [admins] = await db.query(
      "SELECT * FROM admins WHERE id = ?",
      [adminId]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        message: "Admin not found"
      });
    }

    const admin = admins[0];

    if (admin.role === "super_admin") {
      return res.status(403).json({
        message: "Cannot modify super admin"
      });
    }

    await db.query(
      `UPDATE admins
       SET status = 'active'
       WHERE id = ?`,
      [adminId]
    );

    await db.query(
      `INSERT INTO admin_logs
       (admin_id, action)
       VALUES (?, ?)`,
      [
        req.admin.id,
        `Activated admin ${admin.fullname}`
      ]
    );

    res.status(200).json({
      message: "Admin activated"
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
};



// ==============================
// DELETE ADMIN
// ==============================
export const deleteAdmin = async (req, res) => {
  try {

    const adminId = req.params.id;

    // Find admin
    const [admins] = await db.query(
      "SELECT * FROM admins WHERE id = ?",
      [adminId]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    const admin = admins[0];

    // Prevent deleting yourself
    if (req.admin.id === parseInt(adminId)) {
      return res.status(403).json({
        message: "You cannot delete yourself"
      });
    }
    
    // Prevent deleting super admin
    if (admin.role === "super_admin") {
      return res.status(403).json({
        message: "Super admin cannot be deleted"
      });
    }

    // Delete admin
    await db.query(
      "DELETE FROM admins WHERE id = ?",
      [adminId]
    );

    // Log action
    await db.query(
      `INSERT INTO admin_logs
      (admin_id, action)
      VALUES (?, ?)`,
      [
        req.admin.id,
        `Deleted admin ${admin.fullname}`
      ]
    );

    res.status(200).json({
      message: "Admin deleted successfully",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getAnalytics = async (req, res) => {
    try {
  
      // =========================
      // TOTAL USERS
      // =========================
      const [users] = await db.query(`
        SELECT COUNT(*) AS totalUsers
        FROM users
      `);
  
      // =========================
      // TOTAL JOBS
      // =========================
      const [jobs] = await db.query(`
        SELECT COUNT(*) AS totalJobs
        FROM jobs
      `);
  
      // =========================
      // TOTAL APPLICATIONS
      // =========================
      const [applications] = await db.query(`
        SELECT COUNT(*) AS totalApplications
        FROM applications
      `);
  
      // =========================
      // MOST ACTIVE USERS
      // =========================
      const [activeUsers] = await db.query(`
        SELECT
          users.id,
          users.fullname,
          COUNT(applications.id) AS totalApplications
        FROM applications
        JOIN users
        ON applications.user_id = users.id
        GROUP BY users.id
        ORDER BY totalApplications DESC
        LIMIT 5
      `);
  
      // =========================
      // JOB PERFORMANCE
      // =========================
      const [jobPerformance] = await db.query(`
        SELECT
          jobs.id,
          jobs.title,
          COUNT(applications.id) AS totalApplications
        FROM jobs
        LEFT JOIN applications
        ON applications.job_id = jobs.id
        GROUP BY jobs.id
        ORDER BY totalApplications DESC
        LIMIT 10
      `);
  
      // =========================
      // ADMIN ACTIVITIES COUNT
      // =========================
      const [adminActivities] = await db.query(`
        SELECT COUNT(*) AS totalActivities
        FROM admin_logs
      `);
  
      res.status(200).json({
        totalUsers: users[0].totalUsers,
        totalJobs: jobs[0].totalJobs,
        totalApplications:
          applications[0].totalApplications,
  
        mostActiveUsers: activeUsers,
  
        jobPerformance,
  
        adminActivities:
          adminActivities[0].totalActivities
      });
  
    } catch (error) {
  
      console.log(error);
  
      res.status(500).json({
        message: "Server error"
      });
    }
  };

  export const getAdminActivities = async (req, res) => {
    try {
  
      const [logs] = await db.query(`
        SELECT
          admin_logs.id,
          admin_logs.action,
          admin_logs.created_at,
          admins.fullname
        FROM admin_logs
        JOIN admins
        ON admin_logs.admin_id = admins.id
        ORDER BY admin_logs.created_at DESC
        LIMIT 50
      `);
  
      res.status(200).json(logs);
  
    } catch (error) {
  
      console.log(error);
  
      res.status(500).json({
        message: "Server error"
      });
    }
  };

// ==============================
// RESET ADMIN PASSWORD
// ==============================
export const resetAdminPassword =
async (req, res) => {

  try {

    const adminId =
      parseInt(req.params.id);

    const {
      newPassword
    } = req.body;

    if (!newPassword) {

      return res.status(400).json({
        message:
          "New password required"
      });
    }

    // Find admin
    const [admins] = await db.query(
      "SELECT * FROM admins WHERE id = ?",
      [adminId]
    );

    if (admins.length === 0) {

      return res.status(404).json({
        message:
          "Admin not found"
      });
    }

    const admin = admins[0];

    // Prevent resetting your own password here
    if (req.admin.id === adminId) {
      return res.status(403).json({
        message:
          "Use profile settings to change your own password"
      });
    }

    // Prevent resetting super admin password
    if (admin.role === "super_admin") {

      return res.status(403).json({
        message:
          "Cannot reset super admin password"
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    await db.query(
      `
      UPDATE admins
      SET password = ?
      WHERE id = ?
      `,
      [
        hashedPassword,
        adminId
      ]
    );

    // LOG
    await db.query(
      `
      INSERT INTO admin_logs
      (admin_id, action)
      VALUES (?, ?)
      `,
      [
        req.admin.id,
        `Reset password for admin ${admin.fullname}`
      ]
    );

    res.status(200).json({
      message:
        "Password reset successful"
    });

  } catch(error) {

    console.log(error);

    res.status(500).json({
      message:
        "Server error"
    });
  }
};

// ==============================
// CREATE LOCK ACCOUNT
// ==============================
export const lockAdmin =
async (req, res) => {

  try {

    const adminId =
      parseInt(req.params.id);

    // Prevent locking yourself
    if (req.admin.id === adminId) {

      return res.status(403).json({
        message:
          "You cannot lock yourself"
      });
    }

    // Find admin
    const [admins] = await db.query(
      "SELECT * FROM admins WHERE id = ?",
      [adminId]
    );

    if (admins.length === 0) {

      return res.status(404).json({
        message:
          "Admin not found"
      });
    }

    const admin = admins[0];

    // Prevent locking super admin
    if (admin.role === "super_admin") {

      return res.status(403).json({
        message:
          "Cannot lock super admin"
      });
    }

    await db.query(
      `
      UPDATE admins
      SET status = 'locked'
      WHERE id = ?
      `,
      [adminId]
    );

    // LOG
    await db.query(
      `
      INSERT INTO admin_logs
      (admin_id, action)
      VALUES (?, ?)
      `,
      [
        req.admin.id,
        `Locked admin ${admin.fullname}`
      ]
    );

    res.status(200).json({
      message:"Admin locked"
    });

  } catch(error) {

    console.log(error);

    res.status(500).json({
      message:"Server error"
    });
  }
};