const API_URL = "https://karangcareerhub-api.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token) {
    return window.location.href = "index.html";
  }

  loadApplications(token);
  loadViewedJobs(token);
});

/* ================================
    LOAD APPLICATION HISTORY
================================ */
async function loadApplications(token) {
  const container = document.getElementById("applicationsList");
  container.innerHTML = `<p class="loading">Loading...</p>`;

  try {
    const res = await fetch(`${API_URL}/history/applications`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      return (container.innerHTML = `<p class="error">${data.error}</p>`);
    }

    if (data.length === 0) {
      return (container.innerHTML = `<p class="empty">You have not applied to any jobs yet.</p>`);
    }

    container.innerHTML = "";
    data.forEach(app => container.appendChild(renderApplicationCard(app)));

  } catch (err) {
    container.innerHTML = `<p class="error">Failed to load history.</p>`;
  }
}

/* ================================
    LOAD VIEWED JOB HISTORY
================================ */
async function loadViewedJobs(token) {
  const container = document.getElementById("viewedJobsList");
  container.innerHTML = `<p class="loading">Loading...</p>`;

  try {
    const res = await fetch(`${API_URL}/history/views`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      return (container.innerHTML = `<p class="error">${data.error}</p>`);
    }

    if (data.length === 0) {
      return (container.innerHTML = `<p class="empty">No viewed jobs yet.</p>`);
    }

    container.innerHTML = "";
    data.forEach(job => container.appendChild(renderViewedJobCard(job)));

  } catch (err) {
    container.innerHTML = `<p class="error">Failed to load viewed jobs.</p>`;
  }
}

/* ================================
       CARD TEMPLATES
================================ */
function renderApplicationCard(app) {
  const card = document.createElement("div");
  card.className = "history-card";

  card.innerHTML = `
    <h4>${app.title}</h4>
    <p class="employer">${app.employer}</p>
    <p class="skills">${app.skills || "No skills listed"}</p>

    <div class="history-meta">
      <span class="date">Applied: ${new Date(app.created_at).toLocaleDateString()}</span>
      <a class="view-btn" href="job.html?id=${app.job_id}">View Job</a>
    </div>
  `;

  return card;
}

function renderViewedJobCard(job) {
  const card = document.createElement("div");
  card.className = "history-card viewed";

  card.innerHTML = `
    <h4>${job.title}</h4>
    <p class="employer">${job.employer}</p>
    <p class="skills">${job.skills || "No skills listed"}</p>

    <div class="history-meta">
      <span class="date">Viewed: ${new Date(job.viewed_at).toLocaleDateString()}</span>
      <a class="view-btn" href="job.html?id=${job.job_id}">View Again</a>
    </div>
  `;

  return card;
}
const historyList = document.getElementById("historyList");

document.addEventListener("DOMContentLoaded", loadHistory);

async function loadHistory() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const res = await fetch(`${API_URL}/jobs/history/${user.id}`);
  const data = await res.json();

  historyList.innerHTML = "";

  if (!data.length) {
    historyList.innerHTML = "<p>No job views yet.</p>";
    return;
  }

  data.forEach(job => {
    historyList.innerHTML += `
      <div class="history-card">
        <h3>${job.title}</h3>
        <p>${job.employer}</p>
        <p><strong>Viewed:</strong> ${new Date(job.viewed_at).toLocaleString()}</p>
        <a href="job.html?id=${job.id}" class="btn">Open Job</a>
      </div>
    `;
  });
}
