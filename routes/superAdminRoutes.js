import express from "express";

import superAdminAuth from "../middleware/superAdminAuth.js";

import {
  createAdmin,
  getAllAdmins,
  suspendAdmin,
  activateAdmin,
  deleteAdmin,
} from "../controllers/superAdminController.js";
import {
    getAnalytics,
    getAdminActivities
  } from "../controllers/superAdminController.js";

const router = express.Router();

// Create admin
router.post("/create-admin", superAdminAuth, createAdmin);

// Get all admins
router.get("/admins", superAdminAuth, getAllAdmins);

// Suspend admin
router.put("/suspend/:id", superAdminAuth, suspendAdmin);

// Activate admin
router.put("/activate/:id", superAdminAuth, activateAdmin);

// Delete admin
router.delete("/delete/:id", superAdminAuth, deleteAdmin);

// Analytics
router.get(
    "/analytics",
    superAdminAuth,
    getAnalytics
  );
  
  // Admin activities
  router.get(
    "/admin-activities",
    superAdminAuth,
    getAdminActivities
  );

export default router;


