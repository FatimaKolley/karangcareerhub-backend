const API_URL = "http://localhost:5000/api";

let currentJobId = null;
let currentJob = null;

// =============================
// Helpers
// =============================
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");

  if (!container) {
    console.log(`${type.toUpperCase()}: ${message}`);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3000);
}

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

function requireStudentAccess() {
  if (!isLoggedIn()) {
    showToast("Please log in to apply.", "warning");

    setTimeout(() => {
      window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
    }, 1200);

    return false;
  }

  if (!isStudent()) {
    showToast("Only students can apply for jobs.", "error");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);

    return false;
  }

  return true;
}

function getJobIdFromURL() {
  const params = new URLSearchParams(window.location.search);

  // Support both ?jobId=... and old ?id=...
  return params.get("jobId") || params.get("id");
}

function isJobExpired(deadline) {
  if (!deadline) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  return deadlineDate < today;
}

function formatDate(dateString) {
  if (!dateString) return "No deadline";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}
function goBackSmart() {
  const savedReturnPage = sessionStorage.getItem("applyReturnPage");
  const fallbackPage = "dashboardStudent.html";

  if (savedReturnPage && savedReturnPage !== window.location.href) {
    window.location.href = savedReturnPage;
    return;
  }

  if (document.referrer && document.referrer !== window.location.href) {
    window.location.href = document.referrer;
    return;
  }

  window.location.href = fallbackPage;
}

// =============================
// Load Job for Application
// =============================
async function loadJobForApplication() {
  try {
    const res = await fetch(`${API_URL}/jobs/${currentJobId}`);

    if (!res.ok) {
      throw new Error("Failed to load job details");
    }

    const job = await res.json();
    currentJob = job;

    renderJobPreview(job);

    if (isJobExpired(job.deadline)) {
      disableApplicationForm();
      showToast("This job has expired. Applications are closed.", "warning");
    }
  } catch (error) {
    console.error("Load apply job error:", error);
    showToast("Could not load job details.", "error");

    const preview = document.getElementById("jobPreview");
    if (preview) {
      preview.innerHTML = `<p class="error-text">Unable to load this job.</p>`;
    }
  }
}

function renderJobPreview(job) {
  const preview = document.getElementById("jobPreview");
  if (!preview) return;

  const employerName = job.employer?.company_name || job.employer?.name || "Employer";

  preview.innerHTML = `
    <div class="job-preview-card">
      <h2>${job.title || "Untitled Job"}</h2>
      <p><strong>Employer:</strong> ${employerName}</p>
      <p><strong>Location:</strong> ${job.location || "Not specified"}</p>
      <p><strong>Category:</strong> ${job.category || "General"}</p>
      <p><strong>Deadline:</strong> ${formatDate(job.deadline)}</p>
      <p><strong>Description:</strong> ${job.description || "No description available."}</p>
    </div>
  `;
}

function disableApplicationForm() {
  const formElements = document.querySelectorAll("#applicationForm input, #applicationForm textarea, #applicationForm button");

  formElements.forEach((el) => {
    if (el.id !== "backToJobBtn") {
      el.disabled = true;
    }
  });

  const submitBtn = document.getElementById("submitApplicationBtn");
  if (submitBtn) {
    submitBtn.textContent = "Application Closed";
  }
}

// =============================
// Prefill Student Data
// =============================
function prefillStudentData() {
  const user = getUser();
  if (!user) return;

  const fullName = user.name || user.full_name || "";
  let firstName = user.first_name || "";
  let lastName = user.last_name || "";

  if (!firstName && !lastName && fullName.trim()) {
    const parts = fullName.trim().split(" ");
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ") || "";
  }

  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const emailInput = document.getElementById("email");
  const phonePrimaryInput = document.getElementById("phonePrimary");
  const phoneSecondaryInput = document.getElementById("phoneSecondary");
  const locationInput = document.getElementById("location");
  const portfolioLinkInput = document.getElementById("portfolioLink");
  const linkedinLinkInput = document.getElementById("linkedinLink");
  const githubLinkInput = document.getElementById("githubLink");

  if (firstNameInput) firstNameInput.value = firstName;
  if (lastNameInput) lastNameInput.value = lastName;
  if (emailInput) emailInput.value = user.email || "";
  if (phonePrimaryInput) phonePrimaryInput.value = user.phone || user.phone_number || "";
  if (phoneSecondaryInput) phoneSecondaryInput.value = user.phone2 || user.secondary_phone || "";
  if (locationInput) locationInput.value = user.location || "";

  if (portfolioLinkInput) portfolioLinkInput.value = user.portfolio || user.website || "";
  if (linkedinLinkInput) linkedinLinkInput.value = user.linkedin || "";
  if (githubLinkInput) githubLinkInput.value = user.github || "";
}

//========================================
// message
//=====================================================
const messageInput = document.getElementById("message");
const messageCounter = document.getElementById("messageCounter");
const messageRemaining = document.getElementById("messageRemaining");

const MESSAGE_LIMIT = 2000;

function updateMessageCounter() {
  if (!messageInput) return;

  const currentLength = messageInput.value.length;
  const remaining = MESSAGE_LIMIT - currentLength;

  messageCounter.textContent = `${currentLength} / ${MESSAGE_LIMIT} characters`;
  messageRemaining.textContent = `${remaining} characters remaining`;

  // Optional warning styles
  if (remaining <= 200) {
    messageRemaining.style.color = "#d97706"; // warning
  } else {
    messageRemaining.style.color = "";
  }

  if (remaining <= 50) {
    messageRemaining.style.color = "#dc2626"; // danger
  }
}

if (messageInput) {
  messageInput.setAttribute("maxlength", MESSAGE_LIMIT);
  messageInput.addEventListener("input", updateMessageCounter);
  updateMessageCounter();
}


// =============================
// Submit Application
// =============================
async function submitApplication(event) {
  event.preventDefault();

  if (!requireStudentAccess()) return;

  if (!currentJobId) {
    showToast("Invalid job selected.", "error");
    return;
  }

  if (currentJob && isJobExpired(currentJob.deadline)) {
    showToast("This job has expired. You cannot apply.", "warning");
    return;
  }

  const token = getToken();
  const submitBtn = document.getElementById("submitApplicationBtn");

  // Get form values INSIDE the function
  const firstName = document.getElementById("firstName")?.value.trim() || "";
  const lastName = document.getElementById("lastName")?.value.trim() || "";
  const email = document.getElementById("email")?.value.trim() || "";
  const phonePrimary = document.getElementById("phonePrimary")?.value.trim() || "";
  const phoneSecondary = document.getElementById("phoneSecondary")?.value.trim() || "";
  const location = document.getElementById("location")?.value.trim() || "";
  const portfolioLink = document.getElementById("portfolioLink")?.value.trim() || "";
  const linkedinLink = document.getElementById("linkedinLink")?.value.trim() || "";
  const githubLink = document.getElementById("githubLink")?.value.trim() || "";
  const resumeFile = document.getElementById("resume")?.files[0] || null;
  const message = document.getElementById("message").value.trim();

  if (message.length > 2000) {
    showToast("Cover letter must not exceed 2000 characters", "error");
    return;
  }

  // Basic validation
  if (!firstName || !lastName || !email || !phonePrimary) {
    showToast("Please fill in all required fields.", "warning");
    return;
  }
  
  if (!resumeFile) {
    showToast("Please upload your resume / CV.", "warning");
    return;
  }
 


  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    // Use FormData because of file upload
    const formData = new FormData();
    formData.append("jobId", currentJobId);
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("phonePrimary", phonePrimary);
    formData.append("phoneSecondary", phoneSecondary);
    formData.append("location", location);
    formData.append("portfolioLink", portfolioLink);
    formData.append("linkedinLink", linkedinLink);
    formData.append("githubLink", githubLink);
    formData.append("message", message);

    if (resumeFile) {
      formData.append("resume", resumeFile);
    }

    const res = await fetch(`${API_URL}/applications`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
        // DO NOT set Content-Type manually for FormData
      },
      body: formData
    });

   

    const data = await res.json();

    if (!res.ok) {
       throw new Error(data.error || data.message || "Application failed");
    }

    showToast("Application submitted successfully!", "success");

     setTimeout(() => {
      window.location.href = `successful.html?applicationId=${data.applicationId}`;
    }, 1200);

  } catch (error) {
    console.error("Submit application error:", error);
    showToast(error.message || "Failed to submit application.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Application";
  }
}

// =============================
// Init
// =============================
document.addEventListener("DOMContentLoaded", () => {
  if (!requireStudentAccess()) return;

  currentJobId = getJobIdFromURL();

  if (!currentJobId) {
    showToast("No job selected.", "error");

    setTimeout(() => {
      goBackSmart();
    }, 1200);

    return;
  }

  loadJobForApplication();
  prefillStudentData();
  updateReviewApplication();

  const reviewFields = document.querySelectorAll(
    "#firstName, #lastName, #email, #phonePrimary, #phoneSecondary, #location, #portfolioLink, #linkedinLink, #githubLink, #message, #resume"
  );

  reviewFields.forEach((field) => {
    field.addEventListener("input", updateReviewApplication);
    field.addEventListener("change", updateReviewApplication);
  });

  const form = document.getElementById("applicationForm");
const backToJobBtn = document.getElementById("backToJobBtn");
const pageBackBtn = document.querySelector(".back-btn");
const reviewBtn = document.getElementById("reviewApplicationBtn");
const reviewSection = document.getElementById("reviewSection");
const backToEditBtn = document.getElementById("backToEditBtn");

form?.addEventListener("submit", submitApplication);

// Top back button (returns to previous page)
pageBackBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  goBackSmart();
});

backToJobBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  goBackSmart();
});


if (reviewBtn && reviewSection) {
  reviewBtn.addEventListener("click", () => {
    updateReviewApplication();
    reviewSection.classList.remove("hidden");
    reviewSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (backToEditBtn && reviewSection) {
  backToEditBtn.addEventListener("click", () => {
    reviewSection.classList.add("hidden");
  });
}
  
});

// =============================
// Review Application
// =============================
function updateReviewApplication() {
  const reviewCard = document.getElementById("reviewApplicationCard");
  if (!reviewCard) return;

  const firstName = document.getElementById("firstName")?.value.trim() || "—";
  const lastName = document.getElementById("lastName")?.value.trim() || "—";
  const email = document.getElementById("email")?.value.trim() || "—";
  const phonePrimary = document.getElementById("phonePrimary")?.value.trim() || "—";
  const phoneSecondary = document.getElementById("phoneSecondary")?.value.trim() || "Not provided";
  const location = document.getElementById("location")?.value.trim() || "Not provided";
  const portfolioLink = document.getElementById("portfolioLink")?.value.trim() || "Not provided";
  const linkedinLink = document.getElementById("linkedinLink")?.value.trim() || "Not provided";
  const githubLink = document.getElementById("githubLink")?.value.trim() || "Not provided";
  const message = document.getElementById("message")?.value.trim() || "No cover letter added yet.";
  const resumeFile = document.getElementById("resume")?.files[0]?.name || "No file selected";

  reviewCard.innerHTML = `
    <div class="review-grid">
      <div class="review-item">
        <span class="review-label">First Name</span>
        <div class="review-value">${firstName}</div>
      </div>

      <div class="review-item">
        <span class="review-label">Last Name</span>
        <div class="review-value">${lastName}</div>
      </div>

      <div class="review-item">
        <span class="review-label">Email</span>
        <div class="review-value">${email}</div>
      </div>

      <div class="review-item">
        <span class="review-label">Primary Phone</span>
        <div class="review-value">${phonePrimary}</div>
      </div>

      <div class="review-item">
        <span class="review-label">Secondary Phone</span>
        <div class="review-value">${phoneSecondary}</div>
      </div>

      <div class="review-item">
        <span class="review-label">Location</span>
        <div class="review-value">${location}</div>
      </div>

      <div class="review-item">
        <span class="review-label">Portfolio</span>
        <div class="review-value">${portfolioLink}</div>
      </div>

      <div class="review-item">
        <span class="review-label">LinkedIn</span>
        <div class="review-value">${linkedinLink}</div>
      </div>

      <div class="review-item full">
        <span class="review-label">GitHub / Professional Link</span>
        <div class="review-value">${githubLink}</div>
      </div>

      <div class="review-item full">
        <span class="review-label">Resume / CV</span>
        <div class="review-value">${resumeFile}</div>
      </div>

      <div class="review-item full">
        <span class="review-label">Cover Letter</span>
        <div class="review-value">${message.replace(/\n/g, "<br>")}</div>
      </div>
    </div>
  `;
}