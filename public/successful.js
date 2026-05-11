const API_URL = "https://karangcareerhub-api.onrender.com/api";

const downloadBtn = document.getElementById("downloadApplicationBtn");

function getApplicationIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("applicationId");
}

function safe(value) {
  return value ? String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;") : "";
}

async function downloadApplicationForm() {
  const applicationId = getApplicationIdFromUrl();
  const token = localStorage.getItem("token");
  console.log("Application ID from URL:", applicationId);

  if (!applicationId) {
    alert("Application ID not found in URL.");
    return;
  }

  if (!token) {
    alert("You are not logged in.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/applications/${applicationId}/download`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    console.log("Download response:", data);

    if (!res.ok) {
      throw new Error(data.error || "Failed to load application");
    }

    const app = data.application || data;

    if (!app || !app.id) {
      throw new Error("Application data is invalid.");
    }

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <html>
      <head>
        <title>Application Form - KarangCareerHub</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            color: #222;
            line-height: 1.6;
          }
          h1, h2 {
            margin-bottom: 10px;
          }
          .section {
            margin-bottom: 20px;
          }
          .label {
            font-weight: bold;
          }
          .box {
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: #f9f9f9;
          }
        </style>
      </head>
      <body>
        <h1>KarangCareerHub - Job Application Form</h1>
        <p><strong>Application ID:</strong> ${safe(app.id)}</p>
        <p><strong>Application Date:</strong> ${app.applied_at ? new Date(app.applied_at).toLocaleString() : "N/A"}</p>

        <div class="section">
          <h2>Job Details</h2>
          <div class="box">
            <p><span class="label">Job Title:</span> ${safe(app.job_title || "N/A")}</p>
            <p><span class="label">Employer:</span> ${safe(app.employer || app.company_name || "N/A")}</p>
          </div>
        </div>

        <div class="section">
          <h2>Applicant Details</h2>
          <div class="box">
            <p><span class="label">First Name:</span> ${safe(app.first_name || "")}</p>
            <p><span class="label">Last Name:</span> ${safe(app.last_name || "")}</p>
            <p><span class="label">Email:</span> ${safe(app.email || "")}</p>
            <p><span class="label">Primary Phone:</span> ${safe(app.phone_primary || "")}</p>
            <p><span class="label">Secondary Phone:</span> ${safe(app.phone_secondary || "")}</p>
            <p><span class="label">Location:</span> ${safe(app.location || "")}</p>
            <p><span class="label">Portfolio:</span> ${safe(app.portfolio_link || "")}</p>
            <p><span class="label">LinkedIn:</span> ${safe(app.linkedin_link || "")}</p>
            <p><span class="label">GitHub:</span> ${safe(app.github_link || "")}</p>
            <p><span class="label">Status:</span> ${safe(app.status || "Pending")}</p>
          </div>
        </div>

        <div class="section">
          <h2>Cover Letter</h2>
          <div class="box">
          <p>${safe(app.message || "").replace(/\n/g, "<br>")}</p>
          </div>
        </div>

        <p><em>Note: CV/Resume is intentionally excluded from this downloadable application form.</em></p>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  } catch (error) {
    console.error("Download error:", error);
    alert(error.message);
  }
}

if (downloadBtn) {
  downloadBtn.addEventListener("click", downloadApplicationForm);
}