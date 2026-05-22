import express from "express";

import adminAuth
from "../middleware/adminAuth.js";

import {
  getAllUsers,
  suspendUser,
  activateUser,
  getAllJobs,
  deleteJob,
  getAllApplications
}
from "../controllers/adminController.js";

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
router.get(
  "/jobs",
  adminAuth,
  getAllJobs
);

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

export default router;