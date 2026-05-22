import jwt from "jsonwebtoken";
import db from "../db.js";

const superAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [admins] = await db.query(
      "SELECT * FROM admins WHERE id = ?",
      [decoded.id]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        message: "Admin not found",
      });
    }

    const admin = admins[0];

    if (admin.role !== "super_admin") {
      return res.status(403).json({
        message: "Super admin access required",
      });
    }

    req.admin = admin;

    next();

  } catch (error) {
    console.log(error);

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

export default superAdminAuth;