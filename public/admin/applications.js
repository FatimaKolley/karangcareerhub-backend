const API_URL =
  "https://karangcareerhub-api.onrender.com/api";

const token =
  localStorage.getItem("adminToken");

async function loadApplications() {

  try {

    const response = await fetch(
      `${API_URL}/admin/applications`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    const applications =
      await response.json();

    const container =
      document.getElementById(
        "applications"
      );

    container.innerHTML = "";

    applications.forEach(app => {

      container.innerHTML += `
        <div class="application-card">

          <h3>
            Application #${app.id}
          </h3>

          <p>
            User ID:
            ${app.user_id}
          </p>

          <p>
            Job ID:
            ${app.job_id}
          </p>

        </div>
      `;
    });

  } catch(error) {

    console.log(error);
  }
}

loadApplications();