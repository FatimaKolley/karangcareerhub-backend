async function fetchUser() {
  const token = localStorage.getItem("token");

  if (!token) return null;

  try {
    const res = await fetch("https://karangcareerhub-api.onrender.com/api/users/me", {
    headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    const user = data.user; // ✅ FIX HERE

    localStorage.setItem("user", JSON.stringify(user));

    return user;

  } catch (err) {
    console.error("Fetch user error:", err);
    return null;
  }
}
/*====================== INIT =======================*/
document.addEventListener("DOMContentLoaded", async () => {
  setupEmployerProfileDropdown();
  setupLogout();

  const user = await fetchUser();
  if (!user) return;

  const img = getProfileImage(user);

  const profileBtn = document.getElementById("profileBtn");
  if (profileBtn) profileBtn.src = img;

  const dropdownImg = document.querySelector(".dropdown-profile-pic");
  if (dropdownImg) dropdownImg.src = img;

  const nameEl = document.getElementById("dropdownEmployerName");
  if (nameEl) {
    nameEl.textContent =
      user.company_name || user.first_name || "Employer";
  }

  loadUserToForm(user);

  const form = document.getElementById("employerProfileForm");
  if (form) {
    form.addEventListener("input", debounce(autoSave, 1000));
    form.addEventListener("change", debounce(autoSave, 1000));
  }
});

/*====================== IMAGE FIX =======================*/
function formatImage(path) {
  if (!path) return "https://via.placeholder.com/60";
  if (path.startsWith("http")) return path;
  return "https://karangcareerhub-api.onrender.com" + path;
}

/*====================== GET PROFILE IMAGE =======================*/
function getProfileImage(user) {
  if (user.company_logo) return formatImage(user.company_logo);
  if (user.profile_image) return formatImage(user.profile_image);
  return "image/default-avatar.png";}

/*====================== DROPDOWN =======================*/
function setupEmployerProfileDropdown() {
  const btn = document.getElementById("profileBtn");
  const dropdown = document.getElementById("profileDropdown");

  if (!btn || !dropdown) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });
}

/*====================== LOGOUT =======================*/
function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
  });
}

/*====================== LOAD FORM =======================*/
function loadUserToForm(user) {
  Object.keys(user).forEach((key) => {
    const field = document.querySelector(`[name="${key}"]`);

    if (field && field.type !== "file") {
      let value = user[key] || "";

      // ✅ FIX DATE
      if (field.type === "date" && value) {
        value = value.split("T")[0];
      }

      field.value = value;
    }
  });
}

/*====================== DEBOUNCE =======================*/
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

/*====================== AUTO SAVE =======================*/
async function autoSave() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const form = document.getElementById("employerProfileForm");
  const status = document.getElementById("saveStatus");

  if (!form || !status) return;

  status.textContent = "Saving...";

  const formData = new FormData(form);

  try {
    const res = await fetch("https://karangcareerhub-api.onrender.com/api/users/update-profile", {
    method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("user", JSON.stringify(data.user));

      status.textContent = "Saved ✔";

      setTimeout(() => {
        status.textContent = "All changes saved";
      }, 2000);

    } else {
      status.textContent = "Error saving";
      console.error(data.error);
    }

  } catch (err) {
    status.textContent = "Connection error";
    console.error(err);
  }
}
