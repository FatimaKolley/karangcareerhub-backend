import express from "express";

import superAdminAuth
from "../middleware/superAdminAuth.js";
import adminAuth
from "../middleware/adminAuth.js";
import { getSuperAdmin } from "../controllers/superAdminController.js";

import {
  createAdmin,
  getAllAdmins,
  suspendAdmin,
  activateAdmin,
  deleteAdmin,
  getAnalytics,
  getAdminActivities,
  resetAdminPassword,
  lockAdmin,
  getAllUserChats
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

// chat
router.get(
  "/all-user-chats",
  superAdminAuth,
  getAllUserChats
);

router.get(
  "/super-admin-info",
  adminAuth,
  async (req, res) => {

    const [rows] =
      await db.query(
        `
        SELECT id,
               fullname,
               role
        FROM admins
        WHERE role='super_admin'
        LIMIT 1
        `
      );

    res.json(rows[0] || null);
  }
);


router.get(
  "/super-admin",
  adminAuth,
  getSuperAdmin
);

export default router;