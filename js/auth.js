import { API_URL } from "./config.js";
import { showToast } from "./ui-helpers.js";

// =========================================================================
// REGISTER USER
// =========================================================================
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;
        
        const submitBtn = registerForm.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.innerText = "Creating Account...";

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    fullName: name,
                    email,
                    password,
                    role
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }

            showToast("Registration Successful! Redirecting to login...", "success");
            
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        } catch (error) {
            showToast(error.message, "error");
            submitBtn.disabled = false;
            submitBtn.innerText = "Register";
        }
    });
}

// =========================================================================
// LOGIN USER
// =========================================================================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        
        const submitBtn = loginForm.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.innerText = "Logging in...";

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            // Save JWT Token & User Profile Info in localStorage
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            showToast(`Welcome back, ${data.user.fullName || email}!`, "success");

            // Role-based redirection
            setTimeout(() => {
                if (data.user.role === "admin") {
                    window.location.href = "pages/admin-dashboard.html";
                } else if (data.user.role === "staff") {
                    window.location.href = "pages/staff-dashboard.html";
                } else {
                    window.location.href = "pages/user-dashboard.html";
                }
            }, 1200);

        } catch (error) {
            showToast(error.message, "error");
            submitBtn.disabled = false;
            submitBtn.innerText = "Login";
        }
    });
}
