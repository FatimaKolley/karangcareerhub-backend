async function uploadChatFile() {

    const fileInput =
      document.getElementById(
        "chatFile"
      );
  
    const file =
      fileInput.files[0];
  
    if (!file) return null;
  
    const formData =
      new FormData();
  
    formData.append("file", file);
  
    const response = await fetch(
      "http://localhost:5000/api/chat-upload",
      {
        method: "POST",
        body: formData
      }
    );
  
    return await response.json();
  }