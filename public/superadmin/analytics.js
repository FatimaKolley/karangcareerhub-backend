const API_URL =
  "https://karangcareerhub-api.onrender.com/api";
  /*const API_URL =
  "http://localhost:5000/api";*/

  const token =
  localStorage.getItem("adminToken");

  if (!token) {
    window.location.href =
      "../admin/login.html";
  }

async function loadAnalytics() {

  try {

    const response = await fetch(
      `${API_URL}/super-admin/analytics`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    const data =
      await response.json();

    document.getElementById(
      "totalUsers"
    ).innerText =
      data.totalUsers;

    document.getElementById(
      "totalJobs"
    ).innerText =
      data.totalJobs;

    document.getElementById(
      "totalApplications"
    ).innerText =
      data.totalApplications;

    document.getElementById(
      "adminActivities"
    ).innerText =
      data.adminActivities;

    const list =
      document.getElementById(
        "activeUsersList"
      );

    list.innerHTML = "";

    (data.mostActiveUsers || []).forEach(user => {

      const li =
        document.createElement("li");

      li.innerText =
        `${user.fullname}
        - ${user.totalApplications} applications`;

      list.appendChild(li);

    });

    const labels =
  (data.jobPerformance || []).map(
        job => job.title
      );

      const applications =
      (data.jobPerformance || []).map(
        job => job.totalApplications
      );

    new Chart(
      document.getElementById(
        "jobsChart"
      ),
      {
        type:"bar",

        data:{
          labels,

          datasets:[
            {
              label:"Applications",
              data:applications
            }
          ]
        }
      }
    );

  } catch(error) {

    console.log(error);
  }
}

loadAnalytics();