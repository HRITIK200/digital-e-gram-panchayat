import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function logAction(userId, action) {
    try {
        await addDoc(collection(db, "logs"), {
            userId: userId,
            action: action,
            timestamp: serverTimestamp()
        });
        console.log("Log saved");
    } catch (error) {
        console.error("Logging failed:", error);
    }
}
