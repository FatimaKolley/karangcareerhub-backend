const token =
  localStorage.getItem("token");

async function loadAdmins() {

  const response = await fetch(
    "http://localhost:5000/api/super-admin/admins",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const admins = await response.json();

  const container =
    document.getElementById("adminsContainer");

  container.innerHTML = "";

  admins.forEach(admin => {

    container.innerHTML += `
      <div
        style="
          border:1px solid #ccc;
          margin:10px;
          padding:10px;
        "
      >

        <h3>${admin.fullname}</h3>

        <p>${admin.email}</p>

        <p>${admin.role}</p>

        <p>${admin.status}</p>

        ${
          admin.role !== "super_admin"
          ?
          `
          <button
            onclick="suspendAdmin(${admin.id})"
          >
            Suspend
          </button>

          <button
            onclick="activateAdmin(${admin.id})"
          >
            Activate
          </button>

          <button
            onclick="deleteAdmin(${admin.id})"
          >
            Delete
          </button>
          `
          :
          `<strong>Protected</strong>`
        }

      </div>
    `;
  });
}


// =====================
// SUSPEND
// =====================
async function suspendAdmin(id) {

  await fetch(
    `http://localhost:5000/api/super-admin/suspend/${id}`,
    {
      method: "PUT",

      headers: {
        Authorization: `Bearer ${token}`
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
    `http://localhost:5000/api/super-admin/activate/${id}`,
    {
      method: "PUT",

      headers: {
        Authorization: `Bearer ${token}`
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
    `http://localhost:5000/api/super-admin/delete/${id}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  loadAdmins();
}

loadAdmins();