// Reusable UI helpers for Digital E-Gram Panchayat

// Toast Notification
export function showToast(message, type = "success") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // Trigger transition
    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    // Auto remove
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// Modal Helpers
export function createModal(title, contentHTML, onConfirm, confirmText = "Confirm") {
    let modalOverlay = document.getElementById("customModalOverlay");
    if (!modalOverlay) {
        modalOverlay = document.createElement("div");
        modalOverlay.id = "customModalOverlay";
        modalOverlay.className = "modal-overlay";
        document.body.appendChild(modalOverlay);
    }

    modalOverlay.innerHTML = `
        <div class="modal-card">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" id="modalCloseBtn">&times;</button>
            </div>
            <div class="modal-body">
                ${contentHTML}
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="modalCancelBtn">Cancel</button>
                <button class="primary-btn" id="modalConfirmBtn">${confirmText}</button>
            </div>
        </div>
    `;

    modalOverlay.classList.add("active");

    const close = () => {
        modalOverlay.classList.remove("active");
    };

    modalOverlay.querySelector("#modalCloseBtn").onclick = close;
    modalOverlay.querySelector("#modalCancelBtn").onclick = close;
    
    const confirmBtn = modalOverlay.querySelector("#modalConfirmBtn");
    confirmBtn.onclick = async () => {
        confirmBtn.disabled = true;
        const originalText = confirmBtn.innerText;
        confirmBtn.innerText = "Processing...";
        try {
            await onConfirm();
            close();
        } catch (error) {
            showToast(error.message, "error");
            confirmBtn.disabled = false;
            confirmBtn.innerText = originalText;
        }
    };
}

// Digital Certificate Modal Preview & Print
export function showCertificateModal(app) {
    let modalOverlay = document.getElementById("certificateModalOverlay");
    if (!modalOverlay) {
        modalOverlay = document.createElement("div");
        modalOverlay.id = "certificateModalOverlay";
        modalOverlay.className = "modal-overlay";
        document.body.appendChild(modalOverlay);
    }

    const certDate = new Date(app.created_at || Date.now()).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric"
    });
    const certNumber = `EGP/${new Date().getFullYear()}/${String(app.id || 1).padStart(6, '0')}`;

    modalOverlay.innerHTML = `
        <div class="modal-card" style="max-width: 720px;">
            <div class="modal-header">
                <h3>Official Digital Certificate</h3>
                <button class="modal-close" id="certCloseBtn">&times;</button>
            </div>
            <div class="modal-body" style="padding: 12px;">
                <div class="certificate-frame">
                    <div class="cert-watermark">GOVERNMENT OF INDIA</div>
                    
                    <div class="cert-header">
                        <span class="cert-emblem">🏛️</span>
                        <div class="cert-gov-title">Government of India | State e-Panchayat Directorate</div>
                        <div class="cert-panchayat-title">OFFICE OF THE GRAM PANCHAYAT</div>
                        <div class="cert-doc-name">${app.service_name}</div>
                    </div>

                    <div class="cert-body">
                        <p>This is to officially certify that the application submitted by <span class="cert-highlight">${app.user_name || "Applicant"}</span> has been thoroughly verified, scrutinized, and approved by the competent Panchayat authority under the provisions of the State Panchayati Raj Act.</p>

                        <table class="cert-details-table">
                            <tr>
                                <td class="lbl">Certificate Registration No:</td>
                                <td><strong>${certNumber}</strong></td>
                            </tr>
                            <tr>
                                <td class="lbl">Applicant Full Name:</td>
                                <td>${app.user_name || "Applicant"}</td>
                            </tr>
                            <tr>
                                <td class="lbl">Service Title:</td>
                                <td>${app.service_name}</td>
                            </tr>
                            <tr>
                                <td class="lbl">Purpose / Application Details:</td>
                                <td>${app.details || "General Verification"}</td>
                            </tr>
                            <tr>
                                <td class="lbl">Date of Attestation:</td>
                                <td>${certDate}</td>
                            </tr>
                            <tr>
                                <td class="lbl">Verification Statement:</td>
                                <td><span style="color:#065f46; font-weight:600;">${app.feedback || "Verified and authenticated by Panchayat Authority."}</span></td>
                            </tr>
                        </table>

                        <p style="font-size: 13px; color: #475569; font-style: italic;">Note: This is an authentic digitally signed electronic certificate valid throughout India under the Information Technology Act, 2000. Physical signature is not required.</p>
                    </div>

                    <div class="cert-footer">
                        <div class="cert-qr-box">
                            <div class="cert-qr-code">🏁</div>
                            <span>Scan to Verify Online</span>
                        </div>

                        <div class="cert-signature-box">
                            <div class="cert-stamp-seal">
                                <span>PANOHAYAT</span>
                                <span>★ SEAL ★</span>
                                <span>VERIFIED</span>
                            </div>
                            <div class="cert-signature-line">
                                <strong>Panchayat Secretary</strong><br>
                                <span style="font-size:11px; color:#64748b;">Competent Verification Officer</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="certCloseFooterBtn">Close</button>
                <button class="primary-btn" id="certPrintBtn" style="width: auto;">🖨️ Print / Save as PDF</button>
            </div>
        </div>
    `;

    modalOverlay.classList.add("active");

    const close = () => {
        modalOverlay.classList.remove("active");
    };

    modalOverlay.querySelector("#certCloseBtn").onclick = close;
    modalOverlay.querySelector("#certCloseFooterBtn").onclick = close;
    modalOverlay.querySelector("#certPrintBtn").onclick = () => {
        window.print();
    };
}
