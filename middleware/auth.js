import jwt from "jsonwebtoken";
import pool from "../db.js";

export default function auth(requiredRoles = []) {

  return async (req, res, next) => {

    try {

      const header = req.headers.authorization;

      if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "No token provided"
        });
      }

      const token = header.split(" ")[1];

      // VERIFY TOKEN
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET,
        {
          issuer: "karangcareerhub",
          audience: "karangcareerhub-users"
        }
      );

      // GET USER
      const [users] = await pool.execute(
        `
        SELECT id, role, token_version, is_active
        FROM users
        WHERE id = ?
        `,
        [decoded.id]
      );

      if (!users.length) {
        return res.status(401).json({
          error: "User not found"
        });
      }

      const user = users[0];

      // ACCOUNT ACTIVE?
      if (user.is_active === 0) {
        return res.status(403).json({
          error: "Account deactivated"
        });
      }

      // TOKEN VERSION
      if (decoded.tokenVersion !== user.token_version) {
        return res.status(401).json({
          error: "Session expired. Login again."
        });
      }

      req.user = {
        id: user.id,
        role: user.role
      };

      // ROLE CHECK
      if (
        requiredRoles.length > 0 &&
        !requiredRoles.includes(user.role)
      ) {
        return res.status(403).json({
          error: "Access denied"
        });
      }

      next();

    } catch (err) {

      console.error("AUTH ERROR:", err);

      return res.status(401).json({
        error: "Invalid or expired token"
      });
    }
  };
}