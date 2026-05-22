const API_URL = "https://karangcareerhub-api.onrender.com/api";
const socket = io("https://karangcareerhub-api.onrender.com");
/* ===============================
   INITIALIZATION
================================ */
let allJobs = [];
let allApplications = [];
let currentJobApplications = [];
let jobToDelete = null;
let selectedApplicant = null;
  
document.addEventListener("DOMContentLoaded", async () => {
  const user = await protectEmployer(); 

  setupProfileDropdown();
  setupDarkMode();
  const jobs = await loadEmployerJobs();
   allJobs = jobs || [];
  await loadEmployerDashboardData();
  setupFilters();
  await loadNotifications();
  setInterval(loadNotifications, 30000);

  
  if (user) {
    setEmployerInfo(user);
    setProfileAvatar(user);
  
    socket.emit("join", user.id);

    socket.off("new_notification");
  
    socket.on("new_notification", (notification) => {
  
      console.log("🔔 New notification:", notification);
  
      loadNotifications();
  
      showToast(notification.title + " 🔔");
    });
    window.addEventListener("beforeunload", () => {
      socket.disconnect();
    });
  }

  // ✅ MOVE DELETE BUTTON HERE
  const confirmBtn = document.getElementById("confirmDelete");

  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      if (!jobToDelete) {
        showNotification("No job selected for deletion ❌");
        return;
      }
    
      const token = localStorage.getItem("token");
    
      try {
        const res = await fetch(`${API_URL}/jobs/${jobToDelete}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
    
        const data = await res.json().catch(() => ({}));
    
        if (!res.ok) {
          throw new Error(data.message || "Delete failed");
        }
    
        showNotification("Job deleted successfully ✅");
    
        closeDeleteModal();
        jobToDelete = null;
        const jobs = await loadEmployerJobs();
        allJobs = jobs || [];
        updateStats(allJobs);
    
      } catch (err) {
        console.error(err);
        showNotification(err.message || "Failed to delete job ❌");
      }
    });
  }

});



/* ===============================
   PROTECT EMPLOYER
================================ */
async function protectEmployer() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok || !data.user || data.user.role !== "employer") {
      throw new Error();
    }

    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user; 

  } catch {
    localStorage.clear();
    window.location.href = "login.html";
  }
}

/* ===============================
   SET EMPLOYER INFO
================================ */
function setEmployerInfo(user) {
  if (!user) return;

  const displayName = 
    (user.first_name && user.last_name)
      ? `${user.first_name} ${user.last_name}`
      : user.first_name || user.last_name || (user.email?.split("@")[0]) || "Employer";

  const empName = document.getElementById("empName");
  const profileEmployerName = document.getElementById("profileEmployerName");
  const profileEmployerEmail = document.getElementById("profileEmployerEmail");

  if (empName) empName.textContent = `Welcome, ${displayName} 👋`;
  if (profileEmployerName) profileEmployerName.textContent = displayName;
  if (profileEmployerEmail) profileEmployerEmail.textContent = user.email || "No email";
}

/* ===============================
   FETCH EMPLOYER JOBS
================================ */
async function loadEmployerJobs() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_URL}/jobs`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const jobs = await res.json();

    console.log("===== ALL JOBS RESPONSE =====");
    console.log(jobs);

    if (!res.ok) {
      console.error("Jobs API error:", jobs);
      renderJobs([]);
      return;
    }

    if (!Array.isArray(jobs)) {
      console.error("Jobs response is not an array:", jobs);
      renderJobs([]);
      return;
    }
    
    allJobs = jobs;
    renderJobs(jobs);

    return jobs;

  } catch (err) {
    console.error("Error loading employer jobs:", err);
    renderJobs([]);
    return [];
  }
}
/*=======================fetch user=====================*/
async function fetchUser() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json();
  const user = data.user;
  
  localStorage.setItem("user", JSON.stringify(user));

  return user;

}
/* ===============================
   RENDER JOBS TABLE & STATS
================================ */
function renderJobs(jobs) {
  const tbody = document.getElementById("jobsTableBody");

  if (!tbody) return;
  
  tbody.innerHTML = "";

  const now = new Date();

  const activeJobs = jobs.filter(job => !job.deadline || new Date(job.deadline) >= now).length;
  const expiredJobs = jobs.filter(job => job.deadline && new Date(job.deadline) < now).length;

  document.getElementById("totalJobs").textContent = jobs.length;
  document.getElementById("activeJobs").textContent = activeJobs;
  document.getElementById("expiredJobs").textContent = expiredJobs;

  if (!jobs.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">No jobs posted yet.</td></tr>`;
    return;
  }

  jobs.forEach(job => {
    const tr = document.createElement("tr");

    const applicantsCount = job.applicants_count || 0;
    const views = job.views || 0;
    const category = job.category || "N/A";
    const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString() : "No deadline";

  
   tr.innerHTML = `
    <td>${escapeHTML(job.title || "Untitled Job")}</td>
    <td>${escapeHTML(category)}</td>
    <td>${escapeHTML(String(views))}</td>
    <td>
      <button class="mini-btn" onclick="viewApplicants(${Number(job.id)}, '${escapeSingleQuotes(job.title || "Untitled Job")}')">
        View (${Number(applicantsCount)})
      </button>
    </td>
    <td>${escapeHTML(deadline)}</td>
    <td>
      <span class="${calculateStatus(job.deadline) === 'Active' ? 'status-active' : 'status-expired'}">
        ${calculateStatus(job.deadline)}
      </span>
    </td>
    <td>
      <button class="delete-btn" onclick="openDeleteModal(${job.id})">Delete</button>
    </td>
  `;

    tbody.appendChild(tr);
  });
}

/* ===============================
   CALCULATE JOB STATUS
================================ */
function calculateStatus(deadline) {
  if (!deadline) return "Active";
  return new Date(deadline) >= new Date() ? "Active" : "Expired";
}

/* ===============================
   VIEW APPLICANTS
================================ */
async function viewApplicants(jobId, title) {
  document.getElementById("jobTitle").textContent = title;
  document.getElementById("applicantsSection").classList.remove("hidden");

  const list = document.getElementById("applicantsList");
  const details = document.getElementById("applicantDetails");

  list.innerHTML = "Loading...";
  details.innerHTML = "<p>Select an applicant</p>";

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_URL}/applications/employer?jobId=${jobId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    currentJobApplications = Array.isArray(data) ? data : [];
    list.innerHTML = "";

    if (!Array.isArray(data) || !data.length) {
      list.innerHTML = "<p>No applicants yet.</p>";
      return;
    }

    data.forEach(app => {
      const div = document.createElement("div");
      div.className = "applicant-item";
    
      div.innerHTML = `
        <div class="applicant-name">${escapeHTML(app.student_name)}</div>
        <div>${escapeHTML(app.student_email)}</div>
    
        <span class="status-badge ${escapeHTML(app.status || "").toLowerCase()}">
          ${escapeHTML(app.status)}
        </span>
      `;
    
      div.onclick = () => {
        document.querySelectorAll(".applicant-item")
          .forEach(el => el.classList.remove("active"));
    
        div.classList.add("active");
    
        showApplicantDetails(app);
      };
    
      list.appendChild(div);
    });

  } catch (err) {
    list.innerHTML = "<p>Failed to load applicants</p>";
  }
}
// =====================================================
//Show applicants details
//===========================================================
function showApplicantDetails(app) {
  const details = document.getElementById("applicantDetails");

  const skillsArray = Array.isArray(app.skills)
  ? app.skills
  : (app.skills || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

  const matchScore = calculateMatchScore(app);
  const isTopCandidate = matchScore >= 80;

  const safeResume = encodeURIComponent(app.resume_url || "");

  details.innerHTML = `
    <div class="details-header">
      <div>
        <h2>
          ${escapeHTML(app.student_name || "")}
          ${isTopCandidate ? '<span class="top-badge">⭐ Top Candidate</span>' : ""}
        </h2>

        <p>${escapeHTML(app.student_email || "")}</p>
      </div>

      <p><strong>Match Score:</strong> ${escapeHTML(matchScore)}%</p>

      <span class="status-badge ${escapeHTML(app.status || "").toLowerCase()}">
        ${escapeHTML(app.status || "Pending")}
      </span>
    </div>

    <p><strong>Location:</strong> ${escapeHTML(app.location || "N/A")}</p>
    <p><strong>Education:</strong> ${escapeHTML(app.education || "N/A")}</p>
    <p><strong>Experience:</strong> ${escapeHTML(app.experience || "N/A")}</p>

    <div class="skills">
      ${skillsArray
        .map(s => `<span class="skill-tag">${escapeHTML(s)}</span>`)
        .join("")}
    </div>

    <div class="app-message-box">
      ${escapeHTML(app.message || "No message provided")}
    </div>

    <div class="action-buttons">

      <button onclick="previewCV(decodeURIComponent('${safeResume}'))">
        📄 View CV
      </button>

      <button onclick="downloadApplicantProfile(${Number(app.application_id)})">
        📥 Download Profile
      </button>

      <button onclick="openChat(${Number(app.student_id)})">
        💬 Chat
      </button>

      <button onclick="updateApplicationStatus(${Number(app.application_id)}, 'shortlisted')">
        ⭐ Shortlist
      </button>

      <button onclick="updateApplicationStatus(${Number(app.application_id)}, 'accepted')">
        ✅ Accept
      </button>

      <button onclick="updateApplicationStatus(${Number(app.application_id)}, 'rejected')">
        ❌ Reject
      </button>

    </div>
  `;
}
//============================================
// CV
//============================================
function previewCV(url) {
  if (!url) {
    return showNotification("No CV available");
  }

  try {
    const parsedUrl = new URL(url);

    const win = window.open("", "_blank", "noopener,noreferrer");

    
    if (!win) {
      showNotification("Popup blocked");
      return;
    }
    // ✅ Only allow http/https URLs
    if (
      parsedUrl.protocol !== "http:" &&
      parsedUrl.protocol !== "https:"
    ) {
      throw new Error("Invalid protocol");
    }
    
    const allowedHosts = [
      "karangcareerhub-api.onrender.com"
    ];
    
    if (!allowedHosts.includes(parsedUrl.hostname))
     {
      throw new Error("Untrusted file source");
    }

    // ✅ Create HTML safely
    const doc = win.document;

    doc.open();

    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>CV Preview</title>

        <style>
          body {
            margin: 0;
            overflow: hidden;
            font-family: Arial, sans-serif;
            background: #f4f4f4;
          }

          iframe {
            width: 100%;
            height: 100vh;
            border: none;
          }

          .download-btn {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #0b3e91;
            color: white;
            padding: 10px 15px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            z-index: 1000;
          }

          .download-btn:hover {
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
      </body>
      </html>
    `);

    doc.close();

    // ✅ Create iframe safely
    const iframe = doc.createElement("iframe");
    iframe.src = parsedUrl.href;
    iframe.setAttribute("sandbox", "allow-downloads");

    // ✅ Create download link safely
    const link = doc.createElement("a");
    link.href = parsedUrl.href;
    link.download = "";
    link.textContent = "Download CV";
    link.className = "download-btn";
    link.rel = "noopener noreferrer";

    doc.body.appendChild(link);
    doc.body.appendChild(iframe);

  } catch (err) {
    console.error("Invalid CV URL:", err);
    showNotification("Invalid CV file");
  }
}

//===============================
// Action
//===================================
function filterByStatus(status) {
  let filtered = allApplications;

  if (status) {
    filtered = allApplications.filter(app =>
      (app.status || "").toLowerCase() === status.toLowerCase()
    );
  }

  renderApplications(filtered);
}

//=========================================
// AI Match Score
//=========================================
function calculateMatchScore(app) {
  let score = 0;

  // =============================
  // SKILLS MATCH (40%)
  // =============================
  const userSkills = (app.skills || "")
    .toLowerCase()
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
    const jobSkills = (app.job_skills || "").toLowerCase().split(",");

  if (userSkills.length && jobSkills.length) {
    let match = 0;

    jobSkills.forEach(skill => {
      if (userSkills.includes(skill.trim())) {
        match++;
      }
    });

    const skillScore = (match / jobSkills.length) * 40;
    score += skillScore;
  }

  // =============================
  // CATEGORY MATCH (30%)
  // job.category vs student.main_interest
  // =============================
  const jobCategory = (app.job_category || "").toLowerCase();
  const userInterest = (app.main_interest || "").toLowerCase();

  if (jobCategory && userInterest) {
    if (jobCategory.includes(userInterest) || userInterest.includes(jobCategory)) {
      score += 30;
    }
  }

  // =============================
  // LOCATION MATCH (30%)
  // =============================
  const jobLocation = (app.job_location || app.location || "").toLowerCase();
  const userLocation = (app.student_location || app.location || "").toLowerCase();

  if (jobLocation && userLocation) {
    if (jobLocation.includes(userLocation) || userLocation.includes(jobLocation)) {
      score += 30;
    }
  }

  return Math.round(score);
}

//======================================
// Chat
//========================================
function openChat(userId) {
  window.location.href = `chat.html?user=${Number(userId)}`;
}

//=============================
// download profile helper
///===============================
async function toBase64(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch image");
  }

  const blob = await res.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
}

//===================================
// Downloard Profile
//======================================
async function downloadApplicantProfile(id) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_URL}/applications/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      showToast("Download failed ❌", "error");
      return;
    }

    const jsPDFLib = window.jspdf?.jsPDF;

    if (!jsPDFLib) {
      showToast("PDF library missing ❌", "error");
      return;
    }

    const doc = new jsPDFLib();
    let y = 40;

    // HEADER
    doc.setFillColor(11, 62, 145);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Applicant Profile", 20, 20);

    doc.setTextColor(0, 0, 0);

    // PROFILE IMAGE
    if (data.profile_image) {
      try {
        const imageUrl = data.profile_image.startsWith("http")
          ? data.profile_image
          : "https://karangcareerhub-api.onrender.com" + data.profile_image;
        const base64 = await toBase64(imageUrl);

        doc.addImage(base64, "JPEG", 150, 35, 40, 40);
      } catch (e) {
        console.log("Image failed:", e);
      }
    }

    // =========================
    // PERSONAL INFO
    // =========================
    doc.setFontSize(18);
    doc.text("Personal Information", 20, y);
    y += 8;

    doc.setFontSize(12);
    doc.text(`Name: ${data.first_name} ${data.last_name}`, 20, y); y += 6;
    doc.text(`Email: ${data.email}`, 20, y); y += 6;
    doc.text(`Phone: ${data.phone_primary || "N/A"}`, 20, y); y += 6;
    doc.text(`Date of Birth: ${data.date_of_birth || "N/A"}`, 20, y); y += 6;

    y += 5;

    // =========================
    // PROFESSIONAL DETAILS
    // =========================
    doc.setFontSize(18);
    doc.text("Professional Details", 20, y);
    y += 8;

    doc.setFontSize(12);
    doc.text(`Education: ${data.education || "N/A"}`, 20, y); y += 6;
    doc.text(`Experience: ${data.experience || "N/A"}`, 20, y); y += 6;

    // SKILLS
    y += 4;
    doc.setFontSize(18);
    doc.text("Skills:", 20, y); 
    y += 6;

    const skillsText = data.skills || "No skills provided";
    doc.text(doc.splitTextToSize(skillsText, 170), 20, y);
    y += 10;

    // =========================
    // APPLICATION INFO
    // =========================
    doc.setFontSize(18);
    doc.text("Application Info", 20, y);
    y += 8;

    doc.setFontSize(12);
    doc.text(`Applied Job: ${data.job_title}`, 20, y);
    y += 6;

    // MESSAGE
    doc.text("Message:", 20, y);
    y += 6;

    doc.text(
      doc.splitTextToSize(data.message || "No message provided", 170),
      20,
      y
    );

    // FOOTER
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Generated by KarangCareerHub", 20, 290);

    // SAVE
    doc.save(`${data.first_name}_profile.pdf`);

    showToast("Download successful ✅");

  } catch (err) {
    console.error(err);
    showToast("Download failed ❌", "error");
  }
}
//============================
//ShowToast
//==========================================
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ===============================
   DELETE JOB
================================ */
function openDeleteModal(id) {
  jobToDelete = id;
  document.getElementById("deleteModal").classList.remove("hidden");
}

function closeDeleteModal() {
  jobToDelete = null;
  document.getElementById("deleteModal").classList.add("hidden");
}

//==========================
function showNotification(message, type = "success") {
  showToast(message, type);
}

/* ===============================
   TOTAL APPLICANTS
================================ */
async function loadTotalApplicants() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_URL}/applications/employer`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    document.getElementById("totalApplicants").textContent = Array.isArray(data) ? data.length : "0";

  } catch (err) {
    console.error("Error loading applicants:", err);
    document.getElementById("totalApplicants").textContent = "0";
  }
}

/* ===============================
   RECENT APPLICATION CARDS
================================ */
function loadRecentCards(apps) {
  const container = document.getElementById("applications");

  if (!container) return;

  container.innerHTML = "";

  const recent = [...apps]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  if (!recent.length) {
    container.innerHTML = "<p>No applications yet.</p>";
    return;
  }

  renderApplications(recent);
}
//===============================================
// Render Applications
//=============================================
function renderApplications(apps) {
  const container = document.getElementById("applications");
  container.innerHTML = "";

  if (!Array.isArray(apps) || !apps.length) {
    container.innerHTML = "<p>No matching applicants found.</p>";
    return;
  }

  apps.forEach(app => {
    const div = document.createElement("div");
    div.className = "application-card";

    div.innerHTML = `
      <div class="clickable-card">
        <h4>${escapeHTML(app.student_name || "Unknown")}</h4>

        <p><strong>Job:</strong> ${escapeHTML(app.job_title || "N/A")}</p>
        <p><strong>Email:</strong> ${escapeHTML(app.student_email || "N/A")}</p>
        <p><strong>Phone:</strong> ${escapeHTML(app.phone || "N/A")}</p>
        <p><strong>Location:</strong> ${escapeHTML(app.address || "N/A")}</p>
        <p><strong>Skills:</strong> ${escapeHTML(app.skills || "Not provided")}</p>

        <span class="status ${escapeHTML((app.status || "").toLowerCase())}">
         ${escapeHTML(app.status || "Pending")}
        </span>
      </div>
    `;

    // ✅ FIX CLICK HERE
    div.querySelector(".clickable-card").addEventListener("click", () => {
      selectedApplicant = app;
      showApplicantDetails(app);

      // scroll to details
      document.getElementById("applicantsSection").classList.remove("hidden");
      document.getElementById("applicantDetails").scrollIntoView({
        behavior: "smooth"
      });
    });

    container.appendChild(div);
  });
}

function setupFilters() {
  const inputs = document.querySelectorAll(
    "#filterSkills, #filterEducation, #filterCategory, #filterGender, #filterLocation, #filterExperience, #filterJobType"
  );

  inputs.forEach(input => {
    input.addEventListener("input", runFilters);
    input.addEventListener("change", runFilters);
  });
}

function runFilters() {
  const source =
    currentJobApplications.length > 0
      ? currentJobApplications
      : allApplications;

  const filtered = applyFilters(source);
  renderApplications(filtered);
}

//===========================================================
// filter area
//=======================================================

function applyFilters(apps) {
  const skill = document.getElementById("filterSkills").value.toLowerCase();
  const edu = document.getElementById("filterEducation").value;
  const cate = document.getElementById("filterCategory").value;
  const gen = document.getElementById("filterGender").value;
  const loc = document.getElementById("filterLocation").value.toLowerCase();
  const exp = document.getElementById("filterExperience").value;
  const job = document.getElementById("filterJobType").value;

  return apps.filter(app => {
    const skills = (app.skills || "").toLowerCase();
    const education = app.education || app.profile?.education || "";
    const category = app.job_category || app.category || "";
    const gender = app.gender || app.profile?.gender || "";
    const location = (app.location || "").toLowerCase();
    const experience = app.experience || app.profile?.experience || "";
    const jobtype = app.job_type || app.jobtype || "";

    return (
      (!skill || skills.includes(skill)) &&
      (!edu || education === edu) &&
      (!cate || category === cate) &&
      (!gen || gender.toLowerCase() === gen.toLowerCase()) &&
      (!loc || location.includes(loc)) &&
      (!exp || experience === exp) &&
      (!job || jobtype === job)
    );
  });
}


//==========================================
function openApplicant(id) {
  window.location.href = `applicantDetails.html?id=${id}`;
}
/* ===============================
   UPDATE APPLICATION STATUS
================================ */
async function updateApplicationStatus(id, status) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_URL}/applications/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showNotification(data.error || data.message || "Failed to update status");
      return;
    }

    showNotification("Status updated successfully.");

    const target = allApplications.find(
      a => Number(a.application_id) === Number(id)
    );
    
    if (target) {
      target.status = status;
      showApplicantDetails(target);
    }
    
    renderApplications(allApplications);

  } catch (err) {
    console.error("Update status error:", err);
    showNotification("Failed to update status");
  }
}

function hideApplicants() {
  document.getElementById("applicantsSection").classList.add("hidden");
}
//========================================
// Filter for Accept, Reject, Shortlist
//===============================
function filterApplicantStatus() {
  const value = document
    .getElementById("filterApplicantType")
    .value
    .toLowerCase();

  if (!value) {
    renderApplications(allApplications);
    return;
  }

  const filtered = allApplications.filter(app =>
    (app.status || "").toLowerCase() === value
  );

  renderApplications(filtered);
}

/* ===============================
   PROFILE DROPDOWN
================================ */
function setupProfileDropdown() {
  const wrapper = document.getElementById("profileMenu");
  const dropdown = wrapper?.querySelector(".profile-dropdown");
  if (!wrapper || !dropdown) return;

  wrapper.setAttribute("tabindex", "0");
  wrapper.setAttribute("aria-haspopup", "true");
  wrapper.setAttribute("aria-expanded", "false");

  function toggleDropdown(show) {
    const isOpen = wrapper.classList.contains("active");
    if (show === undefined) show = !isOpen;

    wrapper.classList.toggle("active", show);
    wrapper.setAttribute("aria-expanded", show);
  }

  wrapper.addEventListener("click", e => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener("click", e => {
    if (!wrapper.contains(e.target)) toggleDropdown(false);
  });

  wrapper.addEventListener("keydown", e => {
    if (["Enter", " "].includes(e.key)) {
      e.preventDefault();
      toggleDropdown();
    } else if (e.key === "Escape") {
      toggleDropdown(false);
      wrapper.blur();
    }
  });

  dropdown.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => toggleDropdown(false));
  });
}

/* ===============================
   LOGOUT
================================ */
function logout(event) {
  event.preventDefault();
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

/* ===============================
   HELPERS
================================ */
function escapeSingleQuotes(str) {
  return String(str).replace(/'/g, "\\'");
}

function escapeHTML(str) {
  if (str === null || str === undefined) return "";

  return String(str).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[m]);
}

function formatImage(path) {

  if (!path) {
    return "image/default-avatar.png";
  }

  if (path.startsWith("http")) {
    return path;
  }

  return `https://karangcareerhub-api.onrender.com/${path.replace(/^\/+/, "")}`;
}

function setProfileAvatar(user) {
  const avatar = document.getElementById("profileAvatar");

  if (!user || !avatar) return;

  let img = "image/default-avatar.png";

  if (user.company_logo) {
    img = formatImage(user.company_logo);
  } else if (user.profile_image) {
    img = formatImage(user.profile_image);
  }

  avatar.src = img + "?t=" + Date.now();
}
/* ===============================
   DARK MODE
================================ */
// Employer Dark Mode (Global)

function setupDarkMode() {
  const darkModeToggle = document.getElementById("darkModeToggle");

  if (!darkModeToggle) return;

  const savedTheme = localStorage.getItem("employerTheme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    darkModeToggle.textContent = "☀️";
  } else {
    darkModeToggle.textContent = "🌙";
  }

  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("employerTheme", isDark ? "dark" : "light");

    darkModeToggle.textContent = isDark ? "☀️" : "🌙";
  });
}

async function loadEmployerDashboardData() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_URL}/applications/employer`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid data");
    }

    // GLOBAL STATE
    allApplications = data;

    // UI updates from ONE source
    renderApplications(allApplications);
    updateStats(allJobs || []);
    updateTotalApplicants(allApplications);
    loadRecentCards(allApplications);

  } catch (err) {
    console.error("Dashboard load error:", err);
  }
}
function updateStats(jobs) {
  const now = new Date();

  const activeJobs = jobs.filter(job =>
    !job.deadline || new Date(job.deadline) >= now
  ).length;

  const expiredJobs = jobs.filter(job =>
    job.deadline && new Date(job.deadline) < now
  ).length;

  document.getElementById("activeJobs").textContent = activeJobs;
  document.getElementById("expiredJobs").textContent = expiredJobs;
  document.getElementById("totalJobs").textContent = jobs.length;
}

function updateTotalApplicants(applications) {
  const total = Array.isArray(applications)
    ? applications.length
    : 0;

  const totalApplicants =
    document.getElementById("totalApplicants");

  if (totalApplicants) {
    totalApplicants.textContent = total;
  }
}

/*=========================================
Notification
================================================*/
async function loadNotifications() {

  try {

    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API_URL}/notifications`,     
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const notifications = await res.json();

    const list = document.getElementById("notificationList");
    const count = document.getElementById("notificationCount");
    const empty = document.getElementById("noNotifications");
    list.innerHTML = "";

    const notificationsData = Array.isArray(notifications)
      ? notifications
      : [];
    
    const unread = notificationsData.filter(n => !n.is_read);
    
    count.textContent = unread.length;
    count.hidden = unread.length === 0;
    
    if (!notificationsData.length) {
      empty.hidden = false;
      return;
    }
    
    empty.hidden = true;
    
    notificationsData.forEach(n => {
      const li = document.createElement("li");
    
      li.className = n.is_read ? "" : "unread";
    
      li.innerHTML = `
        <strong>${escapeHTML(n.title)}</strong><br>
        <small>${escapeHTML(n.message)}</small>
      `;
    
      li.onclick = async () => {
        await fetch(
          `${API_URL}/notifications/${n.id}/read`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
    
        if (n.link && n.link.startsWith("/")) {
          window.location.href = n.link;
        }
      };
    
      list.appendChild(li);
    });
    
    } catch (err) {
      console.error("Notification error:", err);
    }
    }
    
  async function authFetch(url, options = {}) { 

  const token = localStorage.getItem("token");

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = "login.html";
    return;
  }

  return res;
}