import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

/* =============================
   AUTH MIDDLEWARE
============================= */
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token provided" });

  const token = header.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
}

/* =============================
   ENSURE FOLDER EXISTS
============================= */
const uploadDir = "uploads/profile_pics";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* =============================
   MULTER STORAGE SETTINGS
============================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `user_${req.user.id}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

/* =============================
   FILE FILTER (SECURITY)
============================= */
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only image files allowed"), false);
  }

  cb(null, true);
};

/* =============================
   MULTER INIT
============================= */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB max
});

/* =============================
   UPLOAD PROFILE IMAGE
============================= */
router.post(
  "/profile-pic",
  auth,
  upload.single("profile_image"), // ✅ FIXED NAME
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const filePath = `/uploads/profile_pics/${req.file.filename}`;

      // ✅ GET OLD IMAGE (for cleanup)
      const [rows] = await db.execute(
        "SELECT profile_image FROM users WHERE id=?",
        [req.user.id]
      );

      const oldImage = rows[0]?.profile_image;

      // ✅ UPDATE DB WITH FULL PATH
      await db.execute(
        "UPDATE users SET profile_image=? WHERE id=?",
        [filePath, req.user.id]
      );

      // ✅ DELETE OLD IMAGE (optional but recommended)
      if (oldImage && oldImage !== filePath) {
        const oldPath = oldImage.replace("/uploads/", "uploads/");
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      res.json({
        message: "Profile picture updated successfully",
        url: filePath
      });

    } catch (err) {
      console.error("❌ Upload Error:", err);

      if (err.message.includes("Only image")) {
        return res.status(400).json({ error: err.message });
      }

      res.status(500).json({ error: "Upload failed" });
    }
  }
);

export default router;