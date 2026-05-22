const token =
  localStorage.getItem("token");

async function loadReports() {

  const response = await fetch(
    "http://localhost:5000/api/reports",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const reports =
    await response.json();

  const container =
    document.getElementById(
      "reportsContainer"
    );

  container.innerHTML = "";

  reports.forEach(report => {

    container.innerHTML += `
      <div
        style="
          border:1px solid #ccc;
          margin:10px;
          padding:10px;
        "
      >

        <h3>
          Report #${report.id}
        </h3>

        <p>
          Reporter:
          ${report.reporter_name}
        </p>

        <p>
          Reported User:
          ${report.reported_name || "N/A"}
        </p>

        <p>
          Job:
          ${report.job_title || "N/A"}
        </p>

        <p>
          Reason:
          ${report.reason}
        </p>

        <p>
          Status:
          ${report.status}
        </p>

        <button
          onclick="resolveReport(${report.id})"
        >
          Resolve
        </button>

      </div>
    `;
  });
}


async function resolveReport(id) {

  await fetch(
    `http://localhost:5000/api/reports/resolve/${id}`,
    {
      method: "PUT",

      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  loadReports();
}

loadReports();