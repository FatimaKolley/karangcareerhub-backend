const API_URL = "http://localhost:5000/api";

// =============================
// Helper: compute profile %
// =============================
function calculateProfileCompletion(user) {
  let score = 0;

  if (user.first_name) score += 10;
  if (user.last_name) score += 10;
  if (user.bio) score += 10;

  if (user.skills) score += 15;
  if (user.education) score += 10;
  if (user.main_interest) score += 10;
  if (user.other_interest) score += 5;

  if (user.experience) score += 10;
  if (user.location) score += 5;

  if (user.resume) score += 15; // 🔥 increased

  return Math.min(score, 100);
}
// =============================
// Update profile progress bar
// =============================
function updateProfileProgress(percent, fillId = "progress-fill", textId = "progress-text") {
  const bar = document.getElementById(fillId);
  const text = document.getElementById(textId);
  if (!bar || !text) return;

  bar.style.width = `${percent}%`;
  text.textContent = `Profile ${percent}% complete`;

  bar.classList.remove("red", "yellow", "green");
  if (percent < 40) bar.classList.add("red");
  else if (percent < 70) bar.classList.add("yellow");
  else bar.classList.add("green");
}

// =============================
// Profile suggestions
// =============================
function generateProfileSuggestions(user) {
  const suggestions = [];

  if (!user.bio || user.bio.trim() === "") {
    suggestions.push("Add a short bio to help employers know you better.");
  }

  const skillsCount = user.skills
    ? (Array.isArray(user.skills)
        ? user.skills.length
        : user.skills.split(",").filter(s => s.trim() !== "").length)
    : 0;

  if (skillsCount < 3) {
    suggestions.push("Add at least 3 skills to improve your AI job matches.");
  }

  if (!user.education || user.education.trim() === "") {
    suggestions.push("Add your education level.");
  }

  if (
    (!user.main_interest || user.main_interest.trim() === "") &&
    (!user.other_interest || user.other_interest.trim() === "")
  ) {
    suggestions.push("Select at least one career interest.");
  }

  return suggestions;
}

function displaySuggestions(list) {
  const container = document.getElementById("suggestionList");
  if (!container) return;

  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<li>Your profile is complete 🎉</li>";
    return;
  }

  list.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    container.appendChild(li);
  });
}

// =============================
// Dropdown toggle
// =============================
function showDropdown() {
  const dropdown = document.getElementById("dropdownMenu");
  if (!dropdown) return;

  dropdown.classList.add("show");
  dropdown.setAttribute("aria-hidden", "false");
  document.body.classList.add("dropdown-open");
}

function hideDropdown() {
  const dropdown = document.getElementById("dropdownMenu");
  if (!dropdown) return;

  dropdown.classList.remove("show");
  dropdown.setAttribute("aria-hidden", "true");
  document.body.classList.remove("dropdown-open");
}

// =============================
// Logout
// =============================
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  hideDropdown();
  window.location.href = "index.html";
}

// =============================
// Load AI recommendations
// =============================
async function loadAIRecommendations(user) {
  try {
    const res = await fetch(`${API_URL}/jobs`);
    const jobs = await res.json();

    if (!Array.isArray(jobs)) {
      console.error("Jobs is not an array:", jobs);
      throw new Error("Invalid jobs data");
    } 

    const container = document.getElementById("aiJobs");
    if (!container) return;

    container.innerHTML = "";

    if (!jobs || jobs.length === 0) {
      container.innerHTML = "<p>No job recommendations available yet.</p>";
      return;
    }

    const today = new Date();
    const validJobs = jobs.filter(job => {
      if (!job.deadline) return true;
      return new Date(job.deadline) >= new Date();
    });

    const userSkills = user.skills
    ? user.skills.toLowerCase().split(",").map(s => s.trim())
    : [];
  
  const userInterest = (user.main_interest || "").toLowerCase();
  const userOtherInterest = (user.other_interest || "").toLowerCase();
  const userEducation = (user.education || "").toLowerCase();
  const userExperience = (user.experience || "").toLowerCase();
  const userLocation = (user.location || "").toLowerCase();
 

    const scoredJobs = validJobs.map(job => {
    let score = 0;
  
    const title = (job.title || "").toLowerCase();
    const description = (job.description || "").toLowerCase();
    const jobExp = (job.experience || "").toString().toLowerCase();
    const jobLocation = (job.location || "").toLowerCase();
  
    // 🔹 Skills match
    userSkills.forEach(skill => {
      if (title.includes(skill) || description.includes(skill)) {
        score += 4;
      }
    });
  
    // 🔹 Main Interest (HIGH weight)
    if (userInterest && (title.includes(userInterest) || description.includes(userInterest))) {
      score += 6;
    }
  
    // 🔹 Other Interest
    if (userOtherInterest && (title.includes(userOtherInterest) || description.includes(userOtherInterest))) {
      score += 3;
    }
  
    // 🔹 Education
    if (userEducation && description.includes(userEducation)) {
      score += 2;
    }
  
    // 🔹 EXPERIENCE MATCH (🔥 NEW)
    if (userExperience && jobExp) {
      if (userExperience === jobExp) score += 6;
      else if (
        (userExperience === "intermediate" && jobExp === "beginner") ||
        (userExperience === "expert" && jobExp !== "expert")
      ) {
        score += 3; // overqualified but still ok
      }
    }
  
    // 🔹 Location match
    if (userLocation && jobLocation.includes(userLocation)) {
      score += 3;
    }
  
    // 🔹 Profile strength bonus
    const profileScore = calculateProfileCompletion(user);
    if (profileScore > 70) score += 2;
  
    return { ...job, score };
  });

    // ✅ Sort by best match
    scoredJobs.sort((a, b) => b.score - a.score);

    // ✅ Show top jobs
    scoredJobs.slice(0, 6).forEach(job => {
      const card = document.createElement("div");
      card.className = "job-card";

      card.innerHTML = `
      <h4>${job.title}</h4>
      <p>${(job.description || "").substring(0, 80)}...</p>
    
      <small>Company: ${job.employer_name || "Company"}</small><br>
      <small>Match: ${job.score}</small><br><br>
    
      <button onclick="applyForJob(${job.id})">Apply</button>
      <a href="job.html?id=${job.id}" class="details-btn">Details</a>
    `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error("Failed to load AI recommendations:", err);
    const container = document.getElementById("aiJobs");
    if (container) container.innerHTML = "<p>Unable to load recommendations.</p>";
  }

}


// =============================
// Load saved jobs
// =============================
async function loadSavedJobs() {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/jobs/saved`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const jobs = await res.json();

    const container = document.getElementById("savedJobs");
    if (!container) return;

    container.innerHTML = "";

    if (!jobs || jobs.length === 0) {
      container.innerHTML = "<p>You haven't saved any jobs yet.</p>";
      return;
    }

    const today = new Date();

    jobs.forEach(job => {
      const card = document.createElement("div");
      card.className = "job-card";

      // Compute deadline info
      let deadlineText = "No deadline";
      let isUrgent = false;

      if (job.deadline) {
        const deadlineDate = new Date(job.deadline);
        deadlineText = deadlineDate.toDateString();

        // Highlight urgent jobs (less than 3 days left)
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 3 && diffDays >= 0) isUrgent = true;
      }

      card.innerHTML = `
        <h4>${job.title}</h4>
        <p>${job.description || "No description available."}</p>
        <small>Employer: ${job.employer_name || "Company"}</small><br>
        <small>Location: ${job.location || "Not specified"}</small><br>
        <small>Deadline: <span class="${isUrgent ? 'urgent-deadline' : ''}">${deadlineText}</span></small><br><br>
        
        <div class="saved-job-actions">
          <a href="job.html?id=${job.id}" class="details-btn">Job Details</a>
          <button class="delete-btn" onclick="removeSavedJob(${job.id})">Delete</button>
        </div>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load saved jobs:", err);
    const container = document.getElementById("savedJobs");
    if (container) {
      container.innerHTML = "<p>Failed to load saved jobs.</p>";
    }
  }
}


// =============================
// Custom confirmation dialog
// =============================
function showConfirmDialog(message) {
  return new Promise((resolve) => {
    const dialog = document.getElementById("confirmDialog");
    const messageEl = document.getElementById("confirmDialogMessage");
    const okBtn = document.getElementById("confirmOkBtn");
    const cancelBtn = document.getElementById("confirmCancelBtn");

    if (!dialog || !messageEl || !okBtn || !cancelBtn) {
      // Fallback if modal is missing
      resolve(false);
      return;
    }

    messageEl.textContent = message;
    dialog.classList.remove("hidden");

    const closeDialog = (result) => {
      dialog.classList.add("hidden");

      okBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
      dialog.removeEventListener("click", onOutsideClick);
      document.removeEventListener("keydown", onEsc);

      resolve(result);
    };

    const onConfirm = () => closeDialog(true);
    const onCancel = () => closeDialog(false);

    const onOutsideClick = (e) => {
      if (e.target === dialog) closeDialog(false);
    };

    const onEsc = (e) => {
      if (e.key === "Escape") closeDialog(false);
    };

    okBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
    dialog.addEventListener("click", onOutsideClick);
    document.addEventListener("keydown", onEsc);
  });
}

// =============================
// Remove saved job
// =============================
async function removeSavedJob(jobId) {
  const token = localStorage.getItem("token");

  if (!token) {
    showToast("Please log in first.", "error");
    return;
  }

  const confirmDelete = await showConfirmDialog(
    "Are you sure you want to remove this job from your saved jobs?"
  );

  if (!confirmDelete) return;

  try {
    const res = await fetch(`${API_URL}/jobs/save/${jobId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Failed to remove saved job.", "error");
      return;
    }

    showToast("Saved job removed successfully.", "success");
    loadSavedJobs();
  } catch (err) {
    console.error("Failed to remove saved job:", err);
    showToast("Could not remove saved job. Try again later.", "error");
  }
}

// =============================
// Load my applications
// =============================
async function loadMyApplications() {
  try {
    const res = await fetch(`${API_URL}/applications/my-applications`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });

    const apps = await res.json();

    const container = document.getElementById("myApplications");
    if (!container) return;

    container.innerHTML = "";

    if (!apps || apps.length === 0) {
      container.innerHTML = "<p>You haven't applied for any jobs yet.</p>";
      return;
    }

    apps.forEach(app => {
      const card = document.createElement("div");
      card.className = "job-card";

      card.innerHTML = `
        <h4>${app.title}</h4>
        <p>${app.message || "(No message)"}</p>
        <small>Employer: ${app.employer || "Employer"}</small><br>
        <small>Applied on: ${new Date(app.created_at).toLocaleDateString()}</small>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load applications:", err);
    const container = document.getElementById("myApplications");
    if (container) container.innerHTML = "<p>Failed to load your applications.</p>";
  }
}

// =============================
// Apply for job
// =============================
function applyForJob(jobId) {
  const token = localStorage.getItem("token");

  if (!token) {
    showToast("Please log in first.", "error");
    return;
  }

  if (!jobId) {
    showToast("No job selected.", "error");
    return;
  }

  // Save exact page user came from
  sessionStorage.setItem("applyReturnPage", window.location.href);

  // Go to apply page with job id
  window.location.href = `apply.html?id=${jobId}`;
}

// =============================
// Initialize dashboard
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token) {
    window.location.href = "index.html";
    return;
  }

  // Redirect if wrong dashboard
  if (user.role === "employer" && !window.location.href.includes("Employer")) {
    window.location.href = "dashboardEmployer.html";
    return;
  } else if (user.role === "student" && window.location.href.includes("Employer")) {
    window.location.href = "dashboard.html";
    return;
  }

  // Welcome name
  const fullName = (user.first_name || "") + (user.last_name ? " " + user.last_name : "");
  const nameEl = document.getElementById("navStudentName");
  if (nameEl) {
    nameEl.textContent = fullName.trim() || "Student";
  }

  // Avatar
  const avatar = document.getElementById("userProfilePic");
  if (avatar) {
    avatar.src = user.profile_image
    ? `http://localhost:5000${user.profile_image}?t=${Date.now()}`
    : "image/avatar-placeholder.png";
  
  avatar.onerror = () => {
    avatar.src = "image/avatar-placeholder.png";
  };

    avatar.addEventListener("click", () => {
      const dropdown = document.getElementById("dropdownMenu");
      if (!dropdown) return;

      const isOpen = dropdown.classList.contains("show");
      if (isOpen) hideDropdown();
      else showDropdown();
    });
  }

  async function refreshUser() {
    const res = await fetch("http://localhost:5000/api/users/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
  
    const data = await res.json();
  
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  }
  
        // INITIAL UI (instant, no delay)
        (async () => {
          try {
            // ONLY fetch fresh user (no initial render)
            const freshUser = await refreshUser();
        
            // Update name
            const fullName =
              (freshUser.first_name || "") +
              (freshUser.last_name ? " " + freshUser.last_name : "");
        
            const nameEl = document.getElementById("navStudentName");
            if (nameEl) nameEl.textContent = fullName.trim() || "Student";
        
            // Single UI update (NO jump)
            updateProfileProgress(calculateProfileCompletion(freshUser));
            displaySuggestions(generateProfileSuggestions(freshUser));
            loadAIRecommendations(freshUser);
        
          } catch (err) {
            console.error("Dashboard init error:", err);
          }
        })();

  // Logout
  const logoutLink = document.getElementById("logoutBtn");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Dark mode
  const darkBtn = document.getElementById("darkModeToggle");
  if (darkBtn) {
   // Apply saved theme on dashboard load
    const savedTheme = localStorage.getItem("studentTheme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      darkBtn.textContent = "☀️";
    } else {
      darkBtn.textContent = "🌙";
    }

    darkBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("studentTheme", isDark ? "dark" : "light");

    darkBtn.textContent = isDark ? "☀️" : "🌙";
    });
  }

  // Outside click closes dropdown
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("dropdownMenu");
    const avatar = document.getElementById("userProfilePic");

    if (!dropdown || !avatar) return;

    if (!dropdown.contains(e.target) && e.target !== avatar) {
      hideDropdown();
    }
  });

  // Escape closes dropdown
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideDropdown();
    }
  });

  // Load dashboard content
  loadSavedJobs();
  loadMyApplications();
});

//=========================================================///
function startDeadlineCountdown(jobId, deadline) {
  const countdownEl = document.getElementById(`countdown-${jobId}`);
  const deadlineTime = new Date(deadline).getTime();

  const interval = setInterval(() => {
    const now = new Date().getTime();
    const distance = deadlineTime - now;

    if (distance < 0) {
      countdownEl.textContent = "Deadline passed";
      countdownEl.classList.add("text-red-500");
      clearInterval(interval);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);

    countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }, 1000);
}
/* ==============================================
Chat
===============================================*/
function openChatInbox() {
  window.location.href = "chat.html";
}

const socket = io("http://localhost:5000");
const chatUser = JSON.parse(localStorage.getItem("user"));

socket.on("connect", () => {
  socket.emit("joinRoom", { userId: String(chatUser.id) });

  // ✅ load unread after joining
  loadUnread();
});

// 🔔 Listen for unread count (REAL-TIME)
socket.on("unreadCount", (count) => {
  const badge = document.getElementById("notificationBadge");

  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline-block" : "none";
  }
});

// ✅ Fetch unread count
async function loadUnread() {
  const res = await fetch(`http://localhost:5000/api/chat/unread`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  });

  const data = await res.json();

  const badge = document.getElementById("notificationBadge");

  if (badge) {
    badge.textContent = data.unread;
    badge.style.display = data.unread > 0 ? "inline-block" : "none";
  }
}
