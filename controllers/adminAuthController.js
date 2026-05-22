import bcrypt from "bcryptjs";
import db from "../db.js";
import generateAdminToken from "../utils/generateAdminToken.js";

export const adminLogin = async (req, res) => {
  try {

    const { email, password } = req.body;

    const [admins] = await db.query(
      "SELECT * FROM admins WHERE email = ?",
      [email]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const admin = admins[0];

    const isMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (admin.status === "suspended") {
      return res.status(403).json({
        message: "Account suspended",
      });
    }

    const token = generateAdminToken(admin);

    res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        fullname: admin.fullname,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};