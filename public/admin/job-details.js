const API_URL =
  "https://karangcareerhub-api.onrender.com/api";
/*const API_URL = "http://localhost:5000/api";*/
const token = localStorage.getItem("adminToken");

const params = new URLSearchParams(window.location.search);
const jobId = params.get("id");

async function loadJob() {
  const res = await fetch(`${API_URL}/admin/jobs/${jobId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const job = await res.json();

  document.getElementById("jobDetails").innerHTML = `
    <h1>${job.title}</h1>
    <p><b>Employer:</b> ${job.employer}</p>
    <p><b>Description:</b> ${job.description}</p>
    <p><b>Skills:</b> ${job.skills}</p>
    <p><b>Status:</b> ${job.status}</p>
  `;
}

loadJob();