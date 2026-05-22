const token = localStorage.getItem("token");

document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("profileBtn");
  const profileDropdown = document.getElementById("profileDropdown");
  const jobsContainer = document.getElementById("historyJobs");
  const jobsTableBody = document.getElementById("jobsTable");

  const summaryCards = document.querySelectorAll(".summary-card h3");

  const applicationTableBody = document.getElementById("applicationsTable");

  if (profileBtn && profileDropdown) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!profileDropdown.contains(e.target) && e.target !== profileBtn) {
        profileDropdown.classList.remove("show");
      }
    });
  }

  if (!token) {
    alert("Please login again");
    window.location.href = "login.html";
    return;
  }

  // ==============================
  // INIT PAGE
  // ==============================
  loadEmployerHistory();
  loadEmployerApplications();
  loadEmployerProfile();

  // ==============================
  // LOAD JOB HISTORY
  // ==============================
  async function loadEmployerHistory() {
    try {
      const res = await fetch("/api/jobs/my-jobs", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const jobs = await res.json();

      if (!res.ok) throw new Error(jobs.error || "Failed to load jobs");

      renderJobs(jobs);
      renderJobTable(jobs);
      updateSummary(jobs);
      renderAnalytics(jobs);

    } catch (err) {
      console.error("Job History Error:", err);
      jobsContainer.innerHTML = `<p style="color:red;">Failed to load job history</p>`;
    }
  }

  // ==============================
  // LOAD APPLICATION HISTORY (EMPLOYER SIDE)
  // ==============================
  async function loadEmployerApplications() {
    try {
      const res = await fetch("/api/applications/employer", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load applications");

      renderApplications(data);

    } catch (err) {
      console.error("Application History Error:", err);
      applicationTableBody.innerHTML = `
        <tr><td colspan="5" style="color:red;">Failed to load applications</td></tr>
      `;
    }
  }

  // ==============================
  // RENDER JOB CARDS
  // ==============================
  function renderJobs(jobs) {
    if (!Array.isArray(jobs) || !jobs.length) {
      jobsContainer.innerHTML = "<p>No jobs posted yet.</p>";
      return;
    }

    jobsContainer.innerHTML = jobs.map(job => `
      <div class="history-job-card">
        <h4>${job.title}</h4>
        <p><strong>Category:</strong> ${job.category || "N/A"}</p>
        <p><strong>Posted:</strong> ${formatDate(job.created_at)}</p>
        <p><strong>Deadline:</strong> ${formatDate(job.deadline)}</p>
        <span class="status">${job.status || "Active"}</span>
      </div>
    `).join("");
  }

  // ==============================
  // RENDER JOB TABLE
  // ==============================
  function renderJobTable(jobs) {
    if (!jobsTableBody) return;

    jobsTableBody.innerHTML = jobs.map(job => `
      <tr>
        <td data-label="Job Title">${job.title}</td>
        <td data-label="Category">${job.category || "-"}</td>
        <td data-label="Posted On">${formatDate(job.created_at)}</td>
        <td data-label="Deadline">${formatDate(job.deadline)}</td>
        <td data-label="Status">${job.status || "Active"}</td>
        <td data-label="Views">${job.views || 0}</td>
        <td data-label="Applicants">${job.total_applicants || 0}</td>
        <td data-label="Accepted">${job.accepted || 0}</td>
        <td data-label="Rejected">${job.rejected || 0}</td>
        <td data-label="Reviewed">${job.reviewed || 0}</td>
        <td data-label="Saved">${job.saved || 0}</td>
      </tr>
    `).join("");
  }

  // ==============================
  // RENDER APPLICATIONS TABLE
  // ==============================
  function renderApplications(applications) {
    if (!applicationTableBody) return;

    if (!Array.isArray(applications) || !applications.length) {
      applicationTableBody.innerHTML = `
        <tr><td colspan="5">No applications yet</td></tr>
      `;
      return;
    }

    applicationTableBody.innerHTML = applications.map(app => `
      <tr>
        <td>${app.job_title}</td>
        <td>${app.student_name}</td>
        <td>${app.status}</td>
        <td>${formatDate(app.created_at)}</td>
        <td>
          <button onclick="viewApplication(${app.application_id})">
            View
          </button>
        </td>
      </tr>
    `).join("");
  }

  // ==============================
  // SUMMARY CARDS
  // ==============================
  function updateSummary(jobs) {
    if (!summaryCards) return;

    const totalJobs = jobs.length;
    const totalApplicants = jobs.reduce((sum, j) => sum + (j.total_applicants || 0), 0);
    const accepted = jobs.reduce((sum, j) => sum + (j.accepted || 0), 0);
    const rejected = jobs.reduce((sum, j) => sum + (j.rejected || 0), 0);
    const reviewed = jobs.reduce((sum, j) => sum + (j.reviewed || 0), 0);
    const saved = jobs.reduce((sum, j) => sum + (j.saved || 0), 0);

    const values = [
      totalJobs,
      totalApplicants,
      accepted,
      rejected,
      reviewed,
      saved
    ];

    summaryCards.forEach((el, index) => {
      if (values[index] !== undefined) {
        el.textContent = values[index];
      }
    });
  }

  // ==============================
  // UTIL: FORMAT DATE
  // ==============================
  function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  }

});

// ==============================
// GLOBAL ACTION
// ==============================
function viewApplication(id) {
  window.location.href = `applicationDetails.html?id=${id}`;
}
////////////////employer profile///////////
async function loadEmployerProfile() {
  try {
    const res = await fetch("/api/users/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) return;

    const user = data.user;

    document.getElementById("dropdownEmployerName").textContent =
      `${user.first_name} ${user.last_name}`;

  } catch (err) {
    console.error("Profile Load Error:", err);
  }
}
/////////////   analytics chart//////////////////////
let jobsChart;

function renderAnalytics(jobs) {
  const ctx = document.getElementById("jobsChart");

  if (!ctx) return;

  if (jobsChart) {
    jobsChart.destroy();
  }

  jobsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: jobs.map(job => job.title),
      datasets: [{
        label: "Applicants",
        data: jobs.map(job => job.total_applicants || 0)
      }]
    }
  });
}


///logout///////////
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });
}