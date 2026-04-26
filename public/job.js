// ===============================
// CONFIG
// ===============================
const API_URL = "http://localhost:5000/api";

let currentJobId = null;
let currentJob = null;
let isJobSaved = false;
let isPublicFromIndex = false;

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("id");
  const source = params.get("source");
  const container = document.getElementById("jobDetails");

  if (!jobId) {
    if (container) container.innerHTML = "<p>No job selected.</p>";
    return;
  }

  // Detect if user came from index page
  isPublicFromIndex = source === "index";

  currentJobId = jobId;

  setupModalControls();
  setupActionButtons();
  loadJobDetails(jobId);
});

// ===============================
// TOAST
// ===============================
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ===============================
// MODAL CONTROL
// ===============================
function openModal() {
  const modal = document.getElementById("applyModal");
  if (!modal) return;
  modal.classList.remove("hidden");
}

function closeModal() {
  const modal = document.getElementById("applyModal");
  if (!modal) return;
  modal.classList.add("hidden");
}

function setupModalControls() {
  const goLogin = document.getElementById("goLogin");
  const goBack = document.getElementById("goBack");

  goLogin?.addEventListener("click", () => {
    const redirectUrl = `job.html?id=${currentJobId}`;
    window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}`;
  });

  goBack?.addEventListener("click", closeModal);
}

// ===============================
// AUTH HELPERS
// ===============================
function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function isLoggedIn() {
  return !!getToken();
}

function isStudent() {
  const user = getUser();
  return user?.role === "student" || localStorage.getItem("role") === "student";
}

// ===============================
// JOB HELPERS
// ===============================
function isJobExpired(deadline) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function formatDate(dateString) {
  if (!dateString) return "No deadline";
  return new Date(dateString).toDateString();
}

function getEmployerName(job) {
  return (
    job.employer_name ||
    job.employer?.company_name ||
    job.employer?.name ||
    "Company"
  );
}

// ===============================
// BUTTON SETUP
// ===============================
function setupActionButtons() {
  const applyBtn = document.getElementById("applyBtn");
  const saveBtn = document.getElementById("saveJobBtn");
  const downloadBtn = document.getElementById("downloadPdfBtn");

  applyBtn?.addEventListener("click", handleApplyClick);
  saveBtn?.addEventListener("click", handleSaveClick);
  downloadBtn?.addEventListener("click", downloadJobPDF);
}

// ===============================
// ACTION HANDLERS
// ===============================
function handleApplyClick() {
  if (!currentJob) {
    showToast("Job details are still loading.", "warning");
    return;
  }

  if (isJobExpired(currentJob.deadline)) {
    showToast("This job has expired. Applications are closed.", "warning");
    return;
  }

  // If user came from index page, force login
  if (isPublicFromIndex) {
    openModal();
    return;
  }

  // Normal protected flow
  if (!isLoggedIn()) {
    openModal();
    return;
  }

  if (!isStudent()) {
    showToast("Only students can apply for jobs.", "error");
    return;
  }

  applyJob();
}

function handleSaveClick() {
  if (!currentJob) {
    showToast("Job details are still loading.", "warning");
    return;
  }

  if (isJobExpired(currentJob.deadline)) {
    showToast("Expired jobs cannot be saved.", "warning");
    return;
  }

  // If user came from index page, force login
  if (isPublicFromIndex) {
    openModal();
    return;
  }

  // Normal protected flow
  if (!isLoggedIn()) {
    openModal();
    return;
  }

  if (!isStudent()) {
    showToast("Only students can save jobs.", "error");
    return;
  }

  saveJob();
}

// ===============================
// LOAD JOB DETAILS
// ===============================
async function loadJobDetails(jobId) {
  const container = document.getElementById("jobDetails");
  if (container) {
    container.innerHTML = "<p>Loading...</p>";
  }

  try {
    const res = await fetch(`${API_URL}/jobs/${jobId}`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    const job = await res.json();

    if (!job || !job.title) {
      throw new Error("Invalid job data");
    }

    currentJob = job;
    renderJobDetails(job);

    // Only check saved state if NOT public from index and user is logged in student
    if (!isPublicFromIndex && isLoggedIn() && isStudent()) {
      await checkIfJobIsSaved(jobId);
    } else {
      isJobSaved = false;
      updateSaveButtonState();
    }
  } catch (err) {
    console.error("Load job details error:", err);

    if (container) {
      container.innerHTML = `<p>Failed to load job details. ${err.message}</p>`;
    }
  }
}

// ===============================
// RENDER JOB DETAILS
// ===============================
function renderJobDetails(job) {
  const container = document.getElementById("jobDetails");
  if (!container) return;

  const expired = isJobExpired(job.deadline);
  const employerName = getEmployerName(job);

  container.innerHTML = `
    <h2>${job.title || "Untitled Job"}</h2>
    <p><strong>Employer:</strong> ${employerName}</p>
    <p><strong>Location:</strong> ${job.location || "Not specified"}</p>
    <p><strong>Salary:</strong> ${
      job.salary
        ? `${job.currency || "GMD"} ${Number(job.salary).toLocaleString()}`
        : "Not specified"
    }</p>
    <p><strong>Category:</strong> ${job.category || "General"}</p>
    <p><strong>Job Type:</strong> ${job.type || "Not specified"}</p>
    <p><strong>Experience:</strong> ${
      job.experience !== undefined && job.experience !== null
        ? `${job.experience} year(s)`
        : "Not specified"
    }</p>
    <p><strong>Posted:</strong> ${
      job.created_at ? new Date(job.created_at).toDateString() : "Unknown"
    }</p>
    <p>
      <strong>Deadline:</strong> ${formatDate(job.deadline)}
      ${expired ? `<span id="expiredBadge" class="expired-badge">Expired</span>` : ""}
    </p>

    <p><strong>Description:</strong></p>
    <p>${job.description || "No description provided."}</p>

    <p><strong>Skills Required:</strong></p>
    <ul>
      ${
        job.skills
          ? job.skills
              .split(",")
              .map((skill) => `<li>${skill.trim()}</li>`)
              .join("")
          : "<li>No skills listed</li>"
      }
    </ul>

    ${
      job.files && job.files.length > 0
        ? `
          <p><strong>Attachments:</strong></p>
          <div class="attachment-list">
            ${job.files
              .map(
                (file) => `
                <a href="${encodeURI(file.url)}" target="_blank" class="attachment-btn">
                  📄 View / Download: ${file.name}
                </a>
              `
              )
              .join("")}
          </div>
        `
        : ""
    }
  `;

  updateActionButtons(job);
}

// ===============================
// UPDATE ACTION BUTTONS
// ===============================
function updateActionButtons(job) {
  const applyBtn = document.getElementById("applyBtn");
  const saveBtn = document.getElementById("saveJobBtn");

  if (!applyBtn || !saveBtn) return;

  const expired = isJobExpired(job.deadline);

  // Expired job logic (highest priority)
  if (expired) {
    applyBtn.disabled = true;
    applyBtn.textContent = "Application Closed";
    applyBtn.classList.add("disabled-btn");

    saveBtn.disabled = true;
    saveBtn.textContent = "Expired Job";
    saveBtn.classList.add("disabled-btn");

    return;
  }

  // Remove disabled style if previously set
  applyBtn.disabled = false;
  applyBtn.classList.remove("disabled-btn");

  saveBtn.disabled = false;
  saveBtn.classList.remove("disabled-btn");

  // Public from index page => force login prompts
  if (isPublicFromIndex) {
    applyBtn.textContent = "Login to Apply";
    saveBtn.textContent = "Login to Save";
    saveBtn.classList.remove("saved");
    return;
  }

  // Logged-out normal access
  if (!isLoggedIn()) {
    applyBtn.textContent = "Login to Apply";
    saveBtn.textContent = "Login to Save";
    saveBtn.classList.remove("saved");
    return;
  }

  // Logged-in but not student
  if (!isStudent()) {
    applyBtn.textContent = "Students Only";
    saveBtn.textContent = "Students Only";
    return;
  }

  // Logged-in student
  applyBtn.textContent = "Apply Now";
  updateSaveButtonState();
}

// ===============================
// APPLY JOB
// ===============================
function applyJob() {
  const token = getToken();

  if (!token || !currentJobId) {
    showToast("Please log in first.", "error");
    return;
  }

  // Save exact page user came from
  sessionStorage.setItem("applyReturnPage", window.location.href);

  window.location.href = `apply.html?id=${currentJobId}`;
}

// ===============================
// SAVE JOB
// ===============================
async function saveJob() {
  const token = getToken();

  if (!token || !currentJobId) {
    showToast("Please log in first.", "error");
    return;
  }

  if (isJobSaved) {
    showToast("This job is already in your saved jobs.", "info");
    return;
  }

  const saveBtn = document.getElementById("saveJobBtn");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
  }

  try {
    const res = await fetch(`${API_URL}/jobs/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        jobId: currentJobId
      })
    });

    const data = await res.json();
    console.log("Save job response:", data);

    if (!res.ok) {
      if (saveBtn) {
        saveBtn.disabled = false;
        updateActionButtons(currentJob);
      }

      const msg = data.error || data.message || "Failed to save job";

      if (msg.toLowerCase().includes("already")) {
        showToast("This job is already in your saved jobs.", "info");
      } else {
        showToast(msg, "error");
      }

      return;
    }

    isJobSaved = true;
    updateSaveButtonState();
    showToast(data.message || "Job saved successfully!", "success");
  } catch (error) {
    console.error("Save job error FULL:", error);

    if (saveBtn) {
      saveBtn.disabled = false;
      updateActionButtons(currentJob);
    }

    showToast("Could not save job. Try again later.", "error");
  }
}

// ===============================
// CHECK IF JOB IS SAVED
// ===============================
async function checkIfJobIsSaved(jobId) {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_URL}/jobs/saved`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const savedJobs = await res.json();

    if (!res.ok) {
      console.error("Failed to check saved jobs:", savedJobs.error || savedJobs.message);
      return;
    }

    isJobSaved =
      Array.isArray(savedJobs) &&
      savedJobs.some((job) => Number(job.id) === Number(jobId));

    updateSaveButtonState();
  } catch (error) {
    console.error("Error checking saved jobs:", error);
  }
}

// ===============================
// UPDATE SAVE BUTTON STATE
// ===============================
function updateSaveButtonState() {
  const saveBtn = document.getElementById("saveJobBtn");
  if (!saveBtn) return;

  if (isJobExpired(currentJob?.deadline)) {
    saveBtn.textContent = "Expired Job";
    saveBtn.disabled = true;
    saveBtn.classList.add("disabled-btn");
    saveBtn.classList.remove("saved");
    return;
  }

  if (isPublicFromIndex) {
    saveBtn.textContent = "Login to Save";
    saveBtn.disabled = false;
    saveBtn.classList.remove("saved");
    return;
  }

  if (!isLoggedIn()) {
    saveBtn.textContent = "Login to Save";
    saveBtn.disabled = false;
    saveBtn.classList.remove("saved");
    return;
  }

  if (!isStudent()) {
    saveBtn.textContent = "Students Only";
    saveBtn.disabled = false;
    saveBtn.classList.remove("saved");
    return;
  }

  if (isJobSaved) {
    saveBtn.textContent = "Saved";
    saveBtn.disabled = true;
    saveBtn.classList.add("saved");
  } else {
    saveBtn.textContent = "Save Job";
    saveBtn.disabled = false;
    saveBtn.classList.remove("saved");
  }
}

// ===============================
// DOWNLOAD PDF
// ===============================
async function downloadJobPDF() {
  if (!currentJob) {
    showToast("Job details are not ready yet.", "warning");
    return;
  }

  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) {
    showToast("PDF library not loaded.", "error");
    return;
  }

  const doc = new jsPDF();
  let y = 20;

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "image/logo.png";

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    doc.addImage(img, "PNG", 15, 10, 40, 15);
    y = 35;
  } catch {
    y = 25;
  }

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.text(currentJob.title || "Job Details", 15, y);
  y += 10;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);

  const employerName = getEmployerName(currentJob);

  const lines = [
    `Employer: ${employerName}`,
    `Location: ${currentJob.location || "Not specified"}`,
    `Salary: ${
      currentJob.salary
        ? `${currentJob.currency || "GMD"} ${Number(currentJob.salary).toLocaleString()}`
        : "Not specified"
    }`,
    `Category: ${currentJob.category || "General"}`,
    `Job Type: ${currentJob.type || "Not specified"}`,
    `Experience: ${
      currentJob.experience !== undefined && currentJob.experience !== null
        ? `${currentJob.experience} year(s)`
        : "Not specified"
    }`,
    `Posted: ${
      currentJob.created_at ? new Date(currentJob.created_at).toDateString() : "Unknown"
    }`,
    `Deadline: ${formatDate(currentJob.deadline)}`
  ];

  lines.forEach((line) => {
    doc.text(line, 15, y);
    y += 8;
  });

  y += 2;
  doc.line(15, y, 195, y);
  y += 10;

  doc.setFont("Helvetica", "bold");
  doc.text("Job Description:", 15, y);
  y += 8;

  doc.setFont("Helvetica", "normal");
  const desc = doc.splitTextToSize(
    currentJob.description || "No description provided.",
    170
  );
  doc.text(desc, 15, y);
  y += desc.length * 7 + 5;

  doc.setFont("Helvetica", "bold");
  doc.text("Skills Required:", 15, y);
  y += 8;

  doc.setFont("Helvetica", "normal");

  if (currentJob.skills) {
    currentJob.skills.split(",").forEach((skill) => {
      doc.text(`• ${skill.trim()}`, 18, y);
      y += 6;
    });
  } else {
    doc.text("None listed", 18, y);
    y += 6;
  }

  y += 10;
  doc.setFontSize(10);
  doc.text("Downloaded from KarangCareerHub", 15, 285);

  const safeTitle = (currentJob.title || "job-details").replace(/[\\/:*?"<>|]/g, "_");
  doc.save(`${safeTitle}.pdf`);
}