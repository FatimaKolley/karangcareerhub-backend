const API_URL = "https://karangcareerhub-api.onrender.com/api";

/* ============================
   Load saved settings
============================ */
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token) return window.location.href = "index.html";

  // Load profile picture
  document.getElementById("userProfilePic").src =
  user.profile_image
    ? `https://karangcareerhub-api.onrender.com${user.profile_image}`
    : "https://karangcareerhub-api.onrender.com/uploads/profile_pics/default-avatar.jpg";
      

  // Load notification preferences
  document.getElementById("savedJobReminderNotif").checked =
  user.saved_job_reminder_notif == 1;

  document.getElementById("platformNotif").checked =
    user.platform_notif == 1;

  document.getElementById("applicationNotif").checked =
    user.application_notif == 1;
  
  document.getElementById("chatNotif").checked =
    user.chat_notif == 1;
  
  document.getElementById("weeklyJobNotif").checked =
    user.weekly_job_notif == 1;
  
  document.getElementById("emailNotif").checked =
    user.email_notif == 1;
  
  document.getElementById("smsNotif").checked =
    user.sms_notif == 1;
  
});
/* ============================
    Dropdown
============================ */
const profileContainer = document.querySelector(".profile-container");
const dropdownMenu = document.getElementById("dropdownMenu");

profileContainer.addEventListener("click", () => {
  dropdownMenu.classList.toggle("show");
});

document.addEventListener("click", (e) => {
  if (!profileContainer.contains(e.target)) {
    dropdownMenu.classList.remove("show");
  }
});

/* ============================
    Save Notification Settings
============================ */
document.getElementById("saveSettings").addEventListener("click", async () => {

  const token = localStorage.getItem("token");

  const payload = {
    saved_job_reminder_notif:
      document.getElementById("savedJobReminderNotif").checked ? 1 : 0,

    platform_notif:
      document.getElementById("platformNotif").checked ? 1 : 0,

      application_notif:
      document.getElementById("applicationNotif").checked ? 1 : 0,
    
    chat_notif:
      document.getElementById("chatNotif").checked ? 1 : 0,
    
    weekly_job_notif:
      document.getElementById("weeklyJobNotif").checked ? 1 : 0,
    
    email_notif:
      document.getElementById("emailNotif").checked ? 1 : 0,

    sms_notif:
      document.getElementById("smsNotif").checked ? 1 : 0
  };

  try {

    const res = await fetch(`${API_URL}/users/update-settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      showPopup("Settings updated!");
    } else {
      showPopup(data.error || "Failed to update settings", true);
    }

  } catch (err) {
    console.error(err);
    showPopup("Server error", true);
  }
});

/* ============================
      Dark Mode
============================ */
document.getElementById("darkModeToggle").addEventListener("change", () => {
  const active = document.body.classList.toggle("dark");
  localStorage.setItem("studentTheme", active ? "enabled" : "disabled");
});

function validateStrongPassword(password) {

  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  return regex.test(password);
}

//Update Password
document.getElementById("changePasswordBtn").addEventListener("click", async () => {

 const token = localStorage.getItem("token");
      
 const oldPassword =
  document.getElementById("oldPass").value;
      
  const newPassword =
   document.getElementById("newPass").value;
      
 const confirmPass =
  document.getElementById("confirmPass").value;
      
  if (newPassword !== confirmPass) {
    return showPopup("Passwords do not match", true);
  }
      
  if (!validateStrongPassword(newPassword)) {
    return showPopup(
      "Password is not strong enough",
        true
    );
  }
      
  try {
      
    const res = await fetch(`${API_URL}/users/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
      },
          body: JSON.stringify({
            currentPassword: oldPassword,
            newPassword
          })
        });
          
      
          const data = await res.json();
      
          if (res.ok) {

            localStorage.clear();
          
            showPopup("Password updated. Please login again.");
          
            setTimeout(() => {
              window.location.href = "index.html";
            }, 1500);
      
            document.getElementById("oldPass").value = "";
            document.getElementById("newPass").value = "";
            document.getElementById("confirmPass").value = "";
      
          } else {
      
            showPopup(data.error || "Password update failed", true);
          }
      
        } catch (err) {
      
          console.error(err);
          showPopup("Server error", true);
        }
      });


      const passwordInput =
      document.getElementById("newPass");
    
    passwordInput.addEventListener("input", () => {
    
      const password = passwordInput.value;
    
      const bar =
        document.getElementById("strengthBar");
    
      const text =
        document.getElementById("strengthText");
    
      let strength = 0;
    
      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/\d/.test(password)) strength++;
      if (/[@$!%*?&]/.test(password)) strength++;
    
      const percent = (strength / 5) * 100;
    
      bar.style.width = `${percent}%`;
    
      if (strength <= 2) {
        bar.style.background = "#dc2626";
        text.textContent = "Weak password";
      }
      else if (strength <= 4) {
        bar.style.background = "#f59e0b";
        text.textContent = "Medium password";
      }
      else {
        bar.style.background = "#16a34a";
        text.textContent = "Strong password";
      }
    });

/* ============================
      Popup Function
============================ */
function showPopup(message, error = false) {
  const box = document.createElement("div");
  box.className = "popup-box";
  box.style.background = error ? "#e74c3c" : "#4CAF50";
  box.innerText = message;

  document.body.appendChild(box);

  setTimeout(() => box.remove(), 2500);
}
 

/*LOGOUT*/
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});
/* ============================
   LOGOUT ALL DEVICES
============================ */
document.getElementById("logoutAllBtn")
.addEventListener("click", async () => {

  const token = localStorage.getItem("token");

  if (!confirm("Log out from all devices?")) return;

  try {

    const res = await fetch(
      `${API_URL}/users/logout-all`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (res.ok) {

      localStorage.clear();
      showPopup("Logged out from all devices");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1200);

    } else {

      showPopup(
        data.error || "Logout failed",
        true
      );
    }

  } catch (err) {

    console.error(err);

    showPopup("Server error", true);
  }
});
