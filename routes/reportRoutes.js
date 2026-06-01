import express from "express";

import auth from "../middleware/auth.js";

import adminAuth
from "../middleware/adminAuth.js";

import {
  createReport,
  getReports,
  resolveReport,
  getReportedJobs,
  unreportJob
}
from "../controllers/reportController.js";

const router = express.Router();


// =======================
// CREATE REPORT
// =======================
router.post(
  "/",
  auth,
  createReport
);


// =======================
// GET REPORTS
// =======================
router.get(
  "/",
  adminAuth,
  getReports
);


// =======================
// RESOLVE REPORT
// =======================
router.put(
  "/resolve/:id",
  adminAuth,
  resolveReport
);
// =======================
// GET REPORTED JOBS
// =======================
router.get("/reported-jobs", adminAuth, getReportedJobs);

router.put(
  "/unreport/:jobId",
  adminAuth,
  unreportJob
);

export default router;