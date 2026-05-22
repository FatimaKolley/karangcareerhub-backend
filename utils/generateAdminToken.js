import jwt from "jsonwebtoken";

const generateAdminToken = (admin) => {
  return jwt.sign(
    {
      id: admin.id,
      role: admin.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export default generateAdminToken;