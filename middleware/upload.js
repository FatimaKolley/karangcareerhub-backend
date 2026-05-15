import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";


const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {
    let folder = "karangcareerhub";

    
    if (file.fieldname === "profile_image") {
      folder = "karangcareerhub/profile_pics";
    }
    if (file.fieldname === "company_logo") {
      folder = "karangcareerhub/company_logos";
    }
    if (file.fieldname === "resume") {
      folder = "karangcareerhub/resumes";
    }

    if (file.fieldname === "id_document") {
      folder = "karangcareerhub/id_docs";
    }

    return {
      folder,
      resource_type:
        file.fieldname === "resume"
          ? "raw"
          : "image"
    };
  }
});

const upload = multer({ storage });

export default upload;




 


