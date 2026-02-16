import { auth, db } from "./firebase-config.js";
import { 
    collection, 
    getDocs, 
    addDoc, 
    query, 
    where,
    doc,
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { logAction } from "./logger.js";


// ==============================
// LOAD USER PROFILE (Sidebar)
// ==============================
async function loadUserProfile(user) {

    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {

        const userData = userSnap.data();

        const fullName = userData.fullName || user.email;
        const role = userData.role || "Citizen";

        // Set full name
        document.getElementById("userFullName").innerText = fullName;

        // Set role
        document.getElementById("userRole").innerText = role;

        // Set avatar first letter
        document.getElementById("userAvatar").innerText =
            fullName.charAt(0).toUpperCase();

    } else {
        console.log("User document not found!");
    }
}

// ==============================
// LOAD SERVICES
// ==============================
async function loadServices() {
    const servicesList = document.getElementById("servicesList");
    servicesList.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "services"));

    querySnapshot.forEach((docSnap) => {
        const service = docSnap.data();

        servicesList.innerHTML += `
            <div class="service-item">
                <h4>${service.serviceName}</h4>
                <p>${service.serviceDescription}</p>

                <button class="primary-btn"
                    onclick="applyService('${docSnap.id}', '${service.serviceName}')">
                    Apply Now
                </button>
            </div>
        `;
    });
}


// ==============================
// APPLY SERVICE
// ==============================
window.applyService = async function(serviceId, serviceName) {

    const user = auth.currentUser;

    if (!user) {
        alert("User not logged in!");
        return;
    }

    try {

        // 🔎 Get user full data from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
            alert("User profile not found!");
            return;
        }

        const userData = userSnap.data();

        // 🚨 CHECK IF ALREADY APPLIED
        const q = query(
            collection(db, "applications"),
            where("userId", "==", user.uid),
            where("serviceId", "==", serviceId)
        );

        const existing = await getDocs(q);

        if (!existing.empty) {
            alert("⚠ You have already applied for this service!");
            return;
        }

        // ✅ Save new application
        await addDoc(collection(db, "applications"), {
            userId: user.uid,
            userName: userData.fullName,   // ✅ FULL NAME now
            serviceId: serviceId,
            serviceName: serviceName,
            status: "Pending",
            createdAt: new Date()
        });

        await logAction(user.uid, "Applied for Service: " + serviceName);

        alert("Application Submitted Successfully!");
        loadApplications();

    } catch (error) {
        alert(error.message);
    }
};



// ==============================
// LOAD USER APPLICATIONS
// ==============================
async function loadApplications() {

    const applicationsList = document.getElementById("applicationsList");
    applicationsList.innerHTML = "";

    const user = auth.currentUser;

    if (!user) return;

    const q = query(
        collection(db, "applications"),
        where("userId", "==", user.uid)
    );

    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((docSnap) => {
        const app = docSnap.data();

        applicationsList.innerHTML += `
            <div class="application-card">

                <div class="application-header">
                    <h4>${app.serviceName}</h4>
                    <span class="status-badge status-${app.status.toLowerCase()}">
                        ${app.status}
                    </span>
                </div>

                <p>
                    <strong>Applied On:</strong> 
                    ${app.createdAt 
                        ? new Date(app.createdAt.seconds * 1000).toLocaleString()
                        : "Just Now"}
                </p>

            </div>
        `;
    });
}


// ==============================
// AUTH STATE LISTENER
// ==============================
onAuthStateChanged(auth, (user) => {

    if (user) {
        loadUserProfile(user);  
        loadServices();
        loadApplications();
    } else {
        window.location.href = "../index.html";
    }

});

