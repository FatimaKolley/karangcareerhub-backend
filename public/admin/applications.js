/*const API_URL = "http://localhost:5000/api";*/

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

    const jobs =
     await response.json();

    const container =
      document.getElementById(
        "applications"
      );

    container.innerHTML = "";

    jobs.forEach(job => {

      container.innerHTML += `
        <div class="application-card">
    
          <h3>${job.title}</h3>
    
          <p class="company">
            ${job.employer}
          </p>
          
          <p class="desc">
          ${(job.description || "No description available")
            .slice(0, 120)}
          ...
          </p>
    
          <div class="dates">
            <span>
              Posted:
              ${new Date(job.created_at)
                .toLocaleDateString()}
            </span>
    
            <span>
              Expires:
              ${new Date(job.deadline)
                .toLocaleDateString()}
            </span>
          </div>
    
          <div class="stats">
    
            <div>
              <strong>
                ${job.total_applicants}
              </strong>
              <span>Applicants</span>
            </div>
    
            <div>
              <strong>
                ${job.shortlisted || 0}
              </strong>
              <span>Shortlisted</span>
            </div>
    
            <div>
              <strong>
                ${job.accepted || 0}
              </strong>
              <span>Accepted</span>
            </div>
    
            <div>
              <strong>
                ${job.rejected || 0}
              </strong>
              <span>Rejected</span>
            </div>
    
          </div>
    
        </div>
      `;
    });

  } catch(error) {

    console.log(error);
  }
}

loadApplications();