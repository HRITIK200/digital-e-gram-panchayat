import { API_URL } from "./config.js";

// =========================================================================
// Log System Activity
// =========================================================================
export async function logAction(userId, action) {
    try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_URL}/api/logs`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ action })
        });
        
        if (!response.ok) {
            console.error("Logging failed on server");
        } else {
            console.log("Log saved");
        }
    } catch (error) {
        console.error("Logging failed:", error);
    }
}
