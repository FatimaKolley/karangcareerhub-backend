import db from "../db.js";
export const getAllUsers =
async (req, res) => {

  try {

    const [users] = await db.execute(
      `
      SELECT
        id,
        first_name,
        last_name,
        email,
        role,
        is_active,
        created_at
      FROM users
      ORDER BY id DESC      `
    );

    res.json(users);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Failed to load users"
    });
  }
};
/*suspend users*/
export const suspendUser =
async (req, res) => {

  try {

    await db.execute(
      `
      UPDATE users
      SET is_active = 0
      WHERE id = ?
      `,
      [req.params.id]
    );

    // LOG
    await db.execute(
      `
      INSERT INTO admin_logs
      (admin_id, action)
      VALUES (?, ?)
      `,
      [
        req.admin.id,
        `Suspended user ID ${req.params.id}`
      ]
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Failed"
    });
  }
};

export const activateUser =
async (req, res) => {

  try {

    await db.execute(
      `
      UPDATE users
      SET is_active = 1
      WHERE id = ?
      `,
      [req.params.id]
    );

    // LOG
    await db.execute(
      `
      INSERT INTO admin_logs
      (admin_id, action)
      VALUES (?, ?)
      `,
      [
        req.admin.id,
        `Activated user ID ${req.params.id}`
      ]
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Failed"
    });
  }
};


/* get jobs*/
export const getAllJobs =
async (req, res) => {

  try {

    const [jobs] = await db.execute(`
    SELECT *
    FROM jobs
    WHERE status != 'deleted'
    ORDER BY created_at DESC
    `);

    res.json(jobs);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Failed"
    });
  }
};
export const flagJob = async (req, res) => {
  try {
    await db.execute(
      `
      UPDATE jobs
      SET status = 'flagged'
      WHERE id = ?
      `,
      [req.params.id]
    );

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed" });
  }
};
export const unflagJob = async (req, res) => {
  try {
    await db.execute(
      `
      UPDATE jobs
      SET status = 'active'
      WHERE id = ?
      `,
      [req.params.id]
    );

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed" });
  }
};

/*delete jobs*/
export const deleteJob = async (req, res) => {
  try {
    await db.execute(
      `
      UPDATE jobs
      SET status = 'deleted'
      WHERE id = ?
      `,
      [req.params.id]
    );

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed" });
  }
};

/* get applications*/
export const getAllApplications = async (req, res) => {

  try {

    const [jobs] = await db.execute(`
      SELECT
        j.id,
        j.title,
        j.description,
        j.employer,
        j.created_at,
        j.deadline,

        COUNT(a.id) AS total_applicants,

        IFNULL(
          SUM(
            CASE
              WHEN a.status = 'Shortlisted'
              THEN 1
              ELSE 0
            END
          ),
        0) AS shortlisted,

        IFNULL(
          SUM(
            CASE
              WHEN a.status = 'Accepted'
              THEN 1
              ELSE 0
            END
          ),
        0) AS accepted,

        IFNULL(
          SUM(
            CASE
              WHEN a.status = 'Rejected'
              THEN 1
              ELSE 0
            END
          ),
        0) AS rejected

      FROM jobs j

      LEFT JOIN applications a
      ON j.id = a.job_id

      WHERE j.status = 'active'

      GROUP BY
        j.id,
        j.title,
        j.description,
        j.employer,
        j.created_at,
        j.deadline

      ORDER BY j.created_at DESC
    `);

    res.json(jobs);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Failed"
    });

  }

};

export const getJobById = async (req, res) => {
  try {
    const [job] = await db.execute(
      `
      SELECT *
      FROM jobs
      WHERE id = ?
      `,
      [req.params.id]
    );

    if (job.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job[0]);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed" });
  }
};

export const requestSuperAdminHelp =
async (req, res) => {

  try {

    // find super admin
    const [superAdmins] =
      await db.query(`
        SELECT *
        FROM admins
        WHERE role='super_admin'
        LIMIT 1
      `);

    if (superAdmins.length === 0) {

      return res.status(404).json({
        message:
          "Super admin not found"
      });
    }

    const superAdmin =
      superAdmins[0];

    // save notification
    await db.query(
      `
      INSERT INTO admin_notifications
      (
        title,
        message,
        type,
        receiver_id,
        sender_id
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        "Admin Help Request",
        `${req.admin.fullname} needs assistance`,
        "help_request",
        superAdmin.id,
        req.admin.id
      ]
      );

    res.json({
      success:true,
      message:
        "Help request sent"
    });

  } catch(error) {

    console.log(error);

    res.status(500).json({
      message:"Server error"
    });
  }
};