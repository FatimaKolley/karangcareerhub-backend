const token =
  localStorage.getItem("token");

async function loadLogs() {

  const response = await fetch(
    "http://localhost:5000/api/super-admin/admin-activities",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const logs = await response.json();

  const container =
    document.getElementById("logsContainer");

  container.innerHTML = "";

  logs.forEach(log => {

    container.innerHTML += `
      <div
        style="
          border:1px solid #ccc;
          margin:10px;
          padding:10px;
        "
      >

        <h3>${log.fullname}</h3>

        <p>${log.action}</p>

        <small>
          ${log.created_at}
        </small>

      </div>
    `;
  });
}

loadLogs();