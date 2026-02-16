import { auth, db } from "./firebase-config.js";
import { collection, addDoc, getDocs, deleteDoc, doc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { logAction } from "./logger.js";

// CREATE SERVICE
const serviceForm = document.getElementById("serviceForm");

if (serviceForm) {
    serviceForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const serviceName = document.getElementById("serviceName").value;
        const serviceDescription = document.getElementById("serviceDescription").value;

        try {
            const user = auth.currentUser;

            await addDoc(collection(db, "services"), {
                serviceName,
                serviceDescription,
                createdBy: user.uid,
                createdAt: new Date()
            });

            await logAction(user.uid, "Service Created: " + serviceName);

            alert("Service Created Successfully");
            serviceForm.reset();
            loadServices();

        } catch (error) {
            alert(error.message);
        }
    });
}

// LOAD SERVICES
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
             <button onclick="deleteService('${docSnap.id}')">Delete</button>
          </div>
         `;

    });
}

// DELETE SERVICE
window.deleteService = async function(serviceId) {
    await deleteDoc(doc(db, "services", serviceId));

    await logAction(auth.currentUser.uid, "Service Deleted");

    alert("Service Deleted");
    loadServices();
};

// Load services on page load
loadServices();
