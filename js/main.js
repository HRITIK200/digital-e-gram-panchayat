import { auth } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { logAction } from "./logger.js";

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        const user = auth.currentUser;

        await logAction(user.uid, "User Logged Out");

        await signOut(auth);
        alert("Logged Out Successfully");
        window.location.href = "../login.html";
    });
}
window.toggleSidebar = function () {
    document.querySelector(".admin-sidebar")
        .classList.toggle("active");
};
