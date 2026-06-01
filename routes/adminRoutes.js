import express from "express";

import adminAuth
from "../middleware/adminAuth.js";
import auth from "../middleware/auth.js";
import {
  getReportedJobs
} from "../controllers/reportController.js";

import {
  getAllUsers,
  suspendUser,
  activateUser,
  getAllJobs,
  deleteJob,
  getAllApplications,
  requestSuperAdminHelp,
  flagJob,
  unflagJob,
  getJobById   
} from "../controllers/adminController.js";

const router = express.Router();


// USERS
router.get(
  "/users",
  adminAuth,
  getAllUsers
);

router.put(
  "/users/suspend/:id",
  adminAuth,
  suspendUser
);

router.put(
  "/users/activate/:id",
  adminAuth,
  activateUser
);


// JOBS
router.get("/jobs", adminAuth, getAllJobs);


router.delete(
  "/jobs/:id",
  adminAuth,
  deleteJob
);


// APPLICATIONS
router.get(
  "/applications",
  adminAuth,
  getAllApplications
);

// help request
router.post(
  "/request-help",
  adminAuth,
  requestSuperAdminHelp
);
router.put("/jobs/flag/:id", adminAuth, flagJob);
router.put("/jobs/unflag/:id", adminAuth, unflagJob);
router.get("/jobs/:id", adminAuth, getJobById);

// reported jobs (admin)
router.get(
  "/reported-jobs",
  adminAuth,
  getReportedJobs
);


export default router;