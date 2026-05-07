const API_URL = "https://karangcareerhub-api.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  loadUserFromBackend();
  setupDropdown();
  setupLogout();
});


// =============================
// LOAD PROFILE
// =============================
function loadUserProfile(user) {

  const fullName = (user.first_name || "") + " " + (user.last_name || "");

  // Navbar
  document.getElementById("navStudentName").textContent = fullName || "Student";

  const img = user.profile_image
  ? "http://karangcareerhub-api.onrender.com/api" + user.profile_image + "?t=" + Date.now()
  : "image/avatar-placeholder.png";

  document.getElementById("userProfilePic").src = img;
  document.getElementById("profilePicLarge").src = img;

  document.getElementById("profileName").textContent = fullName || "—";
  document.getElementById("profileEmail").textContent = user.email || "—";

  // Fill fields
  setText("infoFirstName", user.first_name);
  setText("infoLastName", user.last_name);
  setText(
    "infoDateofBirth",
    formatDate(user.date_of_birth)
  );
  setText("infoEmail", user.email);
  setText("infoPhone", user.phone);
  setText("infoOptionalPhone", user.optional_phone);
  setText("infoGender", user.gender);
  setText("infoLocation", user.location);
  setText("infoEducation", user.education);
  setText("infoMainInterest", user.main_interest);
  setText("infoOtherInterest", user.other_interest);
  setText("infoSkills", user.skills);
  setText("infoExperience", user.experience);
  setText("infoBio", user.bio);

  // Resume
  const resume = document.getElementById("infoResume");
  if (user.resume) {
    resume.href = "http://karangcareerhub-api.onrender.com/api" + user.resume;
    resume.textContent = "Download Resume";
  } else {
    resume.textContent = "No file";
  }

  // Links
  setLink("infoPortfolio", user.portfolioLink);
  setLink("infoLinkedin", user.linkedinLink);
  setLink("infoGithub", user.githubLink);

  document.getElementById("infoCreatedAt").textContent =
    user.created_at ? new Date(user.created_at).toLocaleDateString() : "—";
}



// =============================
// HELPERS
// =============================
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "—";
}

function setLink(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  if (value) {
    el.href = value;
    el.textContent = value;
  } else {
    el.textContent = "—";
  }
}

function formatDate(date) {
  if (!date) return "—";

  const d = new Date(date);
  if (isNaN(d)) return "—";

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// =============================
// DROPDOWN FIX
// =============================
function setupDropdown() {
  const avatar = document.getElementById("userProfilePic");
  const dropdown = document.getElementById("dropdownMenu");

  avatar.addEventListener("click", (e) => {
    e.stopPropagation(); // ✅ prevents instant closing
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });
}


// =============================
// LOGOUT
// =============================
function setupLogout() {
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
  });
}


// =============================
// AUTO REFRESH
// =============================
window.addEventListener("profileUpdated", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) loadUserProfile(user);
});

// =============================
// DOWNLOAD PROFILE PDF
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("downloadProfileBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!window.jspdf) {
      showNotification("PDF system not loaded", "error");
      return;
    }
  
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return showNotification("Login first", "error");

    let y = 20;

     const fullName = `${user.first_name || ""} ${user.last_name || ""}`;
  
       // =========================
      // HEADER (CLEAN + MODERN)
      // =========================
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text(fullName.toUpperCase(), 20, 20);
       
      doc.setFillColor(11, 62, 145);
      doc.rect(0, 0, 210, 30, "F");

      doc.setTextColor(255, 255, 255);

      doc.setTextColor(0, 0, 0);

      y = 40;

        



     // Inline contact line
      let contactLine = user.email || "";
      if (user.phone) contactLine += ` | ${user.phone}`;
      if (user.location) contactLine += ` | ${user.location}`;

      doc.text(contactLine, 20, y);

      y += 5;

      // Divider
       doc.setLineWidth(0.5);
       doc.line(20, y, 190, y);
  
    // =========================
    // PROFILE IMAGE
    // =========================
    if (user.profile_image) {
      try {
        const imgData = await toBase64("http://karangcareerhub-api.onrender.com/api" + user.profile_image);
        doc.addImage(imgData, "JPEG", 150, 5, 40, 40);
      } catch {}
    }
    

     // =========================
     // SECTION TITLE
     // =========================
       const section = (title) => {
       y += 10;
       doc.setFont("helvetica", "bold");
       doc.setFontSize(13);
       doc.text(title.toUpperCase(), 20, y);

        y += 4;
        doc.setLineWidth(0.3);
        doc.line(20, y, 190, y);

        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
      };
      // =========================
      // KEY-VALUE LINE (Cleaner)
      // =========================
      const line = (label, value) => {
        if (!value) return;

        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, 20, y);

        doc.setFont("helvetica", "normal");
        doc.text(value, 70, y); // aligned column

        y += 6;
      };
      
      // =========================
      // SUMMARY
      // =========================
      if (user.bio) {
      section("Professional Summary");

      const text = doc.splitTextToSize(user.bio, 170);
      doc.text(text, 20, y);

      y += text.length * 6;
      }
  
    // =========================
    // PERSONAL INFO
    // =========================
    section("Personal Information");

    line("Phone", user.phone);
    line("Optional Phone", user.optional_phone);
    line("Gender", user.gender);
    
    line(
      "Date of Birth",
      user.date_of_birth
        ? new Date(user.date_of_birth).toLocaleDateString()
        : ""
    );
    
    line("Location", user.location);
  
    // =========================
    // PROFESSIONAL
    // =========================
    section("Professional");

    line("Education", user.education);
    line("Main Interest", user.main_interest);
    line("Other Interest", user.other_interest);
    
  
    // =========================
    // SKILLS
    // =========================
    if (user.skills) {
      section("Skills");
    
      const text = doc.splitTextToSize(user.skills, 170);
      doc.text(text, 20, y);
    
      y += text.length * 6;
    }
  
    // =========================
    // EXPERIENCE
    // =========================
    if (user.experience) {
      section("Experience");
    
      doc.text(user.experience, 20, y);
      y += 6;
    }
  
    // =========================
    // LINKS
    // =========================
    section("Links");

    line("Portfolio", user.portfolioLink);
    line("LinkedIn", user.linkedinLink);
    line("GitHub", user.githubLink);
  
    doc.save(`${fullName || "CV"}.pdf`);
  });
});


// Convert image to base64
async function toBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function showNotification(message, type = "info") {
  let notif = document.createElement("div");
  notif.className = `notif ${type}`;
  notif.textContent = message;

  document.body.appendChild(notif);

  setTimeout(() => notif.classList.add("show"), 100);

  setTimeout(() => {
    notif.classList.remove("show");
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

//=========================================================
async function loadUserFromBackend() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }

    const data = await res.json();

    // ✅ ALWAYS UPDATE localStorage
    localStorage.setItem("user", JSON.stringify(data.user));

    // ✅ LOAD UI
    loadUserProfile(data.user);

  } catch (err) {
    console.error("PROFILE LOAD ERROR:", err);
  }
}