import express from "express";

import multer from "multer";

const router = express.Router();


// =======================
// STORAGE
// =======================
const storage =
  multer.diskStorage({

    destination:
    (req, file, cb) => {

      cb(null, "uploads/chat");
    },

    filename:
    (req, file, cb) => {

      cb(
        null,
        Date.now() +
        "-" +
        file.originalname
      );
    }
  });

const upload = multer({ storage });


// =======================
// UPLOAD FILE
// =======================
router.post(
  "/",
  upload.single("file"),
  (req, res) => {

    res.json({
      fileUrl:
      `/uploads/chat/${req.file.filename}`,

      fileType:
      req.file.mimetype
    });
  }
);

export default router;