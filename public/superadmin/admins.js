const API_URL =
  "https://karangcareerhub-api.onrender.com/api";

const token =
  localStorage.getItem("adminToken");

async function loadAdmins() {

  try {

    const response = await fetch(
      `${API_URL}/super-admin/admins`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    const admins =
      await response.json();

    const container =
      document.getElementById(
        "adminsContainer"
      );

    container.innerHTML = "";

    admins.forEach(admin => {

      container.innerHTML += `
        <div class="card">

          <h3>${admin.fullname}</h3>

          <p>${admin.email}</p>

          <p>Role: ${admin.role}</p>

          <p>Status: ${admin.status}</p>

          ${
            admin.role !== "super_admin"
            ?
            `
            <div class="buttons">

              <button
                onclick="suspendAdmin(${admin.id})"
                class="suspend"
              >
                Suspend
              </button>

              <button
                onclick="activateAdmin(${admin.id})"
                class="activate"
              >
                Activate
              </button>

              <button
                onclick="deleteAdmin(${admin.id})"
                class="delete"
              >
                Delete
              </button>

            </div>
            `
            :
            `<strong>Protected</strong>`
          }

        </div>
      `;
    });

  } catch(error) {

    console.log(error);
  }
}


// =====================
// SUSPEND
// =====================
async function suspendAdmin(id) {

  await fetch(
    `${API_URL}/super-admin/suspend/${id}`,
    {
      method: "PUT",

      headers: {
        Authorization:
          `Bearer ${token}`
      }
    }
  );

  loadAdmins();
}


// =====================
// ACTIVATE
// =====================
async function activateAdmin(id) {

  await fetch(
    `${API_URL}/super-admin/activate/${id}`,
    {
      method: "PUT",

      headers: {
        Authorization:
          `Bearer ${token}`
      }
    }
  );

  loadAdmins();
}


// =====================
// DELETE
// =====================
async function deleteAdmin(id) {

  await fetch(
    `${API_URL}/super-admin/delete/${id}`,
    {
      method: "DELETE",

      headers: {
        Authorization:
          `Bearer ${token}`
      }
    }
  );

  loadAdmins();
}

loadAdmins();