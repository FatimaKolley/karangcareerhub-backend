import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import db from "../db.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { authLimiter } from "../middleware/rateLimiter.js";

dotenv.config();

const router = express.Router();

const strongPassword =
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
/* =============================
    JWT TOKEN
============================= */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      tokenVersion: user.token_version || 0
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "2h",
      issuer: "karangcareerhub",
      audience: "karangcareerhub-users"
    }
  );
}

/* =============================
    SIGNUP
============================= */
router.post("/signup", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      date_of_birth,
      email,
      password,
      role
    } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /*console.log("SIGNUP BODY:", req.body);*/

    if (
      !first_name ||
      !last_name ||
      !date_of_birth ||
      !email ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        error: "Invalid email format"
      });
    }
    if (!strongPassword.test(password)) {
      return res.status(400).json({
        error:
          "Password must contain uppercase, lowercase, number and be at least 8 characters."
      });
    }

    const [existing] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }
      
    const allowedRoles = ["student", "employer"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        error: "Invalid role"
      });
    }

     
    const birthDate = new Date(date_of_birth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }  
    if (age < 16) {

    return res.status(400).json({
      error: "You must be at least 16 years old"
    });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      `INSERT INTO users 
       (first_name, last_name, date_of_birth, email, password, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, date_of_birth, normalizedEmail, hashed, role]
    );

    const user = {
      id: result.insertId,
      first_name,
      last_name,
      email,
      role
    };

    const token = generateToken(user);

    res.status(201).json({
      message: "Signup successful",
      token,
      user
    });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});


/* =============================
    LOGIN
============================= */
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (!rows.length)
      return res.status(401).json({ error: "Invalid email or password" });

    const user = rows[0];

    if (user.is_active === 0) {
      return res.status(403).json({
        error: "Account has been deactivated"
      });
    }
    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(401).json({ error: "Invalid email or password" });

    const token = generateToken(user);

    // ✅ FINAL CLEAN RESPONSE
    const { password: _, ...safeUser } = user;
    

    res.json({
      message: "Login successful",
      token,
      user: safeUser
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* =============================
    UPDATE PROFILE
============================= */
router.post(
  "/update-profile",
  auth,
  upload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "resume", maxCount: 1 },
    { name: "company_logo", maxCount: 1 },
    { name: "id_document", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const id = req.user.id;
      const clean = (val) => {
        if (
          val === undefined ||
          val === "undefined" ||
          val === null ||
          (typeof val === "string" && val.trim() === "")
        ) return undefined;
        return val;
      };

      const {
        first_name,
        last_name,
        email,
        phone,
        optional_phone,
        gender,
        location,
        education,
        main_interest,
        other_interest,
        skills,
        experience,
        bio,
        date_of_birth,
        portfolioLink,
        linkedinLink,
        githubLink,
        company_name,
        registration_number,
        company_email,
        company_website,
        business_address,
        contact_person,
        contact_role,
        industry,
        operating_since,
        company_description,
        nationality
      } = req.body;

      // FILES
      const profile = req.files?.profile_image?.[0]
        ? req.files.profile_image[0].path.replace(/\\/g, "/")
        : undefined;

      const companyLogo = req.files?.company_logo?.[0]
        ? req.files.company_logo[0].path.replace(/\\/g, "/")
        : undefined;

      const resume = req.files?.resume?.[0]
        ? req.files.resume[0].path.replace(/\\/g, "/")
        : undefined;

      const idDocumentFile = req.files?.id_document?.[0]
        ? req.files.id_document[0].path
        : undefined;
        

      // BUILD QUERY
      let fields = [];
      let values = [];

      const addField = (field, value) => {
        if (value !== undefined && value !== null && value !== "") {
          fields.push(`${field} = ?`);
          values.push(value);
        }
      };
      const normalizedEmail = clean(email)?.toLowerCase();

      if (normalizedEmail) {
        const [existing] = await db.execute(
          "SELECT id FROM users WHERE email=? AND id != ?",
          [normalizedEmail, id]
        );
      
        if (existing.length > 0) {
          return res.status(400).json({
            error: "Email already in use"
          });
        }
      }

      // TEXT
      addField("first_name", clean(first_name));
      addField("last_name", clean(last_name));
      addField("email", normalizedEmail);
      addField("phone", clean(phone));
      addField("optional_phone", clean(optional_phone));
      addField("gender", clean(gender));
      addField("location", clean(location));
      addField("education", clean(education));
      addField("main_interest", clean(main_interest));
      addField("other_interest", clean(other_interest));
      addField("skills", clean(skills));
      addField("experience", clean(experience));
      addField("bio", clean(bio));
      addField("date_of_birth", clean(date_of_birth));
      addField("portfolioLink", clean(portfolioLink));
      addField("linkedinLink", clean(linkedinLink));
      addField("githubLink", clean(githubLink));
      addField("company_name", clean(company_name));
      addField("registration_number", clean(registration_number));
      addField("company_email", clean(company_email));
      addField("company_website", clean(company_website));
      addField("business_address", clean(business_address));
      addField("contact_person", clean(contact_person));
      addField("contact_role", clean(contact_role));
      addField("industry", clean(industry));
      addField("operating_since", clean(operating_since));
      addField("company_description", clean(company_description));
      addField("nationality", clean(nationality));

      // FILES
      if (profile) {
        fields.push("profile_image = ?");
        values.push(profile);
      }

      if (companyLogo) {
        fields.push("company_logo = ?");
        values.push(companyLogo);
      }

      if (resume !== undefined) {
        fields.push("resume = ?");
        values.push(resume);
      }

      if (idDocumentFile !== undefined) {
        fields.push("id_document = ?");
        values.push(idDocumentFile);
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: "No data to update" });
      }

      values.push(id);

      await db.execute(
        `UPDATE users SET ${fields.join(", ")} WHERE id=?`,
        values
      );
      
      // FORCE FRESH USER FETCH
      const [updated] = await db.query(
        "SELECT * FROM users WHERE id=? LIMIT 1",
        [id]
      );

      const { password, ...safeUser } = updated[0];

      res.json({ user: safeUser });

    } catch (err) {
      console.error("UPDATE PROFILE ERROR:", err);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);


/*=============================profile routes=================*/
// GET CURRENT USER
router.get("/me", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE id=?",
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const {
      password,
      reset_token,
      reset_token_expiry,
      ...safeUser
    } = rows[0];

    res.json({ user: safeUser }); // ✅ ALWAYS WRAP

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});
/* =============================
    UPDATE NOTIFICATION SETTINGS
============================= */
router.post("/update-settings", auth, async (req, res) => {
  try {

    const {
      saved_job_reminder_notif,
      platform_notif,
      chat_notif,
      application_notif,
      weekly_job_notif,
      email_notif,
      sms_notif
    } = req.body;

    await db.execute(
      `UPDATE users SET
        saved_job_reminder_notif = ?,
        platform_notif = ?,
        chat_notif = ?,
        application_notif = ?,
        weekly_job_notif = ?,
        email_notif = ?,
        sms_notif = ?
      WHERE id = ?`,
      [
        saved_job_reminder_notif,
        platform_notif,
        chat_notif,
        application_notif,
        weekly_job_notif,
        email_notif,
        sms_notif,
        req.user.id
      ]
    );

    res.json({
      message: "Settings updated successfully"
    });

  } catch (err) {

    console.error("UPDATE SETTINGS ERROR:", err);

    res.status(500).json({
      error: "Failed to update settings"
    });
  }
});

/* =============================
    UPDATE PASSWORD
============================= */

router.post("/forgot-password", authLimiter, async (req, res) => {
    try {
    const { email } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

     const [users] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
     [normalizedEmail]
    );

    if (!users.length) {
      return res.json({ message: "If email exists, reset link sent" });
    }

    const user = users[0];

    // CREATE TOKEN
    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiry = new Date(Date.now() + 1000 * 60 * 30); // 30 mins

    await db.execute(
      "UPDATE users SET reset_token=?, reset_token_expiry=? WHERE id=?",
      [hashedToken, expiry, user.id]
    );

    const resetLink =
    `${process.env.FRONTEND_URL}/reset-password.html?token=${rawToken}`;

    // 📧 SEND EMAIL
    await transporter.sendMail({
      from: `"KarangCareerHub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>You requested to reset your password.</p>
        <p>
          <a href="${resetLink}" 
             style="padding:10px 20px;
                    background:#043972;
                    color:white;
                    text-decoration:none;
                    border-radius:6px;">
            Reset Password
          </a>
        </p>
        <p>This link expires in 30 minutes.</p>
      `
    });

    res.json({ message: "Reset link sent to your email" });

  } catch (err) {
    console.error("EMAIL ERROR:", err);
    res.status(500).json({ error: "Failed to send reset link" });
  }
});
// reset password//
router.post("/reset-password", authLimiter, async (req, res) => {
    try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Missing token or password" });
    }
    if (!strongPassword.test(password)) {
      return res.status(400).json({
        error:
          "Password must contain uppercase, lowercase, number and be at least 8 characters."
      });
    }

    // FIND USER WITH TOKEN
    const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  
    const [rows] = await db.execute(
    "SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()",
    [hashedToken]
    );

    if (!rows.length) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const user = rows[0];

    // HASH NEW PASSWORD
    const hashed = await bcrypt.hash(password, 10);

    // UPDATE PASSWORD + CLEAR TOKEN
    await db.execute(
      `UPDATE users 
       SET password=?,
           reset_token=NULL,
           reset_token_expiry=NULL,
           token_version = token_version + 1
       WHERE id=?`,
      [hashed, user.id]
    );

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ error: "Reset failed" });
  }
});

/* =============================
   CHANGE PASSWORD
============================= */
router.put("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    const [rows] = await db.execute(
      "SELECT * FROM users WHERE id=?",
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    const user = rows[0];

    const match = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!match) {
      return res.status(400).json({
        error: "Current password incorrect"
      });
    }
    if (!strongPassword.test(newPassword)) {
      return res.status(400).json({
        error:
          "Password must contain uppercase, lowercase, number and be at least 8 characters."
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.execute(
      `UPDATE users
       SET password=?,
           token_version = token_version + 1
       WHERE id=?`,
      [hashed, req.user.id]
    );

    res.json({
      message: "Password updated successfully"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to change password"
    });
  }
});
/* =============================
   DEACTIVATE ACCOUNT
============================= */
router.delete("/deactivate-account", auth, async (req, res) => {
  try {

    await db.execute(
      "UPDATE users SET is_active = 0 WHERE id = ?",
      [req.user.id]
    );

    res.json({
      message: "Account deactivated successfully"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to deactivate account"
    });
  }
});

// logout-all//

router.post("/logout-all", auth, async (req, res) => {
  try {

    await db.execute(
      `UPDATE users
       SET token_version = token_version + 1
       WHERE id = ?`,
      [req.user.id]
    );

    res.json({
      message: "Logged out from all devices"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Logout failed"
    });
  }
});

export default router;
