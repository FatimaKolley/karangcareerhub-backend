import express from "express";

import adminAuth
from "../middleware/adminAuth.js";

import {
  saveMessage,
  getMessages
}
from "../controllers/adminChatController.js";

const router = express.Router();

// Save message
router.post(
  "/send",
  adminAuth,
  saveMessage
);

// Get messages
router.get(
  "/:receiverId",
  adminAuth,
  getMessages
);

export default router;