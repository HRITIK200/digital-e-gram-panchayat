import { API_URL } from "./config.js";
import { logAction } from "./logger.js";
import { showToast, createModal } from "./ui-helpers.js";
import { initThemeToggle } from "./theme.js";
import { initLanguage, t } from "./i18n.js";

// Global cache variables
let allServices = [];
let allUsers = [];
let allLogs = [];
let allNotices = [];
let allGrievances = [];

let usersSearchQuery = "";
let logsSearchQuery = "";

// ==============================
// VERIFY AUTH & LOAD PROFILE
// ==============================
async function checkAuthAndLoadProfile() {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
        window.location.href = "../login.html";
        return false;
    }

    try {
        const user = JSON.parse(userStr);

        if (user.role !== "admin") {
            showToast("Access Denied: Redirecting...", "warning");
            setTimeout(() => {
                if (user.role === "staff") {
                    window.location.href = "staff-dashboard.html";
                } else if (user.role === "user") {
                    window.location.href = "user-dashboard.html";
                } else {
                    window.location.href = "../index.html";
                }
            }, 1200);
            return false;
        }

        const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error("Session expired. Please log in again.");
        }

        const fullName = user.fullName || user.email;

        document.getElementById("adminFullName").innerText = fullName;
        document.getElementById("adminRole").innerText = "System Admin";
        document.getElementById("adminAvatar").innerText = fullName.charAt(0).toUpperCase();
        return true;
    } catch (error) {
        showToast(error.message, "error");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => {
            window.location.href = "../login.html";
        }, 1500);
        return false;
    }
}

// ==============================
// LOAD ANALYTICS & SVG CHARTS
// ==============================
async function loadAnalytics() {
    try {
        const response = await fetch(`${API_URL}/api/stats`);
        if (!response.ok) throw new Error("Failed to load statistics");
        const data = await response.json();

        document.getElementById("statsServices").innerText = data.services || 0;
        document.getElementById("statsCitizens").innerText = data.citizens || 0;
        document.getElementById("statsApplications").innerText = data.applications || 0;
        document.getElementById("statsApproved").innerText = data.approved || 0;

        renderStatusChart(data.pending || 0, data.approved || 0, data.rejected || 0);
        renderActivityBarChart(data.services || 0, data.citizens || 0, data.applications || 0, data.grievances || 0);
    } catch (error) {
        console.error("Stats load failed:", error);
    }
}

function renderStatusChart(pending, approved, rejected) {
    const wrapper = document.getElementById("statusChartWrapper");
    if (!wrapper) return;

    const total = pending + approved + rejected;
    if (total === 0) {
        wrapper.innerHTML = `<div style="color: var(--text-muted); font-size: 13.5px;">No applications recorded yet.</div>`;
        return;
    }

    const pPct = ((pending / total) * 100).toFixed(0);
    const aPct = ((approved / total) * 100).toFixed(0);
    const rPct = ((rejected / total) * 100).toFixed(0);

    wrapper.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-around; width: 100%; gap: 20px; flex-wrap: wrap;">
            <svg width="150" height="150" viewBox="0 0 42 42" style="transform: rotate(-90deg);">
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" stroke-width="5"></circle>
                <!-- Approved (Green) -->
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" stroke-width="5"
                    stroke-dasharray="${aPct} ${100 - aPct}" stroke-dashoffset="0"></circle>
                <!-- Pending (Amber) -->
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" stroke-width="5"
                    stroke-dasharray="${pPct} ${100 - pPct}" stroke-dashoffset="-${aPct}"></circle>
                <!-- Rejected (Red) -->
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#ef4444" stroke-width="5"
                    stroke-dasharray="${rPct} ${100 - rPct}" stroke-dashoffset="-${parseInt(aPct) + parseInt(pPct)}"></circle>
            </svg>
            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 12px; height: 12px; background: #10b981; border-radius: 3px;"></span>
                    <span>Approved: <strong>${approved} (${aPct}%)</strong></span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 12px; height: 12px; background: #f59e0b; border-radius: 3px;"></span>
                    <span>In Review: <strong>${pending} (${pPct}%)</strong></span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 12px; height: 12px; background: #ef4444; border-radius: 3px;"></span>
                    <span>Rejected: <strong>${rejected} (${rPct}%)</strong></span>
                </div>
            </div>
        </div>
    `;
}

function renderActivityBarChart(services, citizens, apps, grievances) {
    const wrapper = document.getElementById("activityBarChartWrapper");
    if (!wrapper) return;

    const maxVal = Math.max(services, citizens, apps, grievances, 1);

    const items = [
        { label: "Citizens", count: citizens, color: "#10b981" },
        { label: "Apps", count: apps, color: "#2563eb" },
        { label: "Services", count: services, color: "#8b5cf6" },
        { label: "Grievances", count: grievances, color: "#f97316" }
    ];

    wrapper.innerHTML = `
        <div style="display: flex; align-items: flex-end; justify-content: space-around; width: 100%; height: 150px; gap: 16px; padding-top: 10px;">
            ${items.map(item => {
                const heightPercent = Math.max(((item.count / maxVal) * 110), 12);
                return `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1;">
                        <span style="font-size: 12px; font-weight: 700; color: var(--text-main);">${item.count}</span>
                        <div style="width: 100%; max-width: 36px; height: ${heightPercent}px; background: ${item.color}; border-radius: 6px 6px 0 0; transition: height 0.4s ease;"></div>
                        <span style="font-size: 11px; color: var(--text-muted); text-align: center;">${item.label}</span>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

// ==============================
// CREATE SERVICE
// ==============================
const serviceForm = document.getElementById("serviceForm");
if (serviceForm) {
    serviceForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const serviceName = document.getElementById("serviceName").value.trim();
        const serviceDescription = document.getElementById("serviceDescription").value.trim();
        
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (!token || !userStr) return;

        const submitBtn = serviceForm.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.innerText = "Creating Service...";

        try {
            const response = await fetch(`${API_URL}/api/services`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ serviceName, serviceDescription })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to create service");

            const user = JSON.parse(userStr);
            await logAction(user.id, "Service Created: " + serviceName);

            showToast(`Service "${serviceName}" created successfully!`, "success");
            serviceForm.reset();
            fetchServices();
            loadAnalytics();

        } catch (error) {
            showToast("Failed to create service: " + error.message, "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "Publish Service to Portal →";
        }
    });
}

// ==============================
// FETCH SERVICES & DELETE
// ==============================
async function fetchServices() {
    try {
        const response = await fetch(`${API_URL}/api/services`);
        if (!response.ok) throw new Error("Failed to load services");
        const data = await response.json();
        allServices = data.services || [];
        renderServices();
    } catch (error) {
        showToast("Error loading services: " + error.message, "error");
    }
}

function renderServices() {
    const servicesList = document.getElementById("servicesList");
    if (!servicesList) return;

    servicesList.innerHTML = "";

    if (allServices.length === 0) {
        servicesList.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 30px;">No services created yet.</div>`;
        return;
    }

    allServices.forEach(service => {
        servicesList.innerHTML += `
            <div class="service-item">
                <h4>${service.service_name}</h4>
                <p>${service.service_description}</p>
                <div class="service-meta-footer">
                    <span style="font-size: 11.5px; color: var(--text-muted);">Active Scheme</span>
                    <button class="reject-btn" style="padding: 6px 14px; font-size: 12.5px;" onclick="deleteService('${service.id}')">
                        🗑 Delete Service
                    </button>
                </div>
            </div>
        `;
    });
}

window.deleteService = function(serviceId) {
    const token = localStorage.getItem("token");
    if (!token) return;

    createModal(
        "Confirm Deletion",
        "<p>Are you sure you want to permanently remove this Panchayat service? Registered applications will remain in archive.</p>",
        async () => {
            const response = await fetch(`${API_URL}/api/services/${serviceId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to delete service");

            showToast("Service deleted successfully", "success");
            fetchServices();
            loadAnalytics();
        },
        "Delete"
    );
};

// ==============================
// NOTICE BOARD MANAGER
// ==============================
const noticeForm = document.getElementById("noticeForm");
if (noticeForm) {
    noticeForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        const title = document.getElementById("noticeTitle").value.trim();
        const category = document.getElementById("noticeCategory").value;
        const isUrgent = document.getElementById("noticeIsUrgent").checked;
        const content = document.getElementById("noticeContent").value.trim();

        const submitBtn = noticeForm.querySelector("button[type='submit']");
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/api/notices`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ title, category, isUrgent, content })
            });

            if (!response.ok) throw new Error("Failed to publish notice");

            showToast("Notice published successfully!", "success");
            noticeForm.reset();
            fetchNotices();
            loadAnalytics();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            submitBtn.disabled = false;
        }
    });
}

async function fetchNotices() {
    const container = document.getElementById("adminNoticesList");
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/api/notices`);
        const data = await response.json();
        allNotices = data.notices || [];

        if (allNotices.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 30px;">No notices published yet.</div>`;
            return;
        }

        container.innerHTML = allNotices.map(n => `
            <div class="notice-card ${n.is_urgent ? "urgent" : ""}">
                <div class="notice-header-tags">
                    <span class="notice-category-pill">📌 ${n.category || "General"}</span>
                    ${n.is_urgent ? `<span class="notice-urgent-badge">🚨 Urgent</span>` : ""}
                </div>
                <h4>${n.title}</h4>
                <p>${n.content}</p>
                <div class="notice-footer">
                    <span>${new Date(n.created_at).toLocaleDateString()}</span>
                    <button class="reject-btn" style="padding: 4px 10px; font-size: 11px;" onclick="deleteNotice(${n.id})">🗑 Remove</button>
                </div>
            </div>
        `).join("");
    } catch (err) {
        console.error("Failed to load notices:", err);
    }
}

window.deleteNotice = function(id) {
    const token = localStorage.getItem("token");
    if (!token) return;

    createModal(
        "Delete Notice",
        "<p>Are you sure you want to remove this public village circular?</p>",
        async () => {
            const res = await fetch(`${API_URL}/api/notices/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to delete notice");
            showToast("Notice removed", "success");
            fetchNotices();
            loadAnalytics();
        },
        "Delete"
    );
};

// ==============================
// GRIEVANCES MONITOR (ADMIN)
// ==============================
async function fetchAdminGrievances() {
    const list = document.getElementById("adminGrievanceList");
    if (!list) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/api/grievances`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        allGrievances = data.grievances || [];

        if (allGrievances.length === 0) {
            list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">No registered village grievances.</div>`;
            return;
        }

        list.innerHTML = allGrievances.map(g => `
            <div class="grievance-card">
                <div class="grievance-header">
                    <h4>${g.subject}</h4>
                    <span class="grievance-status ${g.status.toLowerCase().replace(" ", "")}">${g.status}</span>
                </div>
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 6px;">
                    Citizen: <strong>${g.user_name || "Resident"}</strong> | Category: <strong>${g.category}</strong> | Registered: <strong>${new Date(g.created_at).toLocaleString()}</strong>
                </p>
                <p style="font-size: 14px;">${g.description}</p>
                ${g.resolution_notes ? `
                    <div class="details-box" style="margin-top: 10px; border-left-color: var(--success);">
                        <strong>Secretariat Statement:</strong> ${g.resolution_notes}
                    </div>
                ` : ""}
            </div>
        `).join("");
    } catch (err) {
        console.error("Grievance monitor load failed:", err);
    }
}

// ==============================
// USER ROLES & PERMISSIONS
// ==============================
async function fetchUsers() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/users`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to load users list");
        const data = await response.json();
        allUsers = data.users || [];
        renderUsers();
    } catch (error) {
        showToast("Error loading users: " + error.message, "error");
    }
}

function renderUsers() {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const query = usersSearchQuery.toLowerCase().trim();
    const filtered = allUsers.filter(u => {
        return (u.full_name || "").toLowerCase().includes(query) || (u.email || "").toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">No users found.</td></tr>`;
        return;
    }

    filtered.forEach(u => {
        const roleClass = `role-${u.role}`;
        tbody.innerHTML += `
            <tr>
                <td><strong>${u.full_name || "N/A"}</strong></td>
                <td>${u.email}</td>
                <td><span class="role-badge ${roleClass}">${u.role}</span></td>
                <td>
                    <div class="role-actions">
                        ${u.role !== "staff" ? `<button class="role-action-btn" onclick="updateRole(${u.id}, 'staff')">Make Staff</button>` : ""}
                        ${u.role !== "admin" ? `<button class="role-action-btn" onclick="updateRole(${u.id}, 'admin')">Make Admin</button>` : ""}
                        ${u.role !== "user" ? `<button class="role-action-btn" onclick="updateRole(${u.id}, 'user')">Make Citizen</button>` : ""}
                    </div>
                </td>
            </tr>
        `;
    });
}

window.updateRole = function(userId, newRole) {
    const token = localStorage.getItem("token");
    if (!token) return;

    createModal(
        "Update User Permissions",
        `<p>Confirm changing access permissions for User ID #${userId} to <strong>${newRole.toUpperCase()}</strong>?</p>`,
        async () => {
            const response = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to update role");

            showToast("User role updated successfully", "success");
            fetchUsers();
        },
        "Confirm"
    );
};

// ==============================
// AUDIT LOGS
// ==============================
async function fetchAuditLogs() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/api/logs`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to load logs");
        const data = await response.json();
        allLogs = data.logs || [];
        renderAuditLogs();
    } catch (error) {
        console.error("Logs load failed:", error);
    }
}

function renderAuditLogs() {
    const tbody = document.getElementById("logsTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const query = logsSearchQuery.toLowerCase().trim();
    const filtered = allLogs.filter(l => {
        return (l.action || "").toLowerCase().includes(query) || String(l.user_id).includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">No system logs found.</td></tr>`;
        return;
    }

    filtered.forEach(l => {
        tbody.innerHTML += `
            <tr>
                <td>#${l.id}</td>
                <td><span class="log-user">UID-${l.user_id}</span></td>
                <td>${l.action}</td>
                <td><span class="log-timestamp">${new Date(l.timestamp).toLocaleString()}</span></td>
            </tr>
        `;
    });
}

// Search Inputs
const usersSearchInput = document.getElementById("usersSearchInput");
if (usersSearchInput) {
    usersSearchInput.addEventListener("input", (e) => {
        usersSearchQuery = e.target.value;
        renderUsers();
    });
}

const logsSearchInput = document.getElementById("logsSearchInput");
if (logsSearchInput) {
    logsSearchInput.addEventListener("input", (e) => {
        logsSearchQuery = e.target.value;
        renderAuditLogs();
    });
}

// CSV Export for logs
const exportLogsBtn = document.getElementById("exportLogsBtn");
if (exportLogsBtn) {
    exportLogsBtn.addEventListener("click", () => {
        if (allLogs.length === 0) {
            showToast("No system logs available to export.", "warning");
            return;
        }

        try {
            const headers = "Log ID,User ID,Action Performed,Timestamp\n";
            const rows = allLogs.map(log => [
                log.id,
                log.user_id,
                `"${log.action.replace(/"/g, '""')}"`,
                `"${new Date(log.timestamp).toLocaleString()}"`
            ].join(",")).join("\n");

            const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
            const link = document.createElement("a");
            link.setAttribute("href", csvContent);
            link.setAttribute("download", `panchayat_audit_logs_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast("System audit logs exported successfully!", "success");
        } catch (error) {
            showToast("Failed to export logs: " + error.message, "error");
        }
    });
}

// ==============================
// TAB SWITCHING NAVIGATION
// ==============================
const tabBtnCreate = document.getElementById("tabBtnCreate");
const tabBtnServices = document.getElementById("tabBtnServices");
const tabBtnNotices = document.getElementById("tabBtnNotices");
const tabBtnGrievances = document.getElementById("tabBtnGrievances");
const tabBtnUsers = document.getElementById("tabBtnUsers");
const tabBtnLogs = document.getElementById("tabBtnLogs");

const tabCreate = document.getElementById("tabCreate");
const tabServices = document.getElementById("tabServices");
const tabNotices = document.getElementById("tabNotices");
const tabGrievances = document.getElementById("tabGrievances");
const tabUsers = document.getElementById("tabUsers");
const tabLogs = document.getElementById("tabLogs");
const breadcrumbAdmin = document.getElementById("breadcrumbAdmin");

const adminTabs = [
    { btn: tabBtnCreate, content: tabCreate, label: "Create Service" },
    { btn: tabBtnServices, content: tabServices, label: "All Active Services", onActive: fetchServices },
    { btn: tabBtnNotices, content: tabNotices, label: "Village Notices Manager", onActive: fetchNotices },
    { btn: tabBtnGrievances, content: tabGrievances, label: "Grievances Monitor", onActive: fetchAdminGrievances },
    { btn: tabBtnUsers, content: tabUsers, label: "User Roles & Permissions", onActive: fetchUsers },
    { btn: tabBtnLogs, content: tabLogs, label: "System Audit Trail", onActive: fetchAuditLogs }
];

adminTabs.forEach(tab => {
    if (tab.btn && tab.content) {
        tab.btn.addEventListener("click", () => {
            adminTabs.forEach(t => {
                if (t.btn) t.btn.classList.remove("active");
                if (t.content) t.content.classList.remove("active");
            });
            tab.btn.classList.add("active");
            tab.content.classList.add("active");
            if (breadcrumbAdmin) breadcrumbAdmin.innerText = tab.label;
            if (tab.onActive) tab.onActive();
        });
    }
});

// Sidebar toggle on mobile
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");

function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove("active");
    if (sidebarOverlay) sidebarOverlay.classList.remove("active");
}

function openMobileSidebar() {
    if (sidebar) sidebar.classList.add("active");
    if (sidebarOverlay) sidebarOverlay.classList.add("active");
}

if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
        if (sidebar && sidebar.classList.contains("active")) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }
    });
}
if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener("click", closeMobileSidebar);
}
if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeMobileSidebar);
}

// Auto-close on mobile when selecting a tab
adminTabs.forEach(tab => {
    if (tab.btn) {
        tab.btn.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                closeMobileSidebar();
            }
        });
    }
});

// ==============================
// INITIAL LOAD & AUTO POLLING
// ==============================
async function init() {
    const isAuthed = await checkAuthAndLoadProfile();
    if (isAuthed) {
        initThemeToggle("themeToggleBtn");
        initLanguage("langToggleBtn");

        loadAnalytics();
        fetchServices();
        fetchNotices();
        fetchAdminGrievances();
        fetchUsers();
        fetchAuditLogs();

        setInterval(() => {
            loadAnalytics();
        }, 8000);
    }
}

init();
