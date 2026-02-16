import { auth, db } from "./firebase-config.js";
import { 
    collection, 
    getDocs, 
    updateDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { logAction } from "./logger.js";


// ==============================
// LOAD APPLICATIONS
// ==============================
async function loadApplications() {

    const pendingList = document.getElementById("pendingList");
    const approvedList = document.getElementById("approvedList");
    const rejectedList = document.getElementById("rejectedList");

    pendingList.innerHTML = "";
    approvedList.innerHTML = "";
    rejectedList.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "applications"));

    querySnapshot.forEach((docSnap) => {

        const app = docSnap.data();
        const appId = docSnap.id;

        const cardHTML = `
            <div class="application-card">

                <div class="application-header">
                    <h4>${app.serviceName}</h4>
                    <span class="status-badge status-${app.status.toLowerCase()}">
                        ${app.status}
                    </span>
                </div>

                <p class="applicant-name">
                    Applicant: <strong>${app.userName}</strong>
                </p>

                ${app.status === "Pending" ? `
                    <div class="action-buttons">
                        <button class="approve-btn"
                            onclick="updateStatus('${appId}', 'Approved')">
                            Approve
                        </button>

                        <button class="reject-btn"
                            onclick="updateStatus('${appId}', 'Rejected')">
                            Reject
                        </button>
                    </div>
                ` : ""}

            </div>
        `;

        // Move card to correct section
        if (app.status === "Pending") {
            pendingList.innerHTML += cardHTML;
        } 
        else if (app.status === "Approved") {
            approvedList.innerHTML += cardHTML;
        } 
        else if (app.status === "Rejected") {
            rejectedList.innerHTML += cardHTML;
        }

    });
}


// ==============================
// UPDATE STATUS
// ==============================
window.updateStatus = async function(applicationId, newStatus) {

    try {

        await updateDoc(doc(db, "applications", applicationId), {
            status: newStatus
        });

        await logAction(auth.currentUser.uid, 
            "Application status updated to " + newStatus);

        loadApplications(); // refresh sections automatically

    } catch (error) {
        alert(error.message);
    }
};


// ==============================
// AUTH CHECK
// ==============================
onAuthStateChanged(auth, (user) => {

    if (user) {
        loadApplications();
    } else {
        window.location.href = "../index.html";
    }

});
window.scrollToSection = function(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: "smooth" });
    }
};
