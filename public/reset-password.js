// config.js
const API_URL = "https://karangcareerhub-api.onrender.com/api";
export default API_URL;

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("resetPasswordForm");
  const message = document.getElementById("resetMessage");
  const passwordInput = document.getElementById("resetPassword");

  // =====================
  // PASSWORD TOGGLE
  // =====================
  const toggles = document.querySelectorAll(".toggle-password");

  toggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      const input = document.getElementById(toggle.dataset.target);

      if (input.type === "password") {
        input.type = "text";
        toggle.textContent = "🙈";
      } else {
        input.type = "password";
        toggle.textContent = "👁";
      }
    });
  });

  // =====================
  // SUBMIT RESET
  // =====================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("resetPassword").value.trim();
    const confirm = document.getElementById("resetConfirmPassword").value.trim();

    message.textContent = "";
    message.className = "";

     // STRONG PASSWORD VALIDATION
     const strongRegex =
     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

   if (!strongRegex.test(password)) {
     message.textContent =
       "Password must include uppercase, lowercase, number & symbol (min 8 chars)";
     return;
   }

   if (password !== confirm) {
     message.textContent = "Passwords do not match";
     return;
   }

    // GET TOKEN FROM URL
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      message.textContent = "Invalid or missing reset token";
      message.classList.add("error");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (res.ok) {
        form.style.display = "none";
        document.getElementById("successBox").style.display = "block";

        // redirect after 3s
        setTimeout(() => {
            window.location.href = "login.html";
          }, 3000);

      } else {
        message.textContent = data.error || "Reset failed";
        message.classList.add("error");
      }

    }
    catch (err) {
      console.error(err);
      message.textContent = "Server error: " + err.message;
      message.classList.add("error");

    }
  });
  const strengthBar = document.getElementById("strengthBar");
  const strengthText = document.getElementById("strengthText");
     // =====================
  // PASSWORD STRENGTH CHECK
  // =====================
  passwordInput.addEventListener("input", () => {
    const password = passwordInput.value;

    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    // Update UI
    if (strength <= 2) {
      strengthBar.style.background = "red";
      strengthBar.style.width = "30%";
      strengthText.textContent = "Weak";
    } else if (strength <= 4) {
      strengthBar.style.background = "orange";
      strengthBar.style.width = "60%";
      strengthText.textContent = "Medium";
    } else {
      strengthBar.style.background = "green";
      strengthBar.style.width = "100%";
      strengthText.textContent = "Strong";
    }
  });
      // Match Password//
  const confirmInput = document.getElementById("resetConfirmPassword");

  confirmInput.addEventListener("input", () => {
  const password = passwordInput.value;
  const confirm = confirmInput.value;

  if (!confirm) {
    message.textContent = "";
    return;
  }

  if (password === confirm) {
    message.textContent = "✅ Passwords match";
    message.className = "success";
  } else {
    message.textContent = "❌ Passwords do not match";
    message.className = "error";
  }
});
 

});