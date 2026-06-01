
/*const API_URL =
"http://localhost:5000/api";*/
const API_URL = "https://karangcareerhub-api.onrender.com/api";
const token = localStorage.getItem("adminToken");

async function loadUsers() {

  try {

    const response = await fetch(
      `${API_URL}/admin/users`,
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
          <td>${user.first_name} ${user.last_name}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td class="${
            user.is_active
              ? "status-active"
              : "status-suspended"
          }">
            ${
              user.is_active
                ? "Active"
                : "Suspended"
            }
          </td>
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
    `${API_URL}/admin/users/suspend/${id}`,
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
    `${API_URL}/admin/users/activate/${id}`,
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