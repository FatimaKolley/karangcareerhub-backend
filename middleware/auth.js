import jwt from "jsonwebtoken";
import pool from "../db.js";

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "karang_secret");

    const [users] = await pool.execute(
      "SELECT id, role FROM users WHERE id = ?",
      [decoded.id]
    );

    if (!users.length) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = users[0];
    next();

  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const verifyToken = auth;
export default auth;
