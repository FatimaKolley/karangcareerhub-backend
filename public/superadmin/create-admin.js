const API_URL =
  "https://karangcareerhub-api.onrender.com/api";

  const token =
  localStorage.getItem(
    "adminToken"
  );

  if (!token) {
    window.location.href =
      "../admin/login.html";
  }

document.getElementById(
  "createAdminForm"
).addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    const fullname =
      document.getElementById(
        "fullname"
      ).value;

    const email =
      document.getElementById(
        "email"
      ).value;

    const password =
      document.getElementById(
        "password"
      ).value;

    try {

      const response =
        await fetch(
          `${API_URL}/super-admin/create-admin`,
          {
            method:"POST",

            headers:{
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body:JSON.stringify({
              fullname,
              email,
              password
            })
          }
        );

      const data =
        await response.json();

      document.getElementById(
        "message"
      ).innerText =
        data.message;

    } catch(error) {

      console.log(error);
    }
  }
);