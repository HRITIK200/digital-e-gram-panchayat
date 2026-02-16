// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your Firebase config here
const firebaseConfig = {
  apiKey: "AIzaSyBo7R_1domcYyPIqh9DO0KpVWMIMJVPykc",
  authDomain: "digital-e-gram-panchayat-7d844.firebaseapp.com",
  projectId: "digital-e-gram-panchayat-7d844",
  storageBucket: "digital-e-gram-panchayat-7d844.firebasestorage.app",
  messagingSenderId: "35948594253",
  appId: "1:35948594253:web:1b99768290e6401b9a0804"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
