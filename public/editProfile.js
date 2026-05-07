const API_URL = "https://karangcareerhub-api.onrender.com/api";

   // =============================
// LOAD USER FROM BACKEND
// =============================
async function loadUser() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return null;
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
      return null;
    }

    const data = await res.json();

    localStorage.setItem("user", JSON.stringify(data.user));
    
    return data.user;

  } catch (err) {
    console.error("LOAD USER ERROR:", err);
    return null;
  }
}


// =============================
// INIT PAGE
// =============================
document.addEventListener("DOMContentLoaded", async () => {
  const user = await loadUser();

  if (!user) return;

  // =============================
  // PROFILE IMAGE
  // =============================
  const previewPic = document.getElementById("previewPic");

  previewPic.src = user.profile_image
    ? "karangcareerhub-api.onrender.com" + user.profile_image + "?t=" + Date.now()
    : "image/avatar-placeholder.png";


  // =============================
  // FILL FORM
  // =============================
  document.getElementById("first_name").value = user.first_name || "";
  document.getElementById("last_name").value = user.last_name || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("phone").value = user.phone || "";
  document.getElementById("optional_phone").value = user.optional_phone || "";
  document.getElementById("gender").value = user.gender || "";
  document.getElementById("location").value = user.location || "";
  document.getElementById("education").value = user.education || "";
  document.getElementById("main_interest").value = user.main_interest || "";
  document.getElementById("other_interest").value = user.other_interest || "";
  document.getElementById("skills").value = user.skills || "";
  document.getElementById("experience").value = user.experience || "";
  document.getElementById("bio").value = user.bio || "";
  document.getElementById("portfolioLink").value = user.portfolioLink || "";
  document.getElementById("linkedinLink").value = user.linkedinLink || "";
  document.getElementById("githubLink").value = user.githubLink || "";

  const dobInput = document.getElementById("date_of_birth");
  if (dobInput && user.date_of_birth) {
    dobInput.value = user.date_of_birth.split("T")[0];
  }
});


// =============================
// IMAGE PREVIEW
// =============================
document.getElementById("uploadPic").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    document.getElementById("previewPic").src = URL.createObjectURL(file);
  }
});


// =============================
// RESUME FILE NAME
// =============================
document.getElementById("resumeUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  document.getElementById("resumeFileName").textContent =
    file ? file.name : "No file selected";
});



function appendIfNotEmpty(formData, key, value) {
  if (value !== undefined && value !== null && value !== "") {
    formData.append(key, value);
  }
}

function showNotification(msg, type = "info") {
  console.log(msg);
}
// =============================
// AUTO SAVE
// =============================
const form = document.getElementById("editProfileForm");

form.addEventListener("input", debounce(autoSave, 1000));
document.getElementById("uploadPic")
  .addEventListener("change", autoSave);

document.getElementById("resumeUpload")
  .addEventListener("change", autoSave);

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

async function autoSave() {
  const token = localStorage.getItem("token");
  if (!token) return;

  showSaving();

  const formData = new FormData();

  appendIfNotEmpty(formData, "first_name", document.getElementById("first_name").value);
  appendIfNotEmpty(formData, "last_name", document.getElementById("last_name").value);
  appendIfNotEmpty(formData, "email", document.getElementById("email").value);
  appendIfNotEmpty(formData, "phone", document.getElementById("phone").value);
  appendIfNotEmpty(formData, "optional_phone", document.getElementById("optional_phone").value);
  appendIfNotEmpty(formData, "gender", document.getElementById("gender").value);
  appendIfNotEmpty(formData, "location", document.getElementById("location").value);
  appendIfNotEmpty(formData, "education", document.getElementById("education").value);
  appendIfNotEmpty(formData, "main_interest", document.getElementById("main_interest").value);
  appendIfNotEmpty(formData, "other_interest", document.getElementById("other_interest").value);
  appendIfNotEmpty(formData, "skills", document.getElementById("skills").value);
  appendIfNotEmpty(formData, "experience", document.getElementById("experience").value);
  appendIfNotEmpty(formData, "bio", document.getElementById("bio").value);
  appendIfNotEmpty(formData, "portfolioLink", document.getElementById("portfolioLink").value);
  appendIfNotEmpty(formData, "linkedinLink", document.getElementById("linkedinLink").value);
  appendIfNotEmpty(formData, "githubLink", document.getElementById("githubLink").value);

  const dob = document.getElementById("date_of_birth");
  if (dob && dob.value) {
    formData.append("date_of_birth", dob.value);
  }

  const picInput = document.getElementById("uploadPic");
  if (picInput?.files[0]) {
    formData.append("profile_image", picInput.files[0]);
  }

  const resumeInput = document.getElementById("resumeUpload");
  if (resumeInput?.files[0]) {
    formData.append("resume", resumeInput.files[0]);
  }

  try {
    const res = await fetch(`${API_URL}/users/update-profile`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }

    const data = await res.json();

    console.log("STATUS:", res.status);
    console.log("RESPONSE DATA:", data);

    if (res.ok) {
      // ✅ SAVE UPDATED USER
      localStorage.setItem("user", JSON.stringify(data.user));

      // ✅ FORCE IMAGE REFRESH
      const img = document.getElementById("previewPic");
      if (data.user.profile_image) {
        img.src = "http://localhost:5000" + data.user.profile_image + "?t=" + Date.now();
      }

      showSaved();
      window.dispatchEvent(new Event("profileUpdated"));

    } else {
      showNotification(data.error || "Save failed", "error");
      console.error("SERVER ERROR:", data.error);
    }

  } catch (err) {
    console.error("FETCH ERROR:", err);
  }
}
/*SHOWSAVED*/

function showSaving() {
  const el = document.getElementById("saveStatus");
  el.textContent = "Saving...";
  el.style.opacity = "1";
}

function showSaved() {
  const el = document.getElementById("saveStatus");
  el.textContent = "Saved ✔";
  el.style.opacity = "1";

  setTimeout(() => {
    el.style.opacity = "0";
  }, 1500);
}

