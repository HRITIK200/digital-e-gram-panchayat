// =========================================================================
// MULTILINGUAL INTERNATIONALIZATION ENGINE (English & Hindi / हिंदी)
// =========================================================================

const translations = {
    en: {
        // Navigation & Branding
        portalTitle: "E-Gram Panchayat",
        portalSubtitle: "Ministry of Panchayati Raj | Digital India",
        navHome: "Home",
        navServices: "Services",
        navTracker: "Track Status",
        navNotices: "Village Notices",
        navMetrics: "Portal Impact",
        navWorkflow: "How It Works",
        navTrust: "Security",
        navLogin: "Sign In",
        navRegister: "Register Citizen",
        navLogout: "Logout",
        
        // Hero
        heroBadge: "Over 250,000+ Gram Panchayats Digitally Connected",
        heroTitleLine1: "Digital Governance for Rural India",
        heroTitleLine2: "Transparent, Fast & Paperless",
        heroDesc: "Apply online for official certificates, welfare pensions, and local licenses directly from home. Track real-time progress and download digitally signed, verified certificates.",
        heroSearchPlaceholder: "Search service: Birth Certificate, Income Proof, Old Age Pension, Domicile...",
        heroSearchBtn: "Search Services",
        heroPopular: "Popular:",
        heroCtaApply: "Apply for Services Now →",
        heroCtaExplore: "Explore 15+ Services",

        // Quick Tracker
        trackerTitle: "Quick Application Status Tracker",
        trackerDesc: "Check the live verification progress of your Panchayat application instantly without logging in.",
        trackerInputPlaceholder: "Enter Application Reference ID (e.g. 1, 2, 3...)",
        trackerBtn: "Track Status",

        // Notices
        noticesTitle: "Gram Sabha Announcements & Circulars",
        noticesSubtitle: "Official village resolutions, meeting notices, and citizen welfare schemes",
        urgentBadge: "URGENT NOTICE",

        // Citizen Dashboard
        greetingHello: "Namaste",
        dashboardCitizenSubtitle: "Welcome to your Gram Panchayat digital counter. Apply for official certificates, welfare grants, and download verified e-documents.",
        tabAvailableServices: "Available Services",
        tabMyApplications: "My Applications",
        tabGrievances: "Grievance Redressal",
        tabNotices: "Panchayat Notices",
        tabSettings: "Profile Settings",
        filterAll: "All Files",
        filterPending: "In Review",
        filterApproved: "Approved",
        filterRejected: "Rejected",
        btnApplyNow: "Apply Now →",
        btnViewCertificate: "📜 View / Print e-Certificate",
        btnShowTimeline: "Show Status Timeline",
        btnHideTimeline: "Hide Status Timeline",
        freeService: "Free Service",
        turnaroundTime: "2-3 Working Days",

        // Grievances
        grievanceTitle: "Register a Citizen Grievance",
        grievanceDesc: "Report village infrastructure issues, drinking water disruptions, sanitation problems, or service delays directly to the Panchayat Secretariat.",
        grievanceSubject: "Grievance Subject",
        grievanceCategory: "Issue Category",
        grievanceDetails: "Detailed Description of the Issue",
        btnSubmitGrievance: "Submit Grievance →",

        // Officer / Staff Desk
        officerDeskTitle: "Verification Officer Desk",
        kpiPending: "Pending Verification",
        kpiApproved: "Approved & Issued",
        kpiRejected: "Rejected / Discrepancy",
        btnExportCsv: "📊 Export to CSV",
        btnApprove: "✓ Verify & Approve",
        btnReject: "✕ Reject Application",
        btnViewDocs: "📎 View Attached Proof",

        // Admin Console
        adminTitle: "Central Administration Console",
        createServiceTitle: "Publish New Panchayat Service",
        btnPublishService: "Publish Service to Portal →",
        userRolesTitle: "User Roles & Permissions",
        auditTrailTitle: "System Audit Trail",

        // Auth & Demo
        loginHeaderTitle: "Sign in to Portal",
        loginHeaderSubtitle: "Enter your credentials or use 1-click demo login below",
        demoTitle: "⚡ 1-Click Fast Demo Login",
        demoDesc: "Click any role below to pre-fill credentials and test instantly:",
        roleCitizen: "Citizen",
        roleStaff: "Verification Officer",
        roleAdmin: "System Admin",
        labelEmail: "Email Address",
        labelPassword: "Password",
        labelFullName: "Full Official Name",
        labelSelectRole: "Account Role",
        btnLoginSubmit: "Sign In to Dashboard →",
        btnRegisterSubmit: "Create Account & Continue →",
        linkNoAccount: "Don't have an account yet? Register as Citizen",
        linkHaveAccount: "Already registered? Sign In Here",

        // Common
        loading: "Loading...",
        currentLang: "English",
        switchLangText: "🌐 हिंदी"
    },
    hi: {
        // Navigation & Branding
        portalTitle: "ई-ग्राम पंचायत",
        portalSubtitle: "पंचायती राज मंत्रालय | डिजिटल इंडिया",
        navHome: "मुख्य पृष्ठ",
        navServices: "नागरिक सेवाएं",
        navTracker: "आवेदन स्थिति",
        navNotices: "ग्राम सूचनाएं",
        navMetrics: "पोर्टल प्रभाव",
        navWorkflow: "प्रक्रिया",
        navTrust: "सुरक्षा",
        navLogin: "लॉग इन",
        navRegister: "नागरिक पंजीकरण",
        navLogout: "लॉगआउट",
        
        // Hero
        heroBadge: "देशभर में 2,50,000+ ग्राम पंचायतें डिजिटल रूप से जुड़ीं",
        heroTitleLine1: "ग्रामीण भारत के लिए डिजिटल सुशासन",
        heroTitleLine2: "पारदर्शी, तीव्र एवं कागज़ रहित",
        heroDesc: "घर बैठे सरकारी प्रमाण पत्रों, पेंशन और योजनाओं के लिए ऑनलाइन आवेदन करें। वास्तविक समय में स्थिति ट्रैक करें और डिजिटल रूप से हस्ताक्षरित प्रमाण पत्र प्राप्त करें।",
        heroSearchPlaceholder: "सेवा खोजें: जन्म प्रमाण पत्र, आय प्रमाण पत्र, वृद्धावस्था पेंशन, निवास...",
        heroSearchBtn: "सेवाएं खोजें",
        heroPopular: "लोकप्रिय:",
        heroCtaApply: "अभी ऑनलाइन आवेदन करें →",
        heroCtaExplore: "15+ सेवाएं देखें",

        // Quick Tracker
        trackerTitle: "त्वरित आवेदन स्थिति ट्रैकर",
        trackerDesc: "लॉगिन किए बिना अपने ग्राम पंचायत आवेदन की वास्तविक स्थिति तुरंत जांचें।",
        trackerInputPlaceholder: "आवेदन संदर्भ संख्या दर्ज करें (उदा. 1, 2, 3...)",
        trackerBtn: "स्थिति ट्रैक करें",

        // Notices
        noticesTitle: "ग्राम सभा सूचनाएं एवं परिपत्र",
        noticesSubtitle: "आधिकारिक ग्राम निर्णय, बैठक सूचनाएं एवं कल्याणकारी योजनाएं",
        urgentBadge: "अति आवश्यक सूचना",

        // Citizen Dashboard
        greetingHello: "नमस्ते",
        dashboardCitizenSubtitle: "आपके ग्राम पंचायत डिजिटल केंद्र में आपका स्वागत है। प्रमाण पत्रों के लिए आवेदन करें और सत्यापित ई-दस्तावेज डाउनलोड करें।",
        tabAvailableServices: "उपलब्ध सेवाएं",
        tabMyApplications: "मेरे आवेदन",
        tabGrievances: "शिकायत निवारण",
        tabNotices: "पंचायत सूचनाएं",
        tabSettings: "प्रोफाइल सेटिंग्स",
        filterAll: "सभी फाइलें",
        filterPending: "प्रक्रियाधीन",
        filterApproved: "स्वीकृत",
        filterRejected: "अस्वीकृत",
        btnApplyNow: "आवेदन करें →",
        btnViewCertificate: "📜 प्रमाण पत्र देखें / प्रिंट करें",
        btnShowTimeline: "स्थिति समयरेखा देखें",
        btnHideTimeline: "समयरेखा छिपाएं",
        freeService: "निःशुल्क सेवा",
        turnaroundTime: "2-3 कार्य दिवस",

        // Grievances
        grievanceTitle: "नागरिक शिकायत दर्ज करें",
        grievanceDesc: "गांव की पेयजल आपूर्ति, स्वच्छता, सड़क मरम्मत या सेवा में देरी की सीधी शिकायत पंचायत सचिवालय में दर्ज कराएं।",
        grievanceSubject: "शिकायत का विषय",
        grievanceCategory: "समस्या की श्रेणी",
        grievanceDetails: "समस्या का विस्तृत विवरण",
        btnSubmitGrievance: "शिकायत दर्ज करें →",

        // Officer / Staff Desk
        officerDeskTitle: "सत्यापन अधिकारी डेस्क",
        kpiPending: "लंबित सत्यापन",
        kpiApproved: "स्वीकृत एवं जारी",
        kpiRejected: "अस्वीकृत / त्रुटिपूर्ण",
        btnExportCsv: "📊 सीएसवी में डाउनलोड करें",
        btnApprove: "✓ सत्यापित एवं स्वीकृत करें",
        btnReject: "✕ आवेदन अस्वीकृत करें",
        btnViewDocs: "📎 संलग्न प्रमाण देखें",

        // Admin Console
        adminTitle: "केंद्रीय प्रशासन कंसोल",
        createServiceTitle: "नई पंचायत सेवा प्रकाशित करें",
        btnPublishService: "पोर्टल पर सेवा प्रकाशित करें →",
        userRolesTitle: "उपयोगकर्ता भूमिकाएं एवं अनुमतियां",
        auditTrailTitle: "सिस्टम ऑडिट ट्रेल",

        // Auth & Demo
        loginHeaderTitle: "पोर्टल में प्रवेश करें",
        loginHeaderSubtitle: "अपना विवरण दर्ज करें या त्वरित 1-क्लिक डेमो लॉगिन चुनें",
        demoTitle: "⚡ त्वरित 1-क्लिक डेमो लॉगिन",
        demoDesc: "तुरंत परीक्षण करने के लिए किसी भी भूमिका पर क्लिक करें:",
        roleCitizen: "नागरिक (Citizen)",
        roleStaff: "सत्यापन अधिकारी (Staff)",
        roleAdmin: "सिस्टम एडमिन (Admin)",
        labelEmail: "ईमेल पता",
        labelPassword: "पासवर्ड",
        labelFullName: "पूरा आधिकारिक नाम",
        labelSelectRole: "खाता भूमिका",
        btnLoginSubmit: "डैशबोर्ड में प्रवेश करें →",
        btnRegisterSubmit: "नया खाता बनाएं →",
        linkNoAccount: "खाता नहीं है? नागरिक के रूप में पंजीकृत हों",
        linkHaveAccount: "पहले से पंजीकृत हैं? यहां लॉगिन करें",

        // Common
        loading: "लोड हो रहा है...",
        currentLang: "हिंदी",
        switchLangText: "🌐 English"
    }
};

let currentLang = localStorage.getItem("egram_language") || "en";

export function getCurrentLanguage() {
    return currentLang;
}

export function t(key) {
    if (translations[currentLang] && translations[currentLang][key]) {
        return translations[currentLang][key];
    }
    if (translations.en && translations.en[key]) {
        return translations.en[key];
    }
    return key;
}

export function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("egram_language", lang);
    document.documentElement.lang = lang;

    // 1. Text translations
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        const val = t(key);
        if (val) {
            // If element has a dedicated text span, update it; otherwise update direct text
            const textSpan = el.querySelector(".i18n-text");
            if (textSpan) {
                textSpan.innerText = val;
            } else if (el.children.length === 0) {
                el.innerText = val;
            } else {
                // If it has icon children, preserve first child icon
                const firstChild = el.firstElementChild;
                if (firstChild && (firstChild.tagName === "SPAN" || firstChild.tagName === "I") && el.childNodes.length > 1) {
                    el.childNodes[el.childNodes.length - 1].textContent = " " + val;
                } else {
                    el.innerText = val;
                }
            }
        }
    });

    // 2. Placeholder translations
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        const val = t(key);
        if (val) {
            el.setAttribute("placeholder", val);
        }
    });

    // 3. Update all language buttons on the page with segmented indicator
    updateLanguageButtons();

    // 4. Notify all components
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang } }));
}

function updateLanguageButtons() {
    document.querySelectorAll(".lang-toggle-btn").forEach(btn => {
        btn.innerHTML = `
            <span class="lang-globe">🌐</span>
            <span class="lang-segment ${currentLang === 'en' ? 'active' : ''}">EN</span>
            <span class="lang-divider">|</span>
            <span class="lang-segment ${currentLang === 'hi' ? 'active' : ''}">हिंदी</span>
        `;
        btn.setAttribute("title", currentLang === 'en' ? "Switch to Hindi (हिंदी में देखें)" : "Switch to English");
    });
}

export function toggleLanguage() {
    const next = currentLang === "en" ? "hi" : "en";
    applyLanguage(next);
}

export function initLanguage(btnSelector = ".lang-toggle-btn") {
    // Bind to all buttons matching selector or id
    const buttons = document.querySelectorAll(btnSelector.startsWith("#") || btnSelector.startsWith(".") ? btnSelector : `#${btnSelector}, .${btnSelector}`);
    buttons.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleLanguage();
        };
    });

    // Apply stored language
    applyLanguage(currentLang);
}

// Auto-run if DOM is ready
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => updateLanguageButtons());
    } else {
        updateLanguageButtons();
    }
}
