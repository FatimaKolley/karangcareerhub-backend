// studentTheme.js

function applyStudentTheme() {
    const savedTheme = localStorage.getItem("studentTheme");
  
    if (savedTheme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  
    const darkBtn = document.getElementById("darkModeToggle");
    if (darkBtn) {
      darkBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
    }
  }
  
  function toggleStudentTheme() {
    document.body.classList.toggle("dark");
  
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("studentTheme", isDark ? "dark" : "light");
  
    const darkBtn = document.getElementById("darkModeToggle");
    if (darkBtn) {
      darkBtn.textContent = isDark ? "☀️" : "🌙";
    }
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    applyStudentTheme();
  
    const darkBtn = document.getElementById("darkModeToggle");
    if (darkBtn) {
      darkBtn.addEventListener("click", toggleStudentTheme);
    }
  });