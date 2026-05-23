const API_URL =
  "https://karangcareerhub-api.onrender.com/api";

const form =
  document.getElementById("loginForm");

const message =
  document.getElementById("message");

form.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    const email =
      document.getElementById("email").value;

    const password =
      document.getElementById("password").value;

    try {

      const response = await fetch(
        `${API_URL}/admin-auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      // SAVE TOKEN
      localStorage.setItem(
        "adminToken",
        data.token
      );

      localStorage.setItem(
        "adminData",
        JSON.stringify(data.admin)
      );

      // ROLE-BASED REDIRECT
      if (
        data.admin.role === "super_admin"
      ) {

        window.location.href =
          "../superadmin/dashboard.html";

      } else {

        window.location.href =
          "./dashboard.html";
      }

    } catch (error) {

      console.log(error);

      message.innerText =
        error.message;
    }
  }
);