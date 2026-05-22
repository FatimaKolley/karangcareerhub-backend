const token =
  localStorage.getItem("token");

async function loadJobs() {

  const response = await fetch(
    "http://localhost:5000/api/admin/jobs",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const jobs = await response.json();

  const container =
    document.getElementById("jobsContainer");

  container.innerHTML = "";

  jobs.forEach(job => {

    container.innerHTML += `
      <div
        style="
          border:1px solid #ccc;
          margin:10px;
          padding:10px;
        "
      >

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
}


// =====================
// DELETE JOB
// =====================
async function deleteJob(id) {

  await fetch(
    `http://localhost:5000/api/admin/jobs/${id}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  loadJobs();
}

loadJobs();