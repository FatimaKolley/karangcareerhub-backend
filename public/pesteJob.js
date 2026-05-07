const API_URL = "https://karangcareerhub-api.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  protectEmployer();
  document
    .getElementById("posteJobForm")
    .addEventListener("submit", postJob);
});

/* ===============================
   PROTECT EMPLOYER
================================ */
function protectEmployer() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

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
  formData.append("deadline", document.getElementById("deadline").value);
  formData.append("location", document.getElementById("location").value.trim());
  formData.append("description", document.getElementById("description").value.trim());
  formData.append("skills", document.getElementById("skills").value.trim());

  const experienceVal = document.getElementById("experience").value;
  formData.append("experience", experienceVal ? experienceVal : 0);

  const salaryVal = document.getElementById("salary").value;
  formData.append("salary", salaryVal ? salaryVal : 0);

  formData.append("currency", document.getElementById("currency").value);

  const file = document.getElementById("jobFile").files[0];
  if (file) {
    formData.append("jobFile", file); // IMPORTANT: must match upload.single("jobFile")
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

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