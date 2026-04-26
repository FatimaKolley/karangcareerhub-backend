const API_URL = "http://localhost:5000/api";

let allJobs = [];
let filteredJobs = [];

// =============================
// LOAD BROWSE JOBS
// =============================
async function loadJobs() {
  try {
    const res = await fetch(`${API_URL}/jobs/browse`);
    if (!res.ok) throw new Error("Failed to fetch jobs");

    const jobs = await res.json();

    console.log("📦 Jobs from backend:", jobs);

    // Only active and not expired jobs
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allJobs = jobs.filter((job) => {
      const isActive = (job.status || "").toLowerCase() === "active";

      if (!job.deadline) return isActive;

      const deadlineDate = new Date(job.deadline);
      deadlineDate.setHours(0, 0, 0, 0);

      return isActive && deadlineDate >= today;
    });

    filteredJobs = [...allJobs];
    applySearchAndSort();
  } catch (err) {
    console.error("❌ Failed to load jobs:", err);

    const container = document.getElementById("browseJobList");
    if (container) {
      container.innerHTML = `
        <div class="browse-empty">
          <h3>Unable to load jobs</h3>
          <p>Please check your server or try again later.</p>
        </div>
      `;
    }
  }
}

// =============================
// RENDER JOBS
// =============================
function renderJobs(jobs) {
  const container = document.getElementById("browseJobList");
  if (!container) return;

  container.innerHTML = "";

  if (!jobs.length) {
    container.innerHTML = `
      <div class="browse-empty">
        <h3>No jobs found</h3>
        <p>Try another search or sorting option.</p>
      </div>
    `;
    return;
  }

  jobs.forEach((job) => {
    const card = document.createElement("div");
    card.classList.add("browse-job-card");

    const jobId = job._id || job.id;

    const employerName =
      job.employer_name ||
      job.employer?.company_name ||
      job.employer?.name ||
      job.employer ||
      "Unknown Employer";

    const category = job.category || "General";
    const type = job.type || "Job";
    const location = job.location || "Location not specified";
    const currency = job.currency || "GMD";

    const salaryText =
      job.salary && Number(job.salary) > 0
        ? `${currency} ${Number(job.salary).toLocaleString()}`
        : "Negotiable";

    const deadlineText = formatDeadline(job.deadline);
    const expired = isJobExpired(job.deadline);

    card.innerHTML = `
      <h3 class="browse-job-title">${job.title || "Untitled Job"}</h3>
      <p class="browse-job-desc">${truncateText(job.description || "No description provided.", 110)}</p>

      <p class="browse-job-employer"><strong>Employer:</strong> ${employerName}</p>

      <div class="browse-job-tags">
        <span class="browse-tag">${category}</span>
        <span class="browse-tag type-tag">${type}</span>
      </div>

      <p class="browse-job-meta"><strong>Location:</strong> ${location}</p>
      <p class="browse-job-meta"><strong>Salary:</strong> ${salaryText}</p>
      <p class="browse-job-meta"><strong>Experience:</strong> ${job.experience ?? 0} year(s)</p>

      ${
        job.deadline
          ? `<span class="browse-deadline ${expired ? "expired" : ""}">Deadline: ${deadlineText}</span>`
          : `<span class="browse-deadline no-deadline">No deadline</span>`
      }

      <div class="browse-job-actions">
        <button class="browse-details-btn">Job Details</button>
        <button class="browse-apply-btn" ${expired ? "disabled" : ""}>
          ${expired ? "Expired" : "Apply Now"}
        </button>
      </div>
    `;

    // APPLY BUTTON -> go to apply page
    const applyBtn = card.querySelector(".browse-apply-btn");
    applyBtn?.addEventListener("click", (e) => {
      e.stopPropagation();

      if (expired) return;

      goToApplyPage(jobId);
    });

    // DETAILS BUTTON
    const detailsBtn = card.querySelector(".browse-details-btn");
    detailsBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      goToJobDetails(jobId);
    });


    container.appendChild(card);
  });
}

// =============================
// APPLY BUTTON -> REDIRECT
// =============================
function goToApplyPage(jobId) {
  if (!jobId) {
    showToast("Invalid job selected.", "error");
    return;
  }

  if (!isLoggedIn()) {
    showToast("Please log in to apply for this job.", "warning");

    setTimeout(() => {
      window.location.href = `login.html?redirect=${encodeURIComponent(`apply.html?jobId=${jobId}`)}`;
    }, 1200);

    return;
  }

  if (!isStudent()) {
    showToast("Only students can apply for jobs.", "error");
    return;
  }

  window.location.href = `apply.html?jobId=${jobId}`;
}

// =============================
// JOB DETAILS REDIRECT
// =============================
function goToJobDetails(jobId) {
  if (!jobId) {
    showToast("Invalid job selected.", "error");
    return;
  }

  window.location.href = `job.html?id=${jobId}`;
}

// =============================
// RECORD JOB VIEW
// =============================
async function recordView(jobId) {
  const currentUser = getUser();

  if (!currentUser || !jobId) return;

  try {
    await fetch(`${API_URL}/jobs/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: currentUser.id || currentUser._id,
        job_id: jobId
      })
    });
  } catch (err) {
    console.error("❌ Failed to record view:", err);
  }
}

async function getFreshUser() {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });
  return await res.json();
}

// =============================
// SEARCH + SORT
// =============================
function applySearchAndSort() {
  const searchValue = document.getElementById("searchInput")?.value.trim().toLowerCase() || "";
  const sortValue = document.getElementById("sortSelect")?.value || "best";

  let jobs = [...allJobs];

  const user = getUser(); // ✅ FIXED

  // SEARCH
  if (searchValue) {
    jobs = jobs
      .map((job) => {
        const title = (job.title || "").toLowerCase();
        const score = getMatchScore(title, searchValue);
        return { ...job, matchScore: score };
      })
      .filter((job) => job.matchScore >= 50);
  } else {
    jobs = jobs.map((job) => ({ ...job, matchScore: 100 }));
  }

  // AI BEST MATCH
  if (sortValue === "best") {
    jobs = scoreJobs(jobs, user); // ✅ now user exists

    jobs.sort((a, b) => {
      if ((b.aiScore || 0) !== (a.aiScore || 0)) {
        return (b.aiScore || 0) - (a.aiScore || 0);
      }

      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }

      return (
        new Date(b.created_at || b.createdAt || 0) -
        new Date(a.created_at || a.createdAt || 0)
      );
    });
  }

  // OTHER SORTS
  else if (sortValue === "latest") {
    jobs.sort((a, b) =>
      new Date(b.created_at || b.createdAt || 0) -
      new Date(a.created_at || a.createdAt || 0)
    );
  } else if (sortValue === "oldest") {
    jobs.sort((a, b) =>
      new Date(a.created_at || a.createdAt || 0) -
      new Date(b.created_at || b.createdAt || 0)
    );
  } else if (sortValue === "az") {
    jobs.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  } else if (sortValue === "za") {
    jobs.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
  }

  filteredJobs = jobs;
  renderJobs(filteredJobs);
}

function scoreJobs(jobs, user) {
  if (!user) return jobs;

  const userSkills = user.skills
    ? user.skills.toLowerCase().split(",").map(s => s.trim())
    : [];

  const userInterest = (user.main_interest || "").toLowerCase();
  const userOtherInterest = (user.other_interest || "").toLowerCase();
  const userEducation = (user.education || "").toLowerCase();
  const userExperience = (user.experience || "").toLowerCase();
  const userLocation = (user.location || "").toLowerCase();

  return jobs.map(job => {
    let score = 0;

    const title = (job.title || "").toLowerCase();
    const description = (job.description || "").toLowerCase();
    const jobExp = (job.experience || "").toString().toLowerCase();
    const jobLocation = (job.location || "").toLowerCase();

    // Skills
    userSkills.forEach(skill => {
      if (title.includes(skill) || description.includes(skill)) {
        score += 4;
      }
    });

    // Main Interest (HIGH)
    if (userInterest && (title.includes(userInterest) || description.includes(userInterest))) {
      score += 6;
    }

    // Other Interest
    if (userOtherInterest && (title.includes(userOtherInterest) || description.includes(userOtherInterest))) {
      score += 3;
    }

    // Education
    if (userEducation && description.includes(userEducation)) {
      score += 2;
    }

    // Experience
    if (userExperience && jobExp) {
      if (userExperience === jobExp) score += 6;
      else if (
        (userExperience === "intermediate" && jobExp === "beginner") ||
        (userExperience === "expert" && jobExp !== "expert")
      ) {
        score += 3;
      }
    }

    // Location
    if (userLocation && jobLocation.includes(userLocation)) {
      score += 3;
    }

    return { ...job, aiScore: score };
  });
}
// =============================
// SIMPLE TITLE MATCH SCORE
// =============================
function getMatchScore(title, search) {
  if (!title || !search) return 0;

  if (title === search) return 100;

  if (title.includes(search)) {
    return Math.min(100, Math.round((search.length / title.length) * 100) + 40);
  }

  const titleWords = title.split(/\s+/);
  const searchWords = search.split(/\s+/);

  let matchedChars = 0;

  searchWords.forEach((sw) => {
    titleWords.forEach((tw) => {
      if (tw.includes(sw) || sw.includes(tw)) {
        matchedChars += Math.min(sw.length, tw.length);
      }
    });
  });

  const score = Math.round((matchedChars / search.length) * 100);
  return Math.min(score, 100);
}

// =============================
// HELPERS
// =============================
function truncateText(text, maxLength = 100) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

function formatDeadline(deadline) {
  if (!deadline) return "No deadline";

  const date = new Date(deadline);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function isJobExpired(deadline) {
  if (!deadline) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  return deadlineDate < today;
}

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
  const currentUser = getUser();
  return currentUser?.role === "student" || localStorage.getItem("role") === "student";
}

// =============================
// LOGOUT
// =============================
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  window.location.href = "index.html";
}

// =============================
// EVENTS
// =============================
document.addEventListener("DOMContentLoaded", async () => {
  await loadJobs();

  try {
    const freshUser = await getFreshUser();
    localStorage.setItem("user", JSON.stringify(freshUser));
  } catch (err) {
    console.warn("Could not refresh user, using localStorage");
  }

  applySearchAndSort();

  document.getElementById("searchInput")?.addEventListener("input", applySearchAndSort);
  document.getElementById("sortSelect")?.addEventListener("change", applySearchAndSort);
});