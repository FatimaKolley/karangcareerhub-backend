const API_URL = "https://karangcareerhub-api.onrender.com/api";
/*const API_URL =
  "http://localhost:5000/api";*/

const token =
  localStorage.getItem("adminToken");

if (!token) {
  window.location.href =
    "../admin/login.html";
}

async function loadLogs() {

  try {

    const response = await fetch(
      `${API_URL}/super-admin/admin-activities`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    const logs =
      await response.json();

    const container =
      document.getElementById(
        "logsContainer"
      );

    container.innerHTML = "";

    logs.forEach(log => {

      container.innerHTML += `
        <div class="card">

          <h3>${log.fullname}</h3>

          <p>${log.action}</p>

          <small>
            ${new Date(
              log.created_at
            ).toLocaleString()}
          </small>

        </div>
      `;
    });

  } catch(error) {

    console.log(error);
  }
}

loadLogs();