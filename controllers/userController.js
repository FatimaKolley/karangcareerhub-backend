import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import sendEmail from "../utils/sendEmail.js";
import dotenv from "dotenv";

dotenv.config();

export const signup = async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, email, password, role } = req.body;

    if (!first_name || !last_name || !date_of_birth || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existing] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      `INSERT INTO users 
      (first_name, last_name, date_of_birth, email, password, role)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, date_of_birth, email, hashedPassword, role]
    );

    res.json({ message: "Signup successful!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!users.length) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = users[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [results] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (results.length === 0) {
      return res.status(400).json({ message: "Email not found" });
    }

    const user = results[0];

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const resetLink = `http://localhost:5500/reset-password.html?token=${token}`;

    await sendEmail(
      email,
      "Password Reset",
      `Click the link to reset: ${resetLink}`
    );

    res.json({ message: "Reset link sent to your email" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending email" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, decoded.id]
    );

    res.json({ message: "Password reset successful!" });

  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [results] = await db.execute(
      "SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = ?",
      [userId]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(results[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};