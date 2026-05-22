import db from "../db.js";

import { io } from "../server.js";


// ===========================
// CREATE NOTIFICATION
// ===========================
export const createNotification =
async (req, res) => {

  try {

    const {
      sender_id,
      receiver_id,
      type,
      title,
      message
    } = req.body;

    const [result] = await db.execute(
      `
      INSERT INTO notifications
      (
        sender_id,
        receiver_id,
        type,
        title,
        message
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        sender_id,
        receiver_id,
        type,
        title,
        message
      ]
    );

    const notification = {
      id: result.insertId,
      sender_id,
      receiver_id,
      type,
      title,
      message,
      is_read: false,
      created_at: new Date()
    };

    // REALTIME EMIT
    getIO().to(String(receiver_id))
        .emit(
        "newNotification",
        notification
      );

    res.status(201).json({
      success: true,
      notification
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


// ===========================
// GET NOTIFICATIONS
// ===========================
export const getNotifications =
async (req, res) => {

  try {

    const userId = req.user.id;

    const [notifications] =
      await db.execute(
        `
        SELECT *
        FROM notifications
        WHERE receiver_id = ?
        ORDER BY created_at DESC
        `,
        [userId]
      );

    res.status(200).json(
      notifications
    );

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


// ===========================
// MARK AS READ
// ===========================
export const markAsRead =
async (req, res) => {

  try {

    const notificationId =
      req.params.id;

    await db.execute(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = ?
      `,
      [notificationId]
    );

    res.status(200).json({
      success: true
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
};