const token = localStorage.getItem("token");

async function loadAnalytics() {

  try {

    const response = await fetch(
      "http://localhost:5000/api/super-admin/analytics",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    // Cards
    document.getElementById("totalUsers")
      .innerText = data.totalUsers;

    document.getElementById("totalJobs")
      .innerText = data.totalJobs;

    document.getElementById("totalApplications")
      .innerText = data.totalApplications;

    document.getElementById("adminActivities")
      .innerText = data.adminActivities;

    // Active users
    const list =
      document.getElementById("activeUsersList");

    data.mostActiveUsers.forEach(user => {

      const li = document.createElement("li");

      li.innerText =
        `${user.fullname} - ${user.totalApplications} applications`;

      list.appendChild(li);

    });

    // Job performance chart
    const labels =
      data.jobPerformance.map(job => job.title);

    const applications =
      data.jobPerformance.map(
        job => job.totalApplications
      );

    new Chart(
      document.getElementById("jobsChart"),
      {
        type: "bar",

        data: {
          labels,

          datasets: [
            {
              label: "Applications",
              data: applications
            }
          ]
        }
      }
    );

  } catch (error) {

    console.log(error);
  }
}

loadAnalytics();