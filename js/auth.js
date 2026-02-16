import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { collection, doc, setDoc, getDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { logAction } from "./logger.js";

// REGISTER
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                name,
                email,
                role,
                createdAt: new Date()
            });

            await logAction(user.uid, "User Registered");

            alert("Registration Successful!");
            window.location.href = "login.html";

        } catch (error) {
            alert(error.message);
        }
    });
}

// LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Get user role from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.data();

            await logAction(user.uid, "User Logged In");

            alert("Login Successful!");

            // Role-based redirection
            if (userData.role === "admin") {
                window.location.href = "pages/admin-dashboard.html";
            } else if (userData.role === "staff") {
                window.location.href = "pages/staff-dashboard.html";
            } else {
                window.location.href = "pages/user-dashboard.html";
            }

        } catch (error) {
            alert(error.message);
        }
    });
}
