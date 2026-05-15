import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {
    let folder = "karangcareerhub/misc";

    if (
      file.fieldname === "profile_image" ||
      file.fieldname === "company_logo"
    ) {
      folder = "karangcareerhub/profile_pics";
    }

    if (file.fieldname === "resume") {
      folder = "karangcareerhub/resumes";
    }

    if (file.fieldname === "id_document") {
      folder = "karangcareerhub/id_docs";
    }

    return {
      folder,
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      public_id: `${Date.now()}-${file.originalname}`
    };
  }
});

const upload = multer({ storage });

export default upload;