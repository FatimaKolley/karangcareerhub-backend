  const API_URL =
  "https://karangcareerhub-api.onrender.com/api";

const token =
  localStorage.getItem("adminToken");

if (!token) {
  window.location.href =
    "../admin/login.html";
}

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
              onclick="resetPassword(${admin.id})"
              class="reset"
            >
              Reset Password
            </button>
          
            <button
              onclick="lockAdmin(${admin.id})"
              class="lock"
            >
              Lock
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
// ===============================
// RESET SUPER ADMIN PASSWORD
// ===============================
async function resetPassword(id) {

  const newPassword =
    prompt(
      "Enter new password"
    );

  if (!newPassword) return;

  const response = await fetch(
    `${API_URL}/super-admin/reset-password/${id}`,
    {
      method:"PUT",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      },
      body:JSON.stringify({
        newPassword
      })
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    alert(data.message);
    return;
  }
  
  alert(data.message);
}
// =====================
// LOCK ADMIN ACCOUNT
// =====================
async function lockAdmin(id) {

  const confirmLock =
    confirm(
      "Are you sure you want to lock this admin?"
    );

  if (!confirmLock) return;

  await fetch(
    `${API_URL}/super-admin/lock/${id}`,
    {
      method:"PUT",

      headers:{
        Authorization:
          `Bearer ${token}`
      }
    }
  );

  loadAdmins();
}

loadAdmins();