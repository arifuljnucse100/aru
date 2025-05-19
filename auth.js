// ===== SIGNUP =====
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const user = { name, email, password };
    localStorage.setItem("user", JSON.stringify(user));
    alert("Signup successful. You can now login.");
    window.location.href = "index.html";
  });
}

// ===== LOGIN =====
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (storedUser && storedUser.email === email && storedUser.password === password) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("loggedInUser", storedUser.name);
      alert("Login successful!");
      window.location.href = "dashboard.html";
    } else {
      alert("Invalid email or password!");
    }
  });
}
