import bcrypt from "bcryptjs";

const hashPassword = async () => {
  const hashed = await bcrypt.hash("super123", 10);

  console.log(hashed);
};

hashPassword();