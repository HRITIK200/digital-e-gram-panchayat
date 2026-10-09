import { API_URL } from "./config.js";
import { logAction } from "./logger.js";
import { showToast, createModal } from "./ui-helpers.js";
import { initThemeToggle } from "./theme.js";
import { initLanguage, t } from "./i18n.js";

// Global cache variables
let allApplications = [];
let allGrievances = [];
let searchQuery = "";

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

        if (user.role !== "staff") {
            showToast("Access Denied: Redirecting...", "warning");
            setTimeout(() => {
                if (user.role === "admin") {
                    window.location.href = "admin-dashboard.html";
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

        document.getElementById("staffFullName").innerText = fullName;
        document.getElementById("staffRole").innerText = "Verification Officer";
        document.getElementById("staffAvatar").innerText = fullName.charAt(0).toUpperCase();
        
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
// FETCH APPLICATIONS (REST)
// ==============================
async function fetchApplications() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/api/applications`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to load applications");
        const data = await response.json();
        allApplications = data.applications || [];
        renderApplications();
    } catch (error) {
        showToast("Failed to load applications: " + error.message, "error");
    }
}

// ==============================
// RENDER APPLICATIONS
// ==============================
function renderApplications() {
    const pendingList = document.getElementById("pendingList");
    const approvedList = document.getElementById("approvedList");
    const rejectedList = document.getElementById("rejectedList");

    if (!pendingList || !approvedList || !rejectedList) return;

    pendingList.innerHTML = "";
    approvedList.innerHTML = "";
    rejectedList.innerHTML = "";

    const query = searchQuery.toLowerCase().trim();
    const filtered = allApplications.filter((app) => {
        const citizen = (app.user_name || "").toLowerCase();
        const service = (app.service_name || "").toLowerCase();
        const refId = String(app.id);
        return citizen.includes(query) || service.includes(query) || refId.includes(query);
    });

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    filtered.forEach((app) => {
        const formattedDate = new Date(app.created_at).toLocaleString();

        // Check if documents are attached
        let hasDocs = false;
        let docsCount = 0;
        if (app.documents) {
            try {
                const parsed = typeof app.documents === "string" ? JSON.parse(app.documents) : app.documents;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    hasDocs = true;
                    docsCount = parsed.length;
                }
            } catch (e) {}
        }

        const cardHTML = `
            <div class="application-card">
                <div class="application-header">
                    <h4>${app.service_name}</h4>
                    <span class="status-badge status-${app.status.toLowerCase()}">
                        ${app.status}
                    </span>
                </div>

                <p class="applicant-name" style="font-size: 14.5px; margin-bottom: 4px;">
                    Citizen Applicant: <strong style="color: var(--text-main);">${app.user_name || "Applicant"}</strong> (Ref #${app.id})
                </p>
                <p style="font-size: 13px; color: var(--text-muted);">
                    Submission Timestamp: <strong>${formattedDate}</strong>
                </p>

                ${app.details ? `<div class="details-box"><strong>Citizen Purpose:</strong> ${app.details}</div>` : ""}
                ${app.feedback ? `<div class="details-box" style="border-left-color: #059669;"><strong>Officer Remark:</strong> ${app.feedback}</div>` : ""}

                <div style="display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; align-items: center;">
                    ${hasDocs ? `
                        <button class="btn-secondary" style="padding: 6px 14px; font-size: 13px;" onclick="viewAttachedDocuments(${app.id})">
                            📎 View Attached Proof (${docsCount})
                        </button>
                    ` : ""}

                    ${app.status === "Pending" ? `
                        <button class="approve-btn" style="padding: 7px 18px; font-size: 13px;"
                            onclick="triggerStatusUpdate('${app.id}', 'Approved', '${app.service_name}')">
                            ✓ Verify & Approve
                        </button>

                        <button class="reject-btn" style="padding: 7px 18px; font-size: 13px;"
                            onclick="triggerStatusUpdate('${app.id}', 'Rejected', '${app.service_name}')">
                            ✕ Reject
                        </button>
                    ` : ""}
                </div>
            </div>
        `;

        if (app.status === "Pending") {
            pendingList.innerHTML += cardHTML;
            pendingCount++;
        } else if (app.status === "Approved") {
            approvedList.innerHTML += cardHTML;
            approvedCount++;
        } else if (app.status === "Rejected") {
            rejectedList.innerHTML += cardHTML;
            rejectedCount++;
        }
    });

    const kpiP = document.getElementById("kpiPendingCount");
    const kpiA = document.getElementById("kpiApprovedCount");
    const kpiR = document.getElementById("kpiRejectedCount");
    const badgeP = document.getElementById("badgePending");
    const badgeA = document.getElementById("badgeApproved");
    const badgeR = document.getElementById("badgeRejected");

    if (kpiP) kpiP.innerText = pendingCount;
    if (kpiA) kpiA.innerText = approvedCount;
    if (kpiR) kpiR.innerText = rejectedCount;
    if (badgeP) badgeP.innerText = pendingCount;
    if (badgeA) badgeA.innerText = approvedCount;
    if (badgeR) badgeR.innerText = rejectedCount;

    if (pendingCount === 0) {
        pendingList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 36px 20px;">🎉 All pending files have been reviewed and attested!</div>`;
    }
    if (approvedCount === 0) {
        approvedList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">No approved applications found.</div>`;
    }
    if (rejectedCount === 0) {
        rejectedList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">No rejected applications found.</div>`;
    }
}

// ==============================
// VIEW ATTACHED DOCUMENTS MODAL
// ==============================
window.viewAttachedDocuments = function(appId) {
    const app = allApplications.find(a => a.id === appId);
    if (!app || !app.documents) return;

    let docs = [];
    try {
        docs = typeof app.documents === "string" ? JSON.parse(app.documents) : app.documents;
    } catch (e) {
        showToast("Error reading documents", "error");
        return;
    }

    const modalHTML = `
        <div style="display: flex; flex-direction: column; gap: 16px;">
            <p style="font-size: 13.5px; color: var(--text-muted);">Applicant <strong>${app.user_name}</strong> submitted ${docs.length} supporting proof document(s):</p>
            ${docs.map((doc, idx) => `
                <div style="background: var(--bg-card-subtle); border: 1.5px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 14px;">
                    <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
                        <span style="font-size: 28px;">📄</span>
                        <div style="overflow: hidden; text-overflow: ellipsis;">
                            <strong style="font-size: 14px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${doc.name}</strong>
                            <span style="font-size: 12px; color: var(--text-muted);">${doc.size || "Unknown size"} | ${doc.type || "Document"}</span>
                        </div>
                    </div>
                    ${doc.dataUrl ? `
                        <a href="${doc.dataUrl}" download="${doc.name}" target="_blank" class="primary-btn" style="width: auto; padding: 6px 14px; font-size: 12.5px; text-decoration: none;">
                            ⬇ Download Proof
                        </a>
                    ` : ""}
                </div>
            `).join("")}
        </div>
    `;

    createModal(
        `Supporting Documents for Application #${app.id}`,
        modalHTML,
        async () => {},
        "Done Reviewing"
    );
};

// ==============================
// FEEDBACK MODAL & STATUS UPDATE
// ==============================
window.triggerStatusUpdate = function(applicationId, newStatus, serviceName) {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
        showToast("Session expired", "error");
        return;
    }

    const isApprove = newStatus === "Approved";
    const title = isApprove ? `Approve ${serviceName}` : `Reject ${serviceName}`;

    const approveTemplates = [
        "Documents verified and found authentic under Panchayat guidelines.",
        "Physical site and identity inspection completed. Approved for e-certificate generation.",
        "Verified as per village records and revenue register. Attestation granted."
    ];

    const rejectTemplates = [
        "Discrepancy found in submitted purpose/details. Please re-apply with valid identity proof.",
        "Incomplete details provided. Citizen requested to submit physical documents at Panchayat Bhavan.",
        "Not eligible under current Panchayat scheme criteria."
    ];

    const templates = isApprove ? approveTemplates : rejectTemplates;

    const modalHTML = `
        <div class="form-group-modern" style="margin-bottom: 0;">
            <label style="margin-bottom: 6px; font-weight: 700;">Select Quick Template Statement</label>
            <select id="quickTemplateSelect" class="search-input" style="width: 100%; margin-bottom: 14px; border-radius: var(--radius-sm);">
                <option value="">-- Choose a standard official remark --</option>
                ${templates.map(t => `<option value="${t}">${t}</option>`).join("")}
            </select>

            <label style="margin-bottom: 6px; font-weight: 700;">Officer Remark / Statement for Citizen (${isApprove ? "Optional" : "Required"})</label>
            <textarea id="feedbackRemarksField" class="search-input" style="min-height: 100px; width: 100%; border-radius: var(--radius-sm);" placeholder="${isApprove ? "e.g., Documents verified. Certificate ready for download." : "e.g., Application disapproved due to incorrect income certificate details."}" required>${isApprove ? templates[0] : ""}</textarea>
        </div>
    `;

    createModal(
        title,
        modalHTML,
        async () => {
            const feedbackInput = document.getElementById("feedbackRemarksField");
            const feedback = feedbackInput ? feedbackInput.value.trim() : "";

            if (!isApprove && !feedback) {
                throw new Error("A clear rejection reason is mandatory for the citizen.");
            }

            const response = await fetch(`${API_URL}/api/applications/${applicationId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    feedback: feedback || (isApprove ? "Application verified and approved." : "Application rejected.")
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Failed to update status to ${newStatus}`);
            }

            const user = JSON.parse(userStr);
            await logAction(user.id, `Status update: Application #${applicationId} marked as ${newStatus}`);

            showToast(`Application successfully marked as ${newStatus}!`, "success");
            fetchApplications();
        },
        isApprove ? "Confirm Approval" : "Confirm Rejection"
    );

    setTimeout(() => {
        const select = document.getElementById("quickTemplateSelect");
        const textarea = document.getElementById("feedbackRemarksField");
        if (select && textarea) {
            select.addEventListener("change", () => {
                if (select.value) {
                    textarea.value = select.value;
                }
            });
        }
    }, 50);
};

// ==============================
// FETCH & RESOLVE GRIEVANCES
// ==============================
async function fetchGrievances() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/api/grievances`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to load grievances");
        const data = await response.json();
        allGrievances = data.grievances || [];
        renderGrievances();
    } catch (err) {
        console.error("Grievances load error:", err);
    }
}

function renderGrievances() {
    const list = document.getElementById("staffGrievanceList");
    const badge = document.getElementById("badgeGrievances");
    if (!list) return;

    let pendingGrievanceCount = 0;

    if (allGrievances.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">No citizen grievances registered.</div>`;
        if (badge) badge.innerText = 0;
        return;
    }

    list.innerHTML = allGrievances.map(g => {
        if (g.status === "Submitted" || g.status === "Under Review") pendingGrievanceCount++;
        const statusClass = g.status.toLowerCase().replace(" ", "");

        return `
            <div class="grievance-card">
                <div class="grievance-header">
                    <h4>${g.subject}</h4>
                    <span class="grievance-status ${statusClass}">${g.status}</span>
                </div>
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 6px;">
                    Citizen: <strong>${g.user_name || "Resident"}</strong> | Category: <strong>${g.category}</strong> | Submitted: <strong>${new Date(g.created_at).toLocaleString()}</strong>
                </p>
                <p style="font-size: 14px; margin-bottom: 12px;">${g.description}</p>
                ${g.resolution_notes ? `
                    <div class="details-box" style="margin-bottom: 12px; border-left-color: var(--success);">
                        <strong>Resolution Statement:</strong> ${g.resolution_notes}
                    </div>
                ` : ""}
                <button class="primary-btn" style="width: auto; padding: 6px 16px; font-size: 13px;" onclick="triggerGrievanceResolve(${g.id}, '${g.subject.replace(/'/g, "\\'")}')">
                    ⚖️ Action / Resolve Grievance
                </button>
            </div>
        `;
    }).join("");

    if (badge) badge.innerText = pendingGrievanceCount;
}

window.triggerGrievanceResolve = function(id, subject) {
    const token = localStorage.getItem("token");
    if (!token) return;

    const modalHTML = `
        <div class="form-group-modern" style="margin-bottom: 0;">
            <label style="margin-bottom: 6px; font-weight: 700;">Resolution Action</label>
            <select id="resolveStatusSelect" class="search-input" style="width: 100%; margin-bottom: 14px; border-radius: var(--radius-sm);">
                <option value="Resolved">✅ Resolved - Remedial Action Completed</option>
                <option value="Under Review">⏳ Under Review - Inspection Scheduled</option>
                <option value="Dismissed">❌ Dismissed - Outside Panchayat Jurisdiction</option>
            </select>

            <label style="margin-bottom: 6px; font-weight: 700;">Official Secretariat Statement for Citizen</label>
            <textarea id="resolveNotesField" class="search-input" style="min-height: 100px; width: 100%; border-radius: var(--radius-sm);" placeholder="Explain remedial action taken (e.g. Pipeline repaired by village plumber on 6th Oct)..." required>Remedial measures completed by Panchayat maintenance team.</textarea>
        </div>
    `;

    createModal(
        `Resolve Grievance: ${subject}`,
        modalHTML,
        async () => {
            const status = document.getElementById("resolveStatusSelect").value;
            const resolutionNotes = document.getElementById("resolveNotesField").value.trim();

            const response = await fetch(`${API_URL}/api/grievances/${id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status, resolutionNotes })
            });

            if (!response.ok) throw new Error("Failed to update grievance status");

            showToast("Grievance status updated successfully!", "success");
            fetchGrievances();
        },
        "Save Resolution"
    );
};

// ==============================
// SEARCH FILTER LOGIC
// ==============================
const searchInput = document.getElementById("staffSearchInput");
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        renderApplications();
    });
}

// ==============================
// CSV EXPORT LOGIC
// ==============================
const exportAppsBtn = document.getElementById("exportAppsBtn");
if (exportAppsBtn) {
    exportAppsBtn.addEventListener("click", () => {
        if (allApplications.length === 0) {
            showToast("No applications to export.", "warning");
            return;
        }

        try {
            const headers = "Application ID,Applicant Name,Service Name,Status,Submission Date,Feedback\n";
            const rows = allApplications.map(app => [
                app.id,
                `"${(app.user_name || '').replace(/"/g, '""')}"`,
                `"${(app.service_name || '').replace(/"/g, '""')}"`,
                `"${app.status}"`,
                `"${new Date(app.created_at).toLocaleString()}"`,
                `"${(app.feedback || '').replace(/"/g, '""')}"`
            ].join(",")).join("\n");

            const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
            const link = document.createElement("a");
            link.setAttribute("href", csvContent);
            link.setAttribute("download", `panchayat_applications_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast("Applications exported successfully!", "success");
        } catch (error) {
            showToast("Failed to export applications: " + error.message, "error");
        }
    });
}

// ==============================
// TAB SWITCHING NAVIGATION
// ==============================
const tabBtnPending = document.getElementById("tabBtnPending");
const tabBtnApproved = document.getElementById("tabBtnApproved");
const tabBtnRejected = document.getElementById("tabBtnRejected");
const tabBtnGrievances = document.getElementById("tabBtnGrievances");

const tabPending = document.getElementById("tabPending");
const tabApproved = document.getElementById("tabApproved");
const tabRejected = document.getElementById("tabRejected");
const tabGrievances = document.getElementById("tabGrievances");
const breadcrumbStaff = document.getElementById("breadcrumbStaff");

const staffTabs = [
    { btn: tabBtnPending, content: tabPending, label: "Pending Applications Queue" },
    { btn: tabBtnApproved, content: tabApproved, label: "Approved & Issued Files" },
    { btn: tabBtnRejected, content: tabRejected, label: "Rejected Files" },
    { btn: tabBtnGrievances, content: tabGrievances, label: "Citizen Grievances Desk", onActive: fetchGrievances }
];

staffTabs.forEach(tab => {
    if (tab.btn && tab.content) {
        tab.btn.addEventListener("click", () => {
            staffTabs.forEach(t => {
                if (t.btn) t.btn.classList.remove("active");
                if (t.content) t.content.classList.remove("active");
            });
            tab.btn.classList.add("active");
            tab.content.classList.add("active");
            if (breadcrumbStaff) breadcrumbStaff.innerText = tab.label;
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
staffTabs.forEach(tab => {
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

        fetchApplications();
        fetchGrievances();

        setInterval(() => {
            fetchApplications();
            fetchGrievances();
        }, 8000);
    }
}

init();
