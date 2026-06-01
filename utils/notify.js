import db from "../db.js";
import { io } from "../server.js";

/* =========================================
   CREATE NOTIFICATION
========================================= */
async function createNotification({
  user_id,
  title,
  message,
  link = null,
  type = "general"
}) {
  try {

    const [result] = await db.execute(
      `
      INSERT INTO notifications
      (title, message, link, type)
      VALUES (?, ?, ?, ?, ?)
      `,
      [user_id, title, message, link, type]
    );

    const notification = {
      id: result.insertId,
      user_id,
      title,
      message,
      link,
      type,
      is_read: 0
    };

    // ✅ REALTIME SOCKET EVENT
    io.to(`user_${user_id}`).emit(
      "new_notification",
      notification
    );

    return notification;

  } catch (err) {
    console.error("NOTIFICATION ERROR:", err);
  }
}

/* =========================================
   SIMPLE HELPER
========================================= */
export async function notifyUser(
  user_id,
  title,
  message,
  link = null,
  type = "general"
) {
  return await createNotification({
    user_id,
    title,
    message,
    link,
    type
  });
}

export default createNotification;