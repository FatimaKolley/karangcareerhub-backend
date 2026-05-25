import express from "express";

import superAdminAuth
from "../middleware/superAdminAuth.js";

import {
  createAdmin,
  getAllAdmins,
  suspendAdmin,
  activateAdmin,
  deleteAdmin,
  getAnalytics,
  getAdminActivities,
  resetAdminPassword,
  lockAdmin
}
from "../controllers/superAdminController.js";

const router = express.Router();


// CREATE ADMIN
router.post(
  "/create-admin",
  superAdminAuth,
  createAdmin
);


// GET ADMINS
router.get(
  "/admins",
  superAdminAuth,
  getAllAdmins
);


// SUSPEND
router.put(
  "/suspend/:id",
  superAdminAuth,
  suspendAdmin
);


// ACTIVATE
router.put(
  "/activate/:id",
  superAdminAuth,
  activateAdmin
);


// DELETE
router.delete(
  "/delete/:id",
  superAdminAuth,
  deleteAdmin
);


// ANALYTICS
router.get(
  "/analytics",
  superAdminAuth,
  getAnalytics
);


// ADMIN LOGS
router.get(
  "/admin-activities",
  superAdminAuth,
  getAdminActivities
);


// RESET PASSWORD
router.put(
  "/reset-password/:id",
  superAdminAuth,
  resetAdminPassword
);


// LOCK ACCOUNT
router.put(
  "/lock/:id",
  superAdminAuth,
  lockAdmin
);

export default router;