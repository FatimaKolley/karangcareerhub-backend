/* ================= DARK MODE ================= */
function applyEmployerTheme() {
  const savedTheme = localStorage.getItem("employerTheme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }

  updateThemeIcon();
}

function setupEmployerThemeToggle() {
  const btn = document.getElementById("darkModeToggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("employerTheme", isDark ? "dark" : "light");

    updateThemeIcon();
  });
}

function updateThemeIcon() {
  const btn = document.getElementById("darkModeToggle");
  if (!btn) return;

  btn.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
}

/* ================= DROPDOWN ================= */
function setupEmployerProfileDropdown() {
  const profileBtn = document.getElementById("profileBtn");
  const profileDropdown = document.getElementById("profileDropdown");

  if (!profileBtn || !profileDropdown) return;

  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!profileDropdown.contains(e.target) && e.target !== profileBtn) {
      profileDropdown.classList.remove("show");
    }
  });
}

const API_URL = "https://karangcareerhub-api.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  applyEmployerTheme();
  setupEmployerThemeToggle();
  setupEmployerProfileDropdown();

  setupSettingsActions();
  loadEmployerProfile();
});

/* ===============================
   SETTINGS ACTIONS INIT
================================ */
function setupSettingsActions() {
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const saveNotificationBtn = document.getElementById("saveNotificationBtn");
  const logoutAllBtn = document.getElementById("logoutAllBtn");
  const deactivateBtn = document.getElementById("deactivateAccountBtn");

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", changePassword);
  }

  if (saveNotificationBtn) {
    saveNotificationBtn.addEventListener("click", saveNotifications);
  }

  if (logoutAllBtn) {
    logoutAllBtn.addEventListener("click", logoutAllDevices);
  }

  if (deactivateBtn) {
    deactivateBtn.addEventListener("click", deactivateAccount);
  }
}

/* ===============================
   LOAD EMPLOYER NAME
================================ */
async function loadEmployerProfile() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.ok) {
      const fullName = `${data.user.first_name} ${data.user.last_name}`;
    
      document.getElementById("dropdownEmployerName").textContent =
        fullName || "Employer";
    
        const profileImg = document.getElementById("profileBtn");
        const dropdownImg = document.getElementById("dropdownProfilePic");
        
        const imagePath =
          data.user.company_logo ||
          data.user.profile_image;
        
        if (imagePath) {
          const fullImage =
            imagePath.startsWith("http")
              ? imagePath
              : `https://karangcareerhub-api.onrender.com${imagePath}`;
        
          if (profileImg) profileImg.src = fullImage;
          if (dropdownImg) dropdownImg.src = fullImage;
        }
    }
  } catch (err) {
    console.error("Profile load error:", err);
  }
}

/* ===============================
   CHANGE PASSWORD
================================ */
async function changePassword() {
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return alert("Please fill all password fields");
  }

  if (newPassword !== confirmPassword) {
    return alert("New passwords do not match");
  }

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/users/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Password changed successfully");
      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";
    } else {
      alert(data.message || "Failed to change password");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

/* ===============================
   SAVE NOTIFICATIONS
================================ */
async function saveNotifications() {
  try {
    const token = localStorage.getItem("token");

    const settings = {
      email_notif: document.getElementById("jobAlerts").checked,
      sms_notif: document.getElementById("jobReminders").checked
    };

    const res = await fetch(`${API_URL}/users/update-settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem(
        "employerNotifications",
        JSON.stringify(settings)
      );

      alert("Notification settings saved");
    } else {
      alert(data.error || "Failed to save settings");
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

/* ===============================
   LOGOUT ALL DEVICES
================================ */
async function logoutAllDevices() {
  const confirmLogout = confirm("Logout from all devices?");
  if (!confirmLogout) return;

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/users/logout-all`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      localStorage.clear();
      window.location.href = "login.html";
    } else {
      alert("Failed to logout all devices");
    }
  } catch (err) {
    console.error(err);
  }
}

/* ===============================
   DEACTIVATE ACCOUNT
================================ */
async function deactivateAccount() {
  const confirmDelete = confirm(
    "This will permanently delete your account. Continue?"
  );

  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/users/deactivate-account`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      localStorage.clear();
      window.location.href = "index.html";
    } else {
      alert("Failed to deactivate account");
    }
  } catch (err) {
    console.error(err);
  }
}