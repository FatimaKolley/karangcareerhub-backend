import db from "../db.js";


// =======================
// CREATE REPORT
// =======================
export const createReport =
async (req, res) => {

  try {

    const {
      reported_user_id,
      reported_job_id,
      reason
    } = req.body;

    await db.execute(
      `
      INSERT INTO reports
      (
        reporter_id,
        reported_user_id,
        reported_job_id,
        reason
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        req.user.id,
        reported_user_id || null,
        reported_job_id || null,
        reason
      ]
    );

    res.status(201).json({
      success: true,
      message: "Report submitted"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Failed to submit report"
    });
  }
};


// =======================
// GET REPORTS
// =======================
export const getReports =
async (req, res) => {

  try {

    const [reports] =
      await db.execute(
        `
        SELECT
          reports.*,

          reporter.fullname
          AS reporter_name,

          reported.fullname
          AS reported_name,

          jobs.title
          AS job_title

        FROM reports

        LEFT JOIN users reporter
        ON reports.reporter_id = reporter.id

        LEFT JOIN users reported
        ON reports.reported_user_id = reported.id

        LEFT JOIN jobs
        ON reports.reported_job_id = jobs.id

        ORDER BY reports.created_at DESC
        `
      );

    res.json(reports);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Failed to load reports"
    });
  }
};


// =======================
// RESOLVE REPORT
// =======================
export const resolveReport =
async (req, res) => {

  try {

    await db.execute(
      `
      UPDATE reports
      SET status = 'resolved'
      WHERE id = ?
      `,
      [req.params.id]
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