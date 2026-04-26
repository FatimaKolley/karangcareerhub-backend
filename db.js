import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ override: true }); // 👈 REQUIRED on Windows

console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD length:", process.env.DB_PASSWORD?.length);

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // MUST NOT be empty
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


export default db;
