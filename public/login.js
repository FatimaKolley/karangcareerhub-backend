const API_URL = "https://karangcareerhub-api.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {

  const loginOverlay = document.getElementById("loginOverlay");
  const forgotPasswordOverlay = document.getElementById("forgotPasswordOverlay");
  const resetPasswordOverlay = document.getElementById("resetPasswordOverlay");

  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const forgotMessage = document.getElementById("forgotMessage");

  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const resetMessage = document.getElementById("resetMessage");

  const forgotPasswordLink = document.getElementById("forgotPasswordLink");


  const closeForgotModal = document.getElementById("closeForgotModal");
  
  // OPEN MODAL
  forgotPasswordLink?.addEventListener("click", (e) => {
    e.preventDefault();
    forgotPasswordOverlay.style.display = "flex";
  });
  
  // CLOSE MODAL
  closeForgotModal?.addEventListener("click", () => {
    forgotPasswordOverlay.style.display = "none";
  });
  
  // OPTIONAL: CLOSE WHEN CLICK OUTSIDE
  window.addEventListener("click", (e) => {
    if (e.target === forgotPasswordOverlay) {
      forgotPasswordOverlay.style.display = "none";
    }
  });

  // =====================
  // LOGIN
  // =====================
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    loginMessage.textContent = "";
    loginMessage.classList.remove("error");

    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // ROLE BASED REDIRECT
        if (data.user.role === "student") {
          window.location.href = "/dashboardStudent.html";
        } else if (data.user.role === "employer") {
          window.location.href = "/dashboardEmployer.html";
        } else {
          window.location.href = "/index.html";
        }
      } else {
        loginMessage.textContent = data.error || "Invalid login";
        loginMessage.classList.add("error");
      }
    } catch (err) {
      loginMessage.textContent = "Server error";
      loginMessage.classList.add("error");
    }
  });

  // =====================
  // FORGOT PASSWORD
  // =====================
  forgotPasswordLink?.addEventListener("click", (e) => {
    e.preventDefault();
    forgotPasswordOverlay.style.display = "flex";
  });

  forgotPasswordForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("forgotEmail").value.trim();
    forgotMessage.textContent = "";

    try {
      const res = await fetch(`${API_URL}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      forgotMessage.textContent = data.message || data.error;
    } catch {
      forgotMessage.textContent = "Failed to send reset link";
    }
  });

  // =====================
  // RESET PASSWORD
  // =====================
  resetPasswordForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("resetPassword").value.trim();
    const confirm = document.getElementById("resetConfirmPassword").value.trim();

    if (password !== confirm) {
      resetMessage.textContent = "Passwords do not match";
      resetMessage.classList.add("error");
      return;
    }

    const token = new URLSearchParams(window.location.search).get("token");

    try {
      const res = await fetch(`${API_URL}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();
      resetMessage.textContent = data.message || data.error;
    } catch {
      resetMessage.textContent = "Reset failed";
    }
  });
});

