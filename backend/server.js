import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import db from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "digital_egram_secret_jwt_key_2026";

// Middlewares with increased payload capacity for document attachments
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// =========================================================================
// RUN MIGRATIONS
// =========================================================================
async function runMigrations() {
    try {
        await db.query("ALTER TABLE applications ADD COLUMN IF NOT EXISTS feedback TEXT;");
        await db.query("ALTER TABLE applications ADD COLUMN IF NOT EXISTS documents TEXT;");
        
        // Notifications Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Public Notices & Circulars Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS notices (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(100) DEFAULT 'General',
                is_urgent BOOLEAN DEFAULT FALSE,
                created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Citizen Grievance Redressal Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS grievances (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                user_name VARCHAR(255),
                subject VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'Submitted',
                resolution_notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Seed Sample Notices if table is empty
        const noticeCheck = await db.query("SELECT COUNT(*) FROM notices;");
        if (parseInt(noticeCheck.rows[0].count) === 0) {
            await db.query(`
                INSERT INTO notices (title, content, category, is_urgent) VALUES
                ('Upcoming Gram Sabha Quarterly Assembly Meeting', 'All village residents are cordially invited to attend the Gram Sabha session on Sunday at 10:00 AM in the Panchayat Community Hall to discuss village water drainage and solar electrification projects.', 'Assembly', TRUE),
                ('Special Aadhaar & DigiLocker e-KYC Linkage Drive', 'A dedicated facilitation camp is set up in Panchayat Bhavan from 10:00 AM to 5:00 PM for linking mobile numbers with Aadhaar cards and enrolling in DigiLocker for instant digital certificates.', 'Camp', FALSE),
                ('Subsidized Organic Fertilizer & Seed Distribution Scheme', 'Farmers registered under the PM-Kisan scheme can collect certified seasonal seeds and organic fertilizer bags at 50% state subsidy from the Village Cooperative Godown.', 'Agriculture', FALSE);
            `);
        }
        
        // Seed Standard Demo Users if not present
        const demoUsers = [
            { email: "citizen@egram.gov.in", password: "citizen123", role: "user", fullName: "Ramesh Kumar (Citizen)" },
            { email: "staff@egram.gov.in", password: "staff123", role: "staff", fullName: "Sunita Sharma (Verification Officer)" },
            { email: "admin@egram.gov.in", password: "admin123", role: "admin", fullName: "Vikram Singh (System Admin)" }
        ];

        for (const du of demoUsers) {
            const existing = await db.query("SELECT id FROM users WHERE email = $1", [du.email]);
            if (existing.rows.length === 0) {
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash(du.password, salt);
                await db.query(
                    "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4)",
                    [du.fullName, du.email, hash, du.role]
                );
                console.log(`Demo account created: ${du.email}`);
            }
        }

        console.log("Database migrations and demo accounts verified successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    }
}
runMigrations();

// =========================================================================
// HELPER LOG METHOD
// =========================================================================
async function internalLog(userId, action) {
    try {
        await db.query(
            "INSERT INTO logs (user_id, action) VALUES ($1, $2)",
            [userId, action]
        );
    } catch (err) {
        console.error("Internal logging error:", err);
    }
}

// =========================================================================
// AUTHENTICATION MIDDLEWARES
// =========================================================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access Token Required" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or Expired Token" });
        }
        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }
    next();
}

function requireStaff(req, res, next) {
    if (req.user.role !== "staff" && req.user.role !== "admin") {
        return res.status(403).json({ message: "Staff or Admin access required" });
    }
    next();
}

// =========================================================================
// API ROUTES
// =========================================================================

// 1. Auth - Register
app.post("/api/auth/register", async (req, res) => {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const assignedRole = role && ["user", "staff", "admin"].includes(role) ? role : "user";

    try {
        // Check if user exists
        const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: "Email is already registered" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const result = await db.query(
            "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role",
            [fullName, email, hashedPassword, assignedRole]
        );
        const newUser = result.rows[0];

        // System Log
        await internalLog(newUser.id, `User registered: ${newUser.email} (${newUser.role})`);

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error during registration" });
    }
});

// 2. Auth - Login
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, fullName: user.full_name },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // System Log
        await internalLog(user.id, `User login: ${user.email}`);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error during login" });
    }
});

// 3. Auth - Current User Details
app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
        const result = await db.query("SELECT id, full_name, email, role, created_at FROM users WHERE id = $1", [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching user" });
    }
});

// 4. Auth - Update Profile (Full Name)
app.put("/api/auth/profile", authenticateToken, async (req, res) => {
    const { fullName } = req.body;
    if (!fullName) {
        return res.status(400).json({ message: "Full Name is required" });
    }

    try {
        const result = await db.query(
            "UPDATE users SET full_name = $1 WHERE id = $2 RETURNING id, full_name, email, role",
            [fullName, req.user.id]
        );

        await internalLog(req.user.id, "Updated profile name to: " + fullName);

        res.json({ message: "Profile updated successfully", user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update profile" });
    }
});

// 5. System - Enhanced Stats Breakdown
app.get("/api/stats", async (req, res) => {
    try {
        const userCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'user'");
        const serviceCount = await db.query("SELECT COUNT(*) FROM services");
        const appCount = await db.query("SELECT COUNT(*) FROM applications");
        const approvedCount = await db.query("SELECT COUNT(*) FROM applications WHERE status = 'Approved'");
        const pendingCount = await db.query("SELECT COUNT(*) FROM applications WHERE status = 'Pending'");
        const rejectedCount = await db.query("SELECT COUNT(*) FROM applications WHERE status = 'Rejected'");
        const noticeCount = await db.query("SELECT COUNT(*) FROM notices");
        const grievanceCount = await db.query("SELECT COUNT(*) FROM grievances");
        
        res.json({
            citizens: parseInt(userCount.rows[0].count),
            services: parseInt(serviceCount.rows[0].count),
            applications: parseInt(appCount.rows[0].count),
            approved: parseInt(approvedCount.rows[0].count),
            pending: parseInt(pendingCount.rows[0].count),
            rejected: parseInt(rejectedCount.rows[0].count),
            notices: parseInt(noticeCount.rows[0].count),
            grievances: parseInt(grievanceCount.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load stats" });
    }
});

// 6. Services - Get All
app.get("/api/services", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM services ORDER BY service_name ASC");
        res.json({ services: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load services" });
    }
});

// 7. Services - Create (Admin Only)
app.post("/api/services", authenticateToken, requireAdmin, async (req, res) => {
    const { serviceName, serviceDescription } = req.body;

    if (!serviceName || !serviceDescription) {
        return res.status(400).json({ message: "Name and description are required" });
    }

    try {
        const result = await db.query(
            "INSERT INTO services (service_name, service_description, created_by) VALUES ($1, $2, $3) RETURNING *",
            [serviceName, serviceDescription, req.user.id]
        );
        const newService = result.rows[0];

        // System Log
        await internalLog(req.user.id, "Service Created: " + serviceName);

        res.status(201).json({ message: "Service created successfully", service: newService });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create service" });
    }
});

// 8. Services - Delete (Admin Only)
app.delete("/api/services/:id", authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const serviceCheck = await db.query("SELECT service_name FROM services WHERE id = $1", [id]);
        if (serviceCheck.rows.length === 0) {
            return res.status(404).json({ message: "Service not found" });
        }
        const serviceName = serviceCheck.rows[0].service_name;

        await db.query("DELETE FROM services WHERE id = $1", [id]);

        // System Log
        await internalLog(req.user.id, "Service Deleted: " + serviceName);

        res.json({ message: "Service deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete service" });
    }
});

// 9. Applications - Public Tracking by Reference ID (No login required)
app.get("/api/applications/track/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            "SELECT id, service_name, status, details, feedback, created_at FROM applications WHERE id = $1",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: `No application found matching reference #${id}` });
        }
        res.json({ application: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to track application" });
    }
});

// 10. Applications - Get All (User gets own, Staff/Admin gets all)
app.get("/api/applications", authenticateToken, async (req, res) => {
    try {
        let result;
        if (req.user.role === "user") {
            result = await db.query(
                "SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at DESC",
                [req.user.id]
            );
        } else {
            result = await db.query("SELECT * FROM applications ORDER BY created_at DESC");
        }
        res.json({ applications: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load applications" });
    }
});

// 11. Applications - Submit Application with Document Attachments (Citizens only)
app.post("/api/applications", authenticateToken, async (req, res) => {
    const { serviceId, serviceName, details, documents } = req.body;

    if (!serviceId || !serviceName || !details) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const dupCheck = await db.query(
            "SELECT id FROM applications WHERE user_id = $1 AND service_id = $2",
            [req.user.id, serviceId]
        );
        if (dupCheck.rows.length > 0) {
            return res.status(400).json({ message: "You have already applied for this service" });
        }

        const docsJson = documents ? (typeof documents === "string" ? documents : JSON.stringify(documents)) : null;

        const result = await db.query(
            "INSERT INTO applications (user_id, user_name, service_id, service_name, details, documents) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [req.user.id, req.user.fullName, serviceId, serviceName, details, docsJson]
        );
        const newApp = result.rows[0];

        // System Log
        await internalLog(req.user.id, "Applied for Service: " + serviceName + (documents ? " (With Documents)" : ""));

        res.status(201).json({ message: "Application submitted successfully", application: newApp });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to submit application" });
    }
});

// 12. Applications - Update Status with Feedback (Staff Only)
app.put("/api/applications/:id/status", authenticateToken, requireStaff, async (req, res) => {
    const { id } = req.params;
    const { status, feedback } = req.body;

    if (!status || !["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({ message: "Valid status ('Approved' or 'Rejected') is required" });
    }

    try {
        const appCheck = await db.query("SELECT user_id, service_name FROM applications WHERE id = $1", [id]);
        if (appCheck.rows.length === 0) {
            return res.status(404).json({ message: "Application not found" });
        }
        const appData = appCheck.rows[0];

        await db.query(
            "UPDATE applications SET status = $1, feedback = $2 WHERE id = $3",
            [status, feedback || null, id]
        );

        // Insert notification for citizen
        const alertMsg = `Your application for "${appData.service_name}" has been ${status}. Remarks: ${feedback || "None"}`;
        await db.query(
            "INSERT INTO notifications (user_id, message) VALUES ($1, $2)",
            [appData.user_id, alertMsg]
        );

        // System Log
        await internalLog(req.user.id, `Application for ${appData.service_name} updated to ${status}. Feedback: ${feedback || "None"}`);

        res.json({ message: `Application status updated to ${status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update status" });
    }
});

// 13. Public Notices - Get All Notices
app.get("/api/notices", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM notices ORDER BY is_urgent DESC, created_at DESC");
        res.json({ notices: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch notices" });
    }
});

// 14. Notices - Create Notice (Admin Only)
app.post("/api/notices", authenticateToken, requireAdmin, async (req, res) => {
    const { title, content, category, isUrgent } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: "Notice title and content are required" });
    }

    try {
        const result = await db.query(
            "INSERT INTO notices (title, content, category, is_urgent, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [title, content, category || "General", !!isUrgent, req.user.id]
        );

        await internalLog(req.user.id, `Notice Created: "${title}"`);
        res.status(201).json({ message: "Notice published successfully", notice: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to publish notice" });
    }
});

// 15. Notices - Delete Notice (Admin Only)
app.delete("/api/notices/:id", authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM notices WHERE id = $1", [id]);
        await internalLog(req.user.id, `Deleted notice #${id}`);
        res.json({ message: "Notice deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete notice" });
    }
});

// 16. Grievances - Get All (User gets own, Staff & Admin get all)
app.get("/api/grievances", authenticateToken, async (req, res) => {
    try {
        let result;
        if (req.user.role === "user") {
            result = await db.query(
                "SELECT * FROM grievances WHERE user_id = $1 ORDER BY created_at DESC",
                [req.user.id]
            );
        } else {
            result = await db.query("SELECT * FROM grievances ORDER BY created_at DESC");
        }
        res.json({ grievances: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch grievances" });
    }
});

// 17. Grievances - File Grievance (Citizens only)
app.post("/api/grievances", authenticateToken, async (req, res) => {
    const { subject, category, description } = req.body;

    if (!subject || !category || !description) {
        return res.status(400).json({ message: "Subject, category, and description are required" });
    }

    try {
        const result = await db.query(
            "INSERT INTO grievances (user_id, user_name, subject, category, description) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [req.user.id, req.user.fullName, subject, category, description]
        );
        const newGrievance = result.rows[0];

        await internalLog(req.user.id, `Grievance filed: "${subject}" (${category})`);
        res.status(201).json({ message: "Grievance registered successfully", grievance: newGrievance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to file grievance" });
    }
});

// 18. Grievances - Update Resolution Status (Staff & Admin)
app.put("/api/grievances/:id/status", authenticateToken, requireStaff, async (req, res) => {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    if (!status) {
        return res.status(400).json({ message: "Resolution status is required" });
    }

    try {
        const check = await db.query("SELECT user_id, subject FROM grievances WHERE id = $1", [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: "Grievance not found" });
        }

        await db.query(
            "UPDATE grievances SET status = $1, resolution_notes = $2 WHERE id = $3",
            [status, resolutionNotes || null, id]
        );

        // Notify citizen
        const alertMsg = `Your grievance "${check.rows[0].subject}" status updated to: ${status}. Notes: ${resolutionNotes || "None"}`;
        await db.query(
            "INSERT INTO notifications (user_id, message) VALUES ($1, $2)",
            [check.rows[0].user_id, alertMsg]
        );

        await internalLog(req.user.id, `Grievance #${id} resolved: ${status}`);
        res.json({ message: `Grievance status updated to ${status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update grievance status" });
    }
});

// 19. Admin - Get All Users (Admin Only)
app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC"
        );
        res.json({ users: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch user profiles" });
    }
});

// 20. Admin - Update User Role (Admin Only)
app.put("/api/admin/users/:id/role", authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["user", "staff", "admin"].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
    }

    try {
        const userCheck = await db.query("SELECT email, role FROM users WHERE id = $1", [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        if (parseInt(id) === req.user.id && role !== "admin") {
            return res.status(400).json({ message: "You cannot revoke your own admin permissions." });
        }

        await db.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);

        // System Log
        await internalLog(req.user.id, `User ${userCheck.rows[0].email} role updated from ${userCheck.rows[0].role} to ${role}`);

        res.json({ message: "User role updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update user role" });
    }
});

// 21. Logs - Get System Logs (Admin Only)
app.get("/api/logs", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 50");
        res.json({ logs: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch logs" });
    }
});

// 22. Logs - Write Log (Client-side actions)
app.post("/api/logs", authenticateToken, async (req, res) => {
    const { action } = req.body;

    if (!action) {
        return res.status(400).json({ message: "Action details are required" });
    }

    try {
        await internalLog(req.user.id, action);
        res.json({ message: "Log saved" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to save log" });
    }
});

// 23. Notifications - Get Citizen Alerts
app.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
            [req.user.id]
        );
        res.json({ notifications: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
});

// 24. Notifications - Mark Read
app.put("/api/notifications/read", authenticateToken, async (req, res) => {
    try {
        await db.query(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
            [req.user.id]
        );
        res.json({ message: "All notifications marked as read" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to mark notifications read" });
    }
});

// Startup Server (Conditional check for testing)
if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
