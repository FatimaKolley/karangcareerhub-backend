const API_URL =
  "https://karangcareerhub-api.onrender.com/api";

const token =
  localStorage.getItem("adminToken");

async function loadJobs() {

  try {

    const response = await fetch(
      `${API_URL}/admin/jobs`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    const jobs =
      await response.json();

    const container =
      document.getElementById(
        "jobsContainer"
      );

    container.innerHTML = "";

    jobs.forEach(job => {

      container.innerHTML += `
        <div class="job-card">

          <h3>${job.title}</h3>

          <p>${job.company}</p>

          <button
            onclick="deleteJob(${job.id})"
          >
            Delete Job
          </button>

        </div>
      `;
    });

  } catch(error) {

    console.log(error);
  }
}

async function deleteJob(id) {

  await fetch(
    `${API_URL}/admin/jobs/${id}`,
    {
      method:"DELETE",

      headers:{
        Authorization:
          `Bearer ${token}`
      }
    }
  );

  loadJobs();
}

loadJobs();