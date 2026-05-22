export const getAllUsers =
async (req, res) => {

  try {

    const [users] = await db.execute(
      `
      SELECT
        id,
        fullname,
        email,
        role,
        status,
        created_at
      FROM users
      ORDER BY created_at DESC
      `
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
      SET status = 'suspended'
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
      SET status = 'active'
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

    const [jobs] = await db.execute(
      `
      SELECT *
      FROM jobs
      ORDER BY created_at DESC
      `
    );

    res.json(jobs);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Failed"
    });
  }
};

/*delete jobs*/
export const deleteJob =
async (req, res) => {

  try {

    await db.execute(
      `
      DELETE FROM jobs
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
        `Deleted job ID ${req.params.id}`
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

/* get applications*/
export const getAllApplications =
async (req, res) => {

  try {

    const [applications] =
      await db.execute(
        `
        SELECT *
        FROM applications
        ORDER BY created_at DESC
        `
      );

    res.json(applications);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Failed"
    });
  }
};