import { API_URL } from "./config.js";
import { logAction } from "./logger.js";
import { showToast, createModal, showCertificateModal } from "./ui-helpers.js";
import { initThemeToggle } from "./theme.js";
import { initLanguage, t } from "./i18n.js";

// Global cache variables
let allServices = [];
let allApplications = [];
let selectedCategory = "all";
let serviceSearchTerm = "";
let selectedAppStatusFilter = "all";
let uploadedFiles = [];

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

        // Client-side route guard
        if (user.role !== "user") {
            showToast("Access Denied: Redirecting...", "warning");
            setTimeout(() => {
                if (user.role === "admin") {
                    window.location.href = "admin-dashboard.html";
                } else if (user.role === "staff") {
                    window.location.href = "staff-dashboard.html";
                } else {
                    window.location.href = "../index.html";
                }
            }, 1200);
            return false;
        }

        // Verify token with API
        const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Session expired. Please log in again.");
        }

        const fullName = user.fullName || user.email;
        const role = "Citizen";

        document.getElementById("userFullName").innerText = fullName;
        document.getElementById("userRole").innerText = role;
        document.getElementById("userAvatar").innerText = fullName.charAt(0).toUpperCase();

        const bannerName = document.getElementById("bannerCitizenName");
        if (bannerName) {
            bannerName.innerText = fullName.split(" ")[0];
        }

        // Populate settings panel
        const settingsFullName = document.getElementById("settingsFullName");
        const settingsEmail = document.getElementById("settingsEmail");
        if (settingsFullName && settingsEmail) {
            settingsFullName.value = fullName;
            settingsEmail.value = user.email;
        }
        
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
// CATEGORY HELPERS
// ==============================
function getServiceCategory(serviceName) {
    const name = serviceName.toLowerCase();
    if (name.includes("certificate") || name.includes("license") || name.includes("domicile") || name.includes("birth") || name.includes("death") || name.includes("caste")) {
        return "Certificates";
    }
    if (name.includes("pension") || name.includes("income") || name.includes("tax") || name.includes("fund") || name.includes("financial") || name.includes("ration") || name.includes("kisan") || name.includes("aid")) {
        return "Pensions & Revenue";
    }
    return "Utilities & Civic";
}

function renderCategoryFilters() {
    const filterContainer = document.getElementById("categoryFilters");
    if (!filterContainer) return;

    const categories = [
        { id: "all", label: "🌟 All Services" },
        { id: "Certificates", label: "📜 Certificates" },
        { id: "Pensions & Revenue", label: "💰 Pensions & Aid" },
        { id: "Utilities & Civic", label: "🏠 Utilities & Civic" }
    ];
    filterContainer.innerHTML = "";

    categories.forEach(cat => {
        const isActive = cat.id === selectedCategory;
        const button = document.createElement("button");
        button.className = `filter-chip ${isActive ? "active" : ""}`;
        button.innerText = cat.label;
        button.addEventListener("click", () => {
            selectedCategory = cat.id;
            renderCategoryFilters();
            renderServices();
        });
        filterContainer.appendChild(button);
    });
}

// ==============================
// LOAD SERVICES
// ==============================
async function fetchServices() {
    try {
        const response = await fetch(`${API_URL}/api/services`);
        if (!response.ok) throw new Error("Failed to fetch services");
        const data = await response.json();
        allServices = data.services || [];
        renderServices();
        renderCategoryFilters();
    } catch (error) {
        showToast(error.message, "error");
    }
}

function renderServices() {
    const servicesList = document.getElementById("servicesList");
    if (!servicesList) return;

    servicesList.innerHTML = "";

    const filtered = allServices.filter(service => {
        const matchesCategory = (selectedCategory === "all") || (getServiceCategory(service.service_name) === selectedCategory);
        const matchesSearch = service.service_name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) || 
                              service.service_description.toLowerCase().includes(serviceSearchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        servicesList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 48px 20px;">
                <span style="font-size: 36px; display: block; margin-bottom: 8px;">🔍</span>
                <p style="font-size: 16px; font-weight: 600;">No services found matching your criteria</p>
                <p style="font-size: 13.5px; margin-top: 4px;">Try searching with different keywords or switch categories.</p>
            </div>
        `;
        return;
    }

    filtered.forEach((service) => {
        const category = getServiceCategory(service.service_name);
        servicesList.innerHTML += `
            <div class="service-item">
                <div class="service-card-top">
                    <span class="service-category-badge">
                        <span>🏷️</span> ${category}
                    </span>
                    <span class="service-fee-tag">${t("freeService")}</span>
                </div>

                <h4>${service.service_name}</h4>
                <p>${service.service_description}</p>

                <div class="service-meta-footer">
                    <span class="service-sla-tag">
                        <span>⏱️</span> ${t("turnaroundTime")}
                    </span>
                    <button class="btn-apply-service"
                        onclick="triggerApply('${service.id}', '${service.service_name}')">
                        ${t("btnApplyNow")}
                    </button>
                </div>
            </div>
        `;
    });
}

// Service search input handler
const serviceSearchInput = document.getElementById("serviceSearchInput");
if (serviceSearchInput) {
    serviceSearchInput.addEventListener("input", (e) => {
        serviceSearchTerm = e.target.value.trim();
        renderServices();
    });
}

// ==============================
// TRIGGER APPLICATION MODAL (WITH DOCUMENT ATTACHMENTS)
// ==============================
window.triggerApply = async function(serviceId, serviceName) {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
        showToast("Session expired. Please log in.", "error");
        return;
    }

    uploadedFiles = [];

    const modalHTML = `
        <div class="form-group-modern" style="margin-bottom: 16px;">
            <label style="margin-bottom: 6px; font-weight: 700;">Supporting Purpose & Details</label>
            <p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 8px;">State reason, identity details, or relevant requirements for verification officer.</p>
            <textarea id="appDetailsField" class="search-input" style="min-height: 90px; width: 100%; border-radius: var(--radius-md);" placeholder="e.g. Higher education scholarship requirement. Ward 4 resident." required></textarea>
        </div>

        <div class="form-group-modern" style="margin-bottom: 0;">
            <label style="margin-bottom: 6px; font-weight: 700;">Attach Supporting Documents (Identity / Address Proof)</label>
            <div class="file-dropzone" id="fileDropzone">
                <span style="font-size: 26px; display: block; margin-bottom: 4px;">📎</span>
                <span style="font-size: 13.5px; font-weight: 600; color: var(--accent);">Click to Browse or Drag Files Here</span>
                <span style="font-size: 11.5px; color: var(--text-muted); display: block; margin-top: 4px;">Upload Aadhaar, Ration Card, or Income Slip (.pdf, .jpg, .png max 5MB)</span>
                <input type="file" id="fileInputPicker" style="display: none;" accept=".pdf,.png,.jpg,.jpeg">
            </div>
            <div id="filePreviewContainer" class="file-preview-list"></div>
        </div>
    `;

    createModal(
        `Apply for ${serviceName}`,
        modalHTML,
        async () => {
            const details = document.getElementById("appDetailsField").value.trim();
            if (!details) {
                throw new Error("Application details and purpose are required!");
            }

            const response = await fetch(`${API_URL}/api/applications`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    serviceId,
                    serviceName,
                    details,
                    documents: uploadedFiles
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to submit application");
            }

            const user = JSON.parse(userStr);
            await logAction(user.id, "Applied for Service: " + serviceName);
            showToast(`Application for ${serviceName} submitted successfully!`, "success");
            loadApplications();
        },
        "Submit Application"
    );

    // Setup file picker events
    setTimeout(() => {
        const dropzone = document.getElementById("fileDropzone");
        const picker = document.getElementById("fileInputPicker");
        const previewList = document.getElementById("filePreviewContainer");

        if (dropzone && picker) {
            dropzone.onclick = () => picker.click();

            picker.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                        alert("File exceeds maximum size of 5MB.");
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (re) => {
                        uploadedFiles.push({
                            name: file.name,
                            size: (file.size / 1024).toFixed(1) + " KB",
                            type: file.type,
                            dataUrl: re.target.result
                        });
                        renderPreviewFiles();
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        function renderPreviewFiles() {
            if (!previewList) return;
            previewList.innerHTML = uploadedFiles.map((f, idx) => `
                <div class="file-chip">
                    <span>📄</span>
                    <span>${f.name} (${f.size})</span>
                    <span class="remove-file" onclick="removeUploadedFile(${idx})">&times;</span>
                </div>
            `).join("");
        }

        window.removeUploadedFile = (idx) => {
            uploadedFiles.splice(idx, 1);
            renderPreviewFiles();
        };
    }, 50);
};

// ==============================
// LOAD USER APPLICATIONS WITH TIMELINE
// ==============================
async function loadApplications() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/api/applications`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Failed to fetch applications");
        const data = await response.json();
        allApplications = data.applications || [];

        // Update Dashboard Metrics in Greeting Banner
        let activeCount = 0;
        let approvedCount = 0;
        allApplications.forEach(app => {
            if (app.status === "Pending") activeCount++;
            if (app.status === "Approved") approvedCount++;
        });

        const mActive = document.getElementById("metricActiveApps");
        const mApproved = document.getElementById("metricApprovedApps");
        const mTotal = document.getElementById("metricTotalApps");
        if (mActive) mActive.innerText = activeCount;
        if (mApproved) mApproved.innerText = approvedCount;
        if (mTotal) mTotal.innerText = allApplications.length;

        renderApplications();
    } catch (error) {
        showToast(error.message, "error");
    }
}

function renderApplications() {
    const applicationsList = document.getElementById("applicationsList");
    if (!applicationsList) return;

    applicationsList.innerHTML = "";

    const filtered = allApplications.filter(app => {
        if (selectedAppStatusFilter === "all") return true;
        return app.status.toLowerCase() === selectedAppStatusFilter.toLowerCase();
    });

    if (filtered.length === 0) {
        applicationsList.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 48px 20px;">
                <span style="font-size: 36px; display: block; margin-bottom: 8px;">📋</span>
                <p style="font-size: 16px; font-weight: 700;">No applications found in this view</p>
                <p style="font-size: 13.5px; margin-top: 4px;">Click on Available Services to apply for official certificates.</p>
                <button class="primary-btn" style="width: auto; padding: 10px 24px; margin-top: 18px;" onclick="document.getElementById('tabBtnServices').click()">Explore Services</button>
            </div>`;
        return;
    }

    filtered.forEach((app) => {
        const formattedDate = new Date(app.created_at).toLocaleString();
        const isPending = app.status === "Pending";
        const isApproved = app.status === "Approved";

        // Check if documents are attached
        let docBadge = "";
        if (app.documents) {
            try {
                const docs = typeof app.documents === "string" ? JSON.parse(app.documents) : app.documents;
                if (Array.isArray(docs) && docs.length > 0) {
                    docBadge = `<span class="service-category-badge" style="margin-left: 10px;">📎 ${docs.length} Document(s) Attached</span>`;
                }
            } catch (e) {}
        }

        const timelineHTML = `
            <div class="timeline">
                <div class="timeline-item success">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-title"><span>✓</span> Application Submitted Online</div>
                        <div class="timeline-date">${formattedDate}</div>
                        <div class="timeline-desc">Official file created and assigned reference #${app.id}.</div>
                    </div>
                </div>
                
                <div class="timeline-item ${isPending ? "active" : "success"}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-title">Panchayat Verification Officer Review</div>
                        <div class="timeline-desc">
                            ${isPending ? "Under active scrutiny by Panchayat Secretariat." : "Verification stage concluded."}
                        </div>
                    </div>
                </div>
                
                <div class="timeline-item ${isPending ? "" : (isApproved ? "success" : "danger")} ${!isPending ? "active" : ""}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-title">
                            ${isPending ? "Pending Final Attestation" : (isApproved ? "Approved & Digitally Attested" : "Application Rejected")}
                        </div>
                        <div class="timeline-desc">
                            ${isPending ? "Awaiting final decision from Competent Officer." : `Officer Statement: "<strong>${app.feedback || "Processed and signed by Competent Authority."}</strong>"`}
                        </div>
                    </div>
                </div>
            </div>
        `;

        applicationsList.innerHTML += `
            <div class="application-card">
                <div class="application-header">
                    <h4>${app.service_name} ${docBadge}</h4>
                    <span class="status-badge status-${app.status.toLowerCase()}">
                        ${app.status}
                    </span>
                </div>
                
                <p style="font-size: 13.5px; color: var(--text-muted);">
                    Reference ID: <strong style="color: var(--accent);">#${app.id}</strong> | Applied on: <strong style="color: var(--text-main);">${formattedDate}</strong>
                </p>

                ${app.details ? `<div class="details-box"><strong>Citizen Purpose:</strong> ${app.details}</div>` : ""}
                
                <div style="display: flex; gap: 12px; align-items: center; margin-top: 14px; flex-wrap: wrap;">
                    <button class="toggle-drawer-btn" onclick="toggleDrawer('drawer-${app.id}', this)">
                        <span>👁</span> ${t("btnShowTimeline")}
                    </button>

                    ${isApproved ? `
                        <button class="btn-apply-service" style="padding: 6px 14px; font-size: 13px; background: linear-gradient(135deg, #059669, #10b981);" onclick="viewDigitalCertificate(${JSON.stringify(app).replace(/"/g, '&quot;')})">
                            ${t("btnViewCertificate")}
                        </button>
                    ` : ""}
                </div>
                
                <div id="drawer-${app.id}" class="collapsible-drawer">
                    <div style="padding-top: 15px; border-top: 1px dashed var(--border-color); margin-top: 15px;">
                        ${timelineHTML}
                    </div>
                </div>
            </div>
        `;
    });
}

window.viewDigitalCertificate = function(app) {
    showCertificateModal(app);
};

window.toggleDrawer = function(drawerId, btn) {
    const drawer = document.getElementById(drawerId);
    if (!drawer) return;

    const isOpen = drawer.classList.contains("open");
    if (isOpen) {
        drawer.classList.remove("open");
        btn.innerHTML = `<span>👁</span> ${t("btnShowTimeline")}`;
    } else {
        drawer.classList.add("open");
        btn.innerHTML = `<span>🙈</span> ${t("btnHideTimeline")}`;
    }
};

// Application status filter buttons
const filterAll = document.getElementById("appFilterAll");
const filterPending = document.getElementById("appFilterPending");
const filterApproved = document.getElementById("appFilterApproved");
const filterRejected = document.getElementById("appFilterRejected");

function setAppFilter(status, activeBtn) {
    selectedAppStatusFilter = status;
    [filterAll, filterPending, filterApproved, filterRejected].forEach(b => {
        if (b) b.classList.remove("active");
    });
    if (activeBtn) activeBtn.classList.add("active");
    renderApplications();
}

if (filterAll) filterAll.addEventListener("click", () => setAppFilter("all", filterAll));
if (filterPending) filterPending.addEventListener("click", () => setAppFilter("pending", filterPending));
if (filterApproved) filterApproved.addEventListener("click", () => setAppFilter("approved", filterApproved));
if (filterRejected) filterRejected.addEventListener("click", () => setAppFilter("rejected", filterRejected));

// ==============================
// LOAD CITIZEN NOTICES
// ==============================
async function loadCitizenNotices() {
    const container = document.getElementById("citizenNoticesList");
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/api/notices`);
        if (!response.ok) throw new Error("Failed to load notices");
        const data = await response.json();
        const notices = data.notices || [];

        if (notices.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 30px;">No circulars published at present.</div>`;
            return;
        }

        container.innerHTML = notices.map(n => `
            <div class="notice-card ${n.is_urgent ? "urgent" : ""}">
                <div class="notice-header-tags">
                    <span class="notice-category-pill">📌 ${n.category || "General"}</span>
                    ${n.is_urgent ? `<span class="notice-urgent-badge">🚨 Urgent Notice</span>` : ""}
                </div>
                <h4>${n.title}</h4>
                <p>${n.content}</p>
                <div class="notice-footer">
                    <span>Published: ${new Date(n.created_at).toLocaleDateString()}</span>
                    <span>Gram Secretariat</span>
                </div>
            </div>
        `).join("");
    } catch (err) {
        container.innerHTML = `<div style="color: var(--danger); text-align: center;">Failed to load notices.</div>`;
    }
}

// ==============================
// GRIEVANCES REDRESSAL DESK
// ==============================
const grievanceForm = document.getElementById("grievanceForm");
if (grievanceForm) {
    grievanceForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        const subject = document.getElementById("grievanceSubject").value.trim();
        const category = document.getElementById("grievanceCategory").value;
        const description = document.getElementById("grievanceDescription").value.trim();

        const submitBtn = grievanceForm.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.innerText = "Registering Grievance...";

        try {
            const response = await fetch(`${API_URL}/api/grievances`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ subject, category, description })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to submit grievance");

            showToast("Grievance registered successfully!", "success");
            grievanceForm.reset();
            loadGrievances();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = t("btnSubmitGrievance");
        }
    });
}

async function loadGrievances() {
    const list = document.getElementById("grievanceList");
    if (!list) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/api/grievances`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to load grievances");
        const data = await response.json();
        const grievances = data.grievances || [];

        if (grievances.length === 0) {
            list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">No grievances registered yet.</div>`;
            return;
        }

        list.innerHTML = grievances.map(g => {
            const statusClass = g.status.toLowerCase().replace(" ", "");
            return `
                <div class="grievance-card">
                    <div class="grievance-header">
                        <h4>${g.subject}</h4>
                        <span class="grievance-status ${statusClass}">${g.status}</span>
                    </div>
                    <p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 8px;">
                        Category: <strong>${g.category}</strong> | Registered: <strong>${new Date(g.created_at).toLocaleString()}</strong>
                    </p>
                    <p style="font-size: 14px; color: var(--text-main);">${g.description}</p>
                    ${g.resolution_notes ? `
                        <div class="details-box" style="margin-top: 12px; border-left-color: var(--success);">
                            <strong>Panchayat Resolution Note:</strong> ${g.resolution_notes}
                        </div>
                    ` : ""}
                </div>
            `;
        }).join("");
    } catch (err) {
        list.innerHTML = `<div style="color: var(--danger); text-align: center;">Failed to load grievances.</div>`;
    }
}

// ==============================
// UPDATE PROFILE SETTINGS
// ==============================
const profileForm = document.getElementById("profileForm");
if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (!token || !userStr) return;

        const fullNameVal = document.getElementById("settingsFullName").value.trim();
        const submitBtn = profileForm.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.innerText = "Saving Changes...";

        try {
            const response = await fetch(`${API_URL}/api/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ fullName: fullNameVal })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update profile");
            }

            const cachedUser = JSON.parse(userStr);
            cachedUser.fullName = fullNameVal;
            localStorage.setItem("user", JSON.stringify(cachedUser));

            showToast("Profile name updated successfully!", "success");
            await checkAuthAndLoadProfile();

        } catch (error) {
            showToast(error.message, "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "Save Profile Changes";
        }
    });
}

// ==============================
// NOTIFICATIONS HUB
// ==============================
const bellBtn = document.getElementById("bellBtn");
const notificationDropdown = document.getElementById("notificationDropdown");
const clearNotificationsBtn = document.getElementById("clearNotificationsBtn");
const notificationList = document.getElementById("notificationList");
const bellBadge = document.getElementById("bellBadge");

if (bellBtn && notificationDropdown) {
    bellBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle("active");
    });
    
    document.addEventListener("click", () => {
        notificationDropdown.classList.remove("active");
    });
    
    notificationDropdown.addEventListener("click", (e) => {
        e.stopPropagation();
    });
}

async function loadNotifications() {
    const token = localStorage.getItem("token");
    if (!token || !notificationList) return;
    
    try {
        const response = await fetch(`${API_URL}/api/notifications`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to load notifications");
        const data = await response.json();
        
        notificationList.innerHTML = "";
        let unreadCount = 0;
        
        if (!data.notifications || data.notifications.length === 0) {
            notificationList.innerHTML = `<div class="notification-empty">No notifications yet.</div>`;
            bellBadge.style.display = "none";
            return;
        }
        
        data.notifications.forEach(notif => {
            if (!notif.is_read) unreadCount++;
            const formattedDate = new Date(notif.created_at).toLocaleString();
            
            notificationList.innerHTML += `
                <div class="notification-item ${notif.is_read ? "" : "unread"}">
                    <div class="notification-item-text">${notif.message}</div>
                    <div class="notification-item-time">${formattedDate}</div>
                </div>
            `;
        });
        
        if (unreadCount > 0) {
            bellBadge.innerText = unreadCount;
            bellBadge.style.display = "flex";
        } else {
            bellBadge.style.display = "none";
        }
    } catch (err) {
        console.error("Notifications loader failed:", err);
    }
}

if (clearNotificationsBtn) {
    clearNotificationsBtn.addEventListener("click", async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/api/notifications/read`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                loadNotifications();
            }
        } catch (err) {
            console.error("Clear notifications failed:", err);
        }
    });
}

// ==============================
// TAB SWITCHING NAVIGATION
// ==============================
const tabBtnServices = document.getElementById("tabBtnServices");
const tabBtnApplications = document.getElementById("tabBtnApplications");
const tabBtnNotices = document.getElementById("tabBtnNotices");
const tabBtnGrievances = document.getElementById("tabBtnGrievances");
const tabBtnSettings = document.getElementById("tabBtnSettings");

const tabServices = document.getElementById("tabServices");
const tabApplications = document.getElementById("tabApplications");
const tabNotices = document.getElementById("tabNotices");
const tabGrievances = document.getElementById("tabGrievances");
const tabSettings = document.getElementById("tabSettings");
const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");

const allTabs = [
    { btn: tabBtnServices, content: tabServices, label: "Available Services" },
    { btn: tabBtnApplications, content: tabApplications, label: "My Applications" },
    { btn: tabBtnNotices, content: tabNotices, label: "Panchayat Notices", onActive: loadCitizenNotices },
    { btn: tabBtnGrievances, content: tabGrievances, label: "Grievance Redressal", onActive: loadGrievances },
    { btn: tabBtnSettings, content: tabSettings, label: "Profile Settings" }
];

allTabs.forEach(tab => {
    if (tab.btn && tab.content) {
        tab.btn.addEventListener("click", () => {
            allTabs.forEach(t => {
                if (t.btn) t.btn.classList.remove("active");
                if (t.content) t.content.classList.remove("active");
            });
            tab.btn.classList.add("active");
            tab.content.classList.add("active");
            if (breadcrumbCurrent) breadcrumbCurrent.innerText = tab.label;
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
allTabs.forEach(tab => {
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

        fetchServices();
        loadApplications();
        loadNotifications();
        loadCitizenNotices();
        loadGrievances();

        // Polling loop
        setInterval(() => {
            loadApplications();
            loadNotifications();
        }, 8000);
    }
}

init();
