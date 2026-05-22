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

/* ===============================
   CUSTOM TOAST
================================ */
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");

  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";

    setTimeout(() => {
      toast.remove();
    }, 300);

  }, 3000);
}

/* ===============================
   CUSTOM CONFIRM
================================ */
function showConfirm(message, title = "Confirm Action") {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const msg = document.getElementById("confirmMessage");
    const titleEl = document.getElementById("confirmTitle");

    const okBtn = document.getElementById("confirmOkBtn");
    const cancelBtn = document.getElementById("confirmCancelBtn");

    titleEl.textContent = title;
    msg.textContent = message;

    modal.classList.add("show");

    const cleanup = () => {
      modal.classList.remove("show");

      okBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    okBtn.onclick = () => {
      cleanup();
      resolve(true);
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };
  });
}

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

  setupPasswordStrength();

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
    return showToast("Please fill all password fields", "warning");
  }

  if (newPassword !== confirmPassword) {
    return showToast("New passwords do not match");
  }
  const strongPassword =
  newPassword.length >= 8 &&
  /[A-Z]/.test(newPassword) &&
  /[a-z]/.test(newPassword) &&
  /[0-9]/.test(newPassword) &&
  /[^A-Za-z0-9]/.test(newPassword);

  if (!strongPassword) {
  return showToast(
    "Password must contain uppercase, lowercase, number and special character",
    "warning"
  );
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
      showToast("Password changed successfully", "success");
      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";
    } else {
      showToast(data.message || "Failed to change password");
    }
  } catch (err) {
    console.error(err);
    showToast("Server error", "error");
  }
}

/* ===============================
   SAVE NOTIFICATIONS
================================ */
async function saveNotifications() {
  try {
    const token = localStorage.getItem("token");

    const settings = {
      new_application_alerts:
        document.getElementById("jobAlerts").checked,
    
      job_expiry_reminders:
        document.getElementById("jobReminders").checked,
    
      platform_announcements:
        document.getElementById("platformAnnouncements").checked,
    
      verification_updates:
        document.getElementById("verificationUpdates").checked
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
      showToast("Notification settings saved");
    } else {
      showToast(data.error || "Failed to save settings");
    }

  } catch (err) {
    console.error(err);
    showToast("Server error", "error");
  }
}

/* ===============================
   LOGOUT ALL DEVICES
================================ */
async function logoutAllDevices() {

  const confirmLogout = await showConfirm(
    "Logout from all devices?",
    "Logout All Devices"
  );
  
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
      showToast("Failed to logout all devices");
    }
  } catch (err) {
    console.error(err);
  }
}

/* ===============================
   DEACTIVATE ACCOUNT
================================ */
async function deactivateAccount() {
  const confirmDelete = await showConfirm(
    "This will permanently delete your account. Continue?",
    "Delete Account"
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
      showToast("Failed to deactivate account");
    }
  } catch (err) {
    console.error(err);
  }
}

/* ===============================
   PASSWORD STRENGTH
================================ */
function setupPasswordStrength() {
  const passwordInput = document.getElementById("newPassword");
  const strengthFill = document.getElementById("strengthFill");
  const strengthText = document.getElementById("strengthText");

  if (!passwordInput) return;

  passwordInput.addEventListener("input", () => {
    const password = passwordInput.value;

    let score = 0;

    // length
    if (password.length >= 8) score++;

    // uppercase
    if (/[A-Z]/.test(password)) score++;

    // lowercase
    if (/[a-z]/.test(password)) score++;

    // number
    if (/[0-9]/.test(password)) score++;

    // special char
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // EMPTY
    if (password.length === 0) {
      strengthFill.style.width = "0%";
      strengthText.textContent = "Password strength";
      strengthText.style.color = "#6b7280";
      return;
    }

    // WEAK
    if (score <= 2) {
      strengthFill.style.width = "33%";
      strengthFill.style.background = "#dc2626";

      strengthText.textContent = "Weak Password";
      strengthText.style.color = "#dc2626";
    }

    // GOOD
    else if (score <= 4) {
      strengthFill.style.width = "66%";
      strengthFill.style.background = "#d97706";

      strengthText.textContent = "Good Password";
      strengthText.style.color = "#d97706";
    }

    // STRONG
    else {
      strengthFill.style.width = "100%";
      strengthFill.style.background = "#16a34a";

      strengthText.textContent = "Strong Password";
      strengthText.style.color = "#16a34a";
    }
  });
}


