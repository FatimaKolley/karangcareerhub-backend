document.addEventListener("DOMContentLoaded", () => {
  const darkModeToggle = document.getElementById("darkModeToggle");

  // Load saved theme from localStorage
  const savedTheme = localStorage.getItem("employerTheme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    if (darkModeToggle) darkModeToggle.textContent = "☀️";
  } else {
    if (darkModeToggle) darkModeToggle.textContent = "🌙";
  }

  // Toggle dark mode on button click
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");

      const isDark = document.body.classList.contains("dark-mode");

      localStorage.setItem("employerTheme", isDark ? "dark" : "light");

      darkModeToggle.textContent = isDark ? "☀️" : "🌙";
    });
  }
});