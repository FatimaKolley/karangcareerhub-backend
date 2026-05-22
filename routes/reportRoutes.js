import express from "express";

import auth from "../middleware/auth.js";

import adminAuth
from "../middleware/adminAuth.js";

import {
  createReport,
  getReports,
  resolveReport
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

export default router;