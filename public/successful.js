const API_URL = "https://karangcareerhub-api.onrender.com/api";

const token = localStorage.getItem("token");
const downloadBtn = document.getElementById("downloadApplicationBtn");

function getApplicationIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("applicationId");
}

async function downloadApplicationForm() {
  const applicationId = getApplicationIdFromUrl();

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
        <p><strong>Application ID:</strong> ${app.id}</p>
        <p><strong>Application Date:</strong> ${app.applied_at ? new Date(app.applied_at).toLocaleString() : "N/A"}</p>

        <div class="section">
          <h2>Job Details</h2>
          <div class="box">
            <p><span class="label">Job Title:</span> ${app.job_title || "N/A"}</p>
            <p><span class="label">Employer:</span> ${app.employer || app.company_name || "N/A"}</p>
          </div>
        </div>

        <div class="section">
          <h2>Applicant Details</h2>
          <div class="box">
            <p><span class="label">First Name:</span> ${app.first_name || ""}</p>
            <p><span class="label">Last Name:</span> ${app.last_name || ""}</p>
            <p><span class="label">Email:</span> ${app.email || ""}</p>
            <p><span class="label">Primary Phone:</span> ${app.phone_primary || ""}</p>
            <p><span class="label">Secondary Phone:</span> ${app.phone_secondary || ""}</p>
            <p><span class="label">Location:</span> ${app.location || ""}</p>
            <p><span class="label">Portfolio:</span> ${app.portfolio_link || ""}</p>
            <p><span class="label">LinkedIn:</span> ${app.linkedin_link || ""}</p>
            <p><span class="label">GitHub:</span> ${app.github_link || ""}</p>
            <p><span class="label">Status:</span> ${app.status || "Pending"}</p>
          </div>
        </div>

        <div class="section">
          <h2>Cover Letter</h2>
          <div class="box">
            <p>${(app.message || "").replace(/\n/g, "<br>")}</p>
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