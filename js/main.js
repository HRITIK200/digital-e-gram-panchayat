import { logAction } from "./logger.js";
import { showToast } from "./ui-helpers.js";

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                await logAction(user.id, "User Logged Out");
            }

            // Clear authentication details from localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            
            showToast("Logged out successfully!", "success");
            
            setTimeout(() => {
                window.location.href = "../login.html";
            }, 1000);
        } catch (error) {
            showToast("Logout failed: " + error.message, "error");
        }
    });
}

window.toggleSidebar = function () {
    const sidebar = document.querySelector(".admin-sidebar");
    if (sidebar) {
        sidebar.classList.toggle("active");
    }
};
