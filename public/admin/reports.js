

const API_URL =
"https://karangcareerhub-api.onrender.com/api";

/*const API_URL = "http://localhost:5000/api";*/

const adminToken =
  localStorage.getItem("adminToken");



async function loadReports() {

  try {

    const response = await fetch(
      `${API_URL}/reports/reported-jobs`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      }
    );

    const jobs = await response.json();

    const container =
      document.getElementById(
        "reportsContainer"
      );

    container.innerHTML = "";

    if (!jobs.length) {

      container.innerHTML = `
        <div class="empty-state">
          No reported jobs found.
        </div>
      `;

      return;
    }

    jobs.forEach(job => {

      container.innerHTML += `
        <div class="report-card">

          <div class="report-header">

            <h2>${job.title}</h2>

            <span class="report-count">
              ${job.report_count} Reports
            </span>

          </div>

          <p>
            <strong>Employer:</strong>
            ${job.employer || "N/A"}
          </p>

          <p>
            <strong>Category:</strong>
            ${job.category || "N/A"}
          </p>

          <p>
            <strong>Type:</strong>
            ${job.type || "N/A"}
          </p>

          <p>
            <strong>Location:</strong>
            ${job.location || "N/A"}
          </p>

          <p>
            <strong>Salary:</strong>
            ${job.currency || "GMD"}
            ${job.salary || 0}
          </p>

          <p>
            <strong>Experience:</strong>
            ${job.experience || 0}
            year(s)
          </p>

          <p>
            <strong>Deadline:</strong>
            ${job.deadline || "N/A"}
          </p>

          <p>
            <strong>Status:</strong>
            <span class="status">
              ${job.status}
            </span>
          </p>

          <div class="report-reasons">

            <h4>
              Report Reasons
            </h4>

            <p>
              ${job.report_reasons || "None"}
            </p>

          </div>

          <div class="action-buttons">

            <button
              class="flag-btn"
              onclick="flagJob(${job.id})"
            >
              Flag
            </button>

            <button
              class="unflag-btn"
              onclick="unflagJob(${job.id})"
            >
              Unflag
            </button>

            <button
              class="delete-btn"
              onclick="deleteJob(${job.id})"
            >
              Delete
            </button>

            <button
              class="clear-btn"
              onclick="clearReports(${job.id})"
            >
              Clear Reports
            </button>

          </div>

        </div>
      `;
    });

  } catch (err) {

    console.error(err);

  }
}

async function flagJob(jobId) {

  await fetch(
    `${API_URL}/admin/jobs/flag/${jobId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    }
  );

  loadReports();
}

async function unflagJob(jobId) {

  await fetch(
    `${API_URL}/admin/jobs/unflag/${jobId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    }
  );

  loadReports();
}

async function deleteJob(jobId) {

  await fetch(
    `${API_URL}/admin/jobs/${jobId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    }
  );

  loadReports();
}

async function clearReports(jobId) {

  await fetch(
    `${API_URL}/reports/unreport/${jobId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    }
  );

  loadReports();
}

loadReports();