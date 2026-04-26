document.addEventListener("DOMContentLoaded", () => {
  applyEmployerTheme();
  setupEmployerThemeToggle();
  setupEmployerProfileDropdown();
});

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