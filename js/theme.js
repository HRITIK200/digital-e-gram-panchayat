// Load and apply theme immediately to prevent FOUC (Flash of Unstyled Content)
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
}

/**
 * Initializes the theme toggler switch logic on a button.
 * @param {string} buttonId - DOM element ID of the toggle button.
 */
export function initThemeToggle(buttonId) {
    const toggleBtn = document.getElementById(buttonId);
    if (!toggleBtn) return;
    
    // Set initial icon
    toggleBtn.innerHTML = document.body.classList.contains("dark-theme") ? "☀️" : "🌙";
    
    toggleBtn.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark-theme");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        toggleBtn.innerHTML = isDark ? "☀️" : "🌙";
    });
}
