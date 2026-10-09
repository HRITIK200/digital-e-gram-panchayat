// =========================================================================
// API base configuration
// =========================================================================
// Dynamically toggles between local testing and production deployment.
// TODO: Replace the placeholder onrender URL with your actual deployed Render URL.
export const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://digital-e-gram-panchayat-backend.onrender.com";
