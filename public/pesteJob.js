const API_URL = "https://karangcareerhub-api.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  protectEmployer();

  const form = document.getElementById("posteJobForm");

  if (form) {
    form.addEventListener("submit", postJob);
  }
});

/* ===============================
   PROTECT EMPLOYER
================================ */
function protectEmployer() {
  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    console.error("Invalid user data:", err);
  }

  if (!token || !user || user.role !== "employer") {
    window.location.href = "login.html";
  }
}

/* ===============================
   TOAST NOTIFICATION
================================ */
function showToast(message, type = "info") {
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* ===============================
   POST JOB
================================ */
async function postJob(e) {
  e.preventDefault();

  const token = localStorage.getItem("token");

  if (!token) {
    showToast("You must be logged in", "error");
    return;
  }

  const form = document.getElementById("posteJobForm");
  const formData = new FormData();

  formData.append("title", document.getElementById("title").value.trim());
  formData.append("category", document.getElementById("category").value);
  formData.append("type", document.getElementById("type").value);
  formData.append("location", document.getElementById("location").value.trim());
  formData.append("description", document.getElementById("description").value.trim());
  formData.append("skills", document.getElementById("skills").value.trim());

  const experienceVal = document.getElementById("experience").value;
  formData.append("experience", experienceVal ? experienceVal : 0);

  const salaryVal = document.getElementById("salary").value;
  formData.append("salary", salaryVal ? salaryVal : 0);

  formData.append("currency", document.getElementById("currency").value);

  const fileInput = document.getElementById("jobFile");
  const file = fileInput?.files[0];
  
  if (file) {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
  
    const maxSize = 5 * 1024 * 1024; // 5MB
  
    if (!allowedTypes.includes(file.type)) {
      showToast("Only PDF or Word documents are allowed.", "error");
      return;
    }
  
    if (file.size > maxSize) {
      showToast("File size must be less than 5MB.", "error");
      return;
    }
  
    formData.append("jobFile", file);
  }

  const deadline = document.getElementById("deadline").value;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const selectedDate = new Date(deadline);
  if (!deadline) {
    showToast("Please select a deadline.", "error");
    return;
  }
  selectedDate.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    showToast("Deadline cannot be in the past.", "error");
    return;
  }
  formData.append("deadline", deadline);
  try {
    const res = await fetch(`${API_URL}/jobs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    let data = {};

    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      showToast(data.error || data.message || "Failed to post job", "error");
      return;
    }

    showToast("Job posted successfully! Redirecting...", "success");
    form.reset();

    setTimeout(() => {
     window.location.href = "dashboardEmployer.html";
    }, 2500);

  } catch (err) {
    console.error("❌ Frontend Post Job Error:", err);
    showToast("Server error. Try again.", "error");
  }
}