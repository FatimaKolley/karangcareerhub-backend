(() => {
  const API_URL = "https://karangcareerhub-api.onrender.com/api";

const JOBS_API = `${API_URL}/jobs`;

// =====================================
// FORCE PUBLIC MODE ON INDEX PAGE
// =====================================
function forcePublicMode() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("profileCompletion");
}

// =====================================
// HELPERS
// =====================================
function filterActiveJobs(jobs = []) {
  const now = new Date();

  return jobs.filter((job) => {
    if (!job.deadline) return true; // keep jobs without deadline
    return new Date(job.deadline) >= now;
  });
}

function limitJobs(jobs = [], limit = 4) {
  return jobs.slice(0, limit);
}

function formatDeadline(deadline) {
  if (!deadline) return "No deadline";
  return new Date(deadline).toLocaleDateString();
}

// =====================================
// LOGIN REQUIRED MODAL
// =====================================
function showLoginRequired() {
  const modal = document.getElementById("applyModal");
  if (!modal) return;

  const title = modal.querySelector("h3");
  const text = modal.querySelector("p");
  const goLogin = document.getElementById("goLogin");
  const goBack = document.getElementById("goBack");

  if (title) title.textContent = "Login Required";
  if (text) text.textContent = "You must be logged in to apply or save jobs.";

  if (goLogin) {
    goLogin.style.display = "inline-block";
    goLogin.onclick = () => {
      window.location.href = "login.html";
    };
  }

  if (goBack) {
    goBack.onclick = () => {
      modal.classList.add("hidden");
    };
  }

  modal.classList.remove("hidden");
}

// =====================================
// CREATE JOB CARD
// =====================================
function createJobCard(job) {
  const card = document.createElement("div");
  card.classList.add("job-card");

  const employerDisplay = job.employer_name || job.employer || "Employer";

  const shortDescription = job.description
    ? job.description.substring(0, 100) + "..."
    : "No description available.";

  const isUrgent =
    job.deadline &&
    new Date(job.deadline) - new Date() <= 3 * 24 * 60 * 60 * 1000 &&
    new Date(job.deadline) >= new Date();

  card.innerHTML = `
    <h3 class="job-title">${job.title || "Untitled Job"}</h3>
    <p class="job-desc">${shortDescription}</p>
    <p class="job-employer">Posted by <strong>${employerDisplay}</strong></p>
    <p class="job-deadline ${isUrgent ? "urgent-deadline" : ""}">
      Deadline: ${formatDeadline(job.deadline)}
    </p>
    <button class="apply-btn">Apply</button>
  `;

  // Apply button -> always require login on index page
  const applyBtn = card.querySelector(".apply-btn");
  applyBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    showLoginRequired();
  });

  // Card click -> go to job details in PUBLIC mode
  card.addEventListener("click", () => {
    window.location.href = `job.html?id=${job.id}&source=index`;
  });

  return card;
}

// =====================================
// RENDER JOB LIST
// =====================================
function renderJobs(containerId, jobs = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (!jobs.length) {
    container.innerHTML = `<p class="empty-state">No active jobs available right now.</p>`;
    return;
  }

  jobs.forEach((job) => {
    container.appendChild(createJobCard(job));
  });
}

// =====================================
// LOAD 4 MOST RECENT POSTED JOBS
// =====================================
async function loadRecentJobs() {
  const container = document.getElementById("recentJobs");
  if (container) {
    container.innerHTML = `<p class="loading-text">Loading recent jobs...</p>`;
  }

  try {
    // If your backend already has a recent endpoint, keep using it
    const res = await fetch(`${JOBS_API}/recent/limit`);
    if (!res.ok) throw new Error("Failed to load recent jobs");

    const jobs = await res.json();

    // Remove expired jobs, then keep only 4
    const activeRecentJobs = limitJobs(filterActiveJobs(jobs), 4);

    renderJobs("recentJobs", activeRecentJobs);
  } catch (err) {
    console.error("Error loading recent jobs:", err);

    // Fallback: use all jobs sorted by newest if endpoint fails
    try {
      const fallbackRes = await fetch(`${JOBS_API}`);
      if (!fallbackRes.ok) throw new Error("Fallback failed");

      const allJobs = await fallbackRes.json();

      const activeRecentJobs = filterActiveJobs(allJobs)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 4);

      renderJobs("recentJobs", activeRecentJobs);
    } catch (fallbackErr) {
      console.error("Fallback recent jobs error:", fallbackErr);
      if (container) {
        container.innerHTML = `<p class="error-text">Error loading recent jobs.</p>`;
      }
    }
  }
}

// =====================================
// LOAD 4 MOST VIEWED JOBS
// =====================================
async function loadPopularJobs() {
  const container = document.getElementById("popularJobs");
  if (container) {
    container.innerHTML = `<p class="loading-text">Loading popular jobs...</p>`;
  }

  try {
    // If your backend has a popular endpoint, use it
    const res = await fetch(`${JOBS_API}/popular/limit`);
    if (!res.ok) throw new Error("Failed to load popular jobs");

    const jobs = await res.json();

    // Remove expired jobs, then keep only 4
    const activePopularJobs = limitJobs(filterActiveJobs(jobs), 4);

    renderJobs("popularJobs", activePopularJobs);
  } catch (err) {
    console.error("Error loading popular jobs:", err);

    // Fallback: use all jobs sorted by views if endpoint fails
    try {
      const fallbackRes = await fetch(`${JOBS_API}`);
      if (!fallbackRes.ok) throw new Error("Fallback failed");

      const allJobs = await fallbackRes.json();

      const activePopularJobs = filterActiveJobs(allJobs)
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 4);

      renderJobs("popularJobs", activePopularJobs);
    } catch (fallbackErr) {
      console.error("Fallback popular jobs error:", fallbackErr);
      if (container) {
        container.innerHTML = `<p class="error-text">Error loading popular jobs.</p>`;
      }
    }
  }
}

// =====================================
// AVATAR / DROPDOWN (PUBLIC MODE SAFE)
// =====================================
function setupPublicAvatarUI() {
  const avatarImg = document.getElementById("userAvatar");
  const avatarWrap = document.getElementById("avatarWrap");
  const avatarDropdown = document.getElementById("avatarDropdown");
  const logoutBtn = document.getElementById("logoutBtnDropdown");

  // Since this is public mode, there should be no real user session
  if (avatarImg) {
    avatarImg.src = "/image/avatar-placeholder.png";
  }

  avatarWrap?.addEventListener("click", () => {
    const hidden = avatarDropdown?.getAttribute("aria-hidden") === "true";
    avatarDropdown?.setAttribute("aria-hidden", String(!hidden));
  });

  document.addEventListener("click", (e) => {
    if (!avatarWrap || !avatarDropdown) return;
  
    if (!avatarWrap.contains(e.target)) {
      avatarDropdown.setAttribute("aria-hidden", "true");
    }
  });

  logoutBtn?.addEventListener("click", () => {
    forcePublicMode();
    window.location.href = "index.html";
  });
}

// =====================================
// NOTIFICATIONS (DISABLED ON INDEX PAGE)
// =====================================
function disableNotificationsInPublicMode() {
  const btn = document.getElementById("notificationBtn");
  const dropdown = document.getElementById("notificationDropdown");
  const countBadge = document.getElementById("notificationCount");

  if (btn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      showLoginRequired();
    });
  }

  if (dropdown) {
    dropdown.hidden = true;
  }

  if (countBadge) {
    countBadge.hidden = true;
  }
}

// =====================================
// INIT
// =====================================

document.addEventListener("DOMContentLoaded", async () => {
  const path = window.location.pathname;

  if (path === "/" || path.endsWith("index.html") || path === "") {
  forcePublicMode();
  }

  setupPublicAvatarUI();
  disableNotificationsInPublicMode();

  await loadRecentJobs();
  await loadPopularJobs();

  const toggles = document.querySelectorAll(".toggle-password");

  toggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      const inputId = toggle.getAttribute("data-target");
      const input = document.getElementById(inputId);

      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        toggle.textContent = "🙈";
      } else {
        input.type = "password";
        toggle.textContent = "👁";
      }
    });
  });
});
})();
