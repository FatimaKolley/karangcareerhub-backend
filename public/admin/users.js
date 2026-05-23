const token =
  localStorage.getItem("adminToken");

async function loadUsers() {

  try {

    const response = await fetch(
      "https://karangcareerhub-api.onrender.com/api/admin/users",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const users = await response.json();

    const table =
      document.getElementById("usersTable");

    table.innerHTML = "";

    users.forEach(user => {

      table.innerHTML += `
        <tr>
          <td>${user.id}</td>
          <td>${user.fullname}</td>
          <td>${user.email}</td>
          <td>${user.status}</td>

          <td>

            <button
              onclick="suspendUser(${user.id})"
            >
              Suspend
            </button>

            <button
              onclick="activateUser(${user.id})"
            >
              Activate
            </button>

          </td>
        </tr>
      `;
    });

  } catch (error) {

    console.log(error);
  }
}


// =====================
// SUSPEND USER
// =====================
async function suspendUser(id) {

  await fetch(
    `https://karangcareerhub-api.onrender.com/api/admin/users/suspend/${id}`,
    {
      method: "PUT",

      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  loadUsers();
}


// =====================
// ACTIVATE USER
// =====================
async function activateUser(id) {

  await fetch(
    `https://karangcareerhub-api.onrender.com/api/admin/users/activate/${id}`,
    {
      method: "PUT",

      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  loadUsers();
}

loadUsers();