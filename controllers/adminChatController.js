import db from "../db.js";


// ==========================
// SAVE MESSAGE
// ==========================
export const saveMessage = async (
  req,
  res
) => {

  try {

    const {
      senderId,
      receiverId,
      message
    } = req.body;
    
    if (
      !senderId ||
      !receiverId ||
      !message
    ) {
      return res.status(400).json({
        message:
          "senderId, receiverId and message are required"
      });
    }

    await db.query(
      `INSERT INTO admin_chats
      (sender_id, receiver_id, message)
      VALUES (?, ?, ?)`,
      [senderId, receiverId, message]
    );

    res.status(201).json({
      message: "Message saved"
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


// ==========================
// GET MESSAGES
// ==========================
export const getMessages = async (
  req,
  res
) => {

  try {

    const senderId = req.admin.id;

    const receiverId =
      req.params.receiverId;

    const [messages] = await db.query(
      `
      SELECT *
      FROM admin_chats

      WHERE
      (sender_id = ? AND receiver_id = ?)

      OR

      (sender_id = ? AND receiver_id = ?)

      ORDER BY created_at ASC
      `,
      [
        senderId,
        receiverId,
        receiverId,
        senderId
      ]
    );

    res.status(200).json(messages);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
};