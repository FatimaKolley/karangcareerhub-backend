const API_URL =
  "https://karangcareerhub-api.onrender.com/api";
  /*const API_URL =
"http://localhost:5000/api";*/

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
    
          <p class="company">${job.employer}</p>
    
          <p class="desc">
            ${job.description.slice(0, 120)}...
          </p>
    
          <p class="skills">
            Skills: ${job.skills}
          </p>
          
          <p class="status">
          Status: ${job.status}
          </p>

          <div class="buttons">

          <div class="buttons">

          <button onclick="deleteJob(${job.id})">Delete</button>

          <button onclick="viewJob(${job.id})">View</button>

         ${
           job.status === "flagged"
            ? `<button onclick="unflagJob(${job.id})">Unflag</button>`
           : `<button onclick="flagJob(${job.id})">Flag</button>`
          }

         </div>
    
          </div>
    
        </div>
      `;
    });

  } catch(error) {

    console.log(error);
    console.log("JOBS FROM API:", jobs);

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

async function flagJob(id) {
  await fetch(`${API_URL}/admin/jobs/flag/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  loadJobs();
}

async function unflagJob(id) {
  await fetch(`${API_URL}/admin/jobs/unflag/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  loadJobs();
}

function viewJob(id) {
  window.location.href = `job-details.html?id=${id}`;
}

loadJobs();