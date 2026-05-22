const socket =
  io("https://your-render-url.onrender.com");

socket.on(
  "newNotification",
  (notification) => {

    console.log(
      "New Notification:",
      notification
    );

    alert(notification.title);
  }
);

/*new application*/
await fetch("/api/notifications/create", {
    method: "POST",
  
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
  
    body: JSON.stringify({
      sender_id: studentId,
      receiver_id: employerId,
  
      type: "application",
  
      title: "New Application",
  
      message:
        "A student applied for your job"
    })
  });