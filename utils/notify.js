import db from "../db.js";

export async function notifyUser(
  user_id,
  title,
  message,
  link = null
) {
  await db.execute(
    `INSERT INTO notifications (user_id, title, message, link)
     VALUES (?, ?, ?, ?)`,
    [user_id, title, message, link]
  );
}
