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
    user.profile_image || "image/avatar-placeholder.png";

  // Load notification preferences
  document.getElementById("emailNotif").checked = user.email_notif == 1;
  document.getElementById("smsNotif").checked = user.sms_notif == 1;

  // Load dark mode
  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark");
    document.getElementById("darkModeToggle").checked = true;
  }
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
  const emailNotif = document.getElementById("emailNotif").checked;
  const smsNotif = document.getElementById("smsNotif").checked;

  const res = await fetch(`${API_URL}/users/update-settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email_notif: emailNotif ? 1 : 0,
      sms_notif: smsNotif ? 1 : 0
    })
  });

  const data = await res.json();
  if (res.ok) showPopup("Settings saved!");
  else showPopup(data.error, true);
});

/* ============================
      Dark Mode
============================ */
document.getElementById("darkModeToggle").addEventListener("change", () => {
  const active = document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", active ? "enabled" : "disabled");
});

      //Update Password
document.getElementById("changePasswordBtn").addEventListener("click", async () => {
  const token = localStorage.getItem("token");

  const oldPassword = document.getElementById("oldPass").value;
  const newPassword = document.getElementById("newPass").value;

  const res = await fetch(`${API_URL}/users/update-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ oldPassword, newPassword })
  });

  const data = await res.json();

  if (res.ok) {
    showPopup("Password updated!");
  } else {
    showPopup(data.error, true);
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
