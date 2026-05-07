document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const first_name = document.getElementById("first_name").value.trim();
    const last_name = document.getElementById("last_name").value.trim();
    const date_of_birth = document.getElementById("date_of_birth").value;
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm_password").value;
    const role = document.getElementById("role").value;
  
    // PASSWORD CHECK
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
  
    // DATE OF BIRTH CHECK ✅
    const dob = new Date(date_of_birth);
    const year = dob.getFullYear();
  
    if (!date_of_birth || isNaN(dob.getTime())) {
      alert("Please enter a valid date of birth");
      return;
    }
  
    if (year < 1900 || year > new Date().getFullYear()) {
      alert("Please enter a realistic date of birth");
      return;
    }
  
    try {
      const res = await fetch("https://karangcareerhub-api.onrender.com/api/users/signup", 
{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name,
          last_name,
          date_of_birth,
          email,
          password,
          role
        })
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        alert(data.error || "Signup failed");
        return;
      }
  
      // STORE LOGIN SESSION
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
  
      // REDIRECT
      window.location.href =
        data.user.role === "employer"
          ? "dashboardEmployer.html"
          : "dashboardStudent.html";
  
    } catch (err) {
      console.error("Signup error:", err);
      alert("Server error. Try again later.");
    }
  });


  