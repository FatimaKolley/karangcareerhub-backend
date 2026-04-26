import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ Ensure folders exist
const createFolder = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

createFolder("uploads/profile_pics");
createFolder("uploads/resumes");
createFolder("uploads/id_docs");

// ✅ STORAGE FIX
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "profile_image" || file.fieldname === "company_logo") {
      cb(null, "uploads/profile_pics");
    } 
    else if (file.fieldname === "resume") {
      cb(null, "uploads/resumes");
    } 
    else if (file.fieldname === "id_document") {
      cb(null, "uploads/id_docs");
    } 
    else {
      cb(null, "uploads");
    }
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

export default upload;