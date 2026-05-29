import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

console.log("DB_USER:", process.env.DB_USER);
console.log(
  "DB_PASSWORD length:",
  process.env.DB_PASSWORD?.length
);

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  connectTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  ssl: {
    rejectUnauthorized: false
  }
});

// TEST CONNECTION
(async () => {
  try {
    const connection = await db.getConnection();

    console.log("✅ MySQL Connected");

    connection.release();
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err);
  }
})();

export default db;