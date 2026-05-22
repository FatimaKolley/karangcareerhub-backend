const token =
  localStorage.getItem("token");

async function loadApplications() {

  const response = await fetch(
    "http://localhost:5000/api/admin/applications",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const applications =
    await response.json();

  const container =
    document.getElementById("applications");

  container.innerHTML = "";

  applications.forEach(app => {

    container.innerHTML += `
      <div
        style="
          border:1px solid #ccc;
          margin:10px;
          padding:10px;
        "
      >

        <h3>
          Application ID:
          ${app.id}
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
}

loadApplications();