import request from "supertest";
import app from "../server.js";
import db from "../db.js";

afterAll(async () => {
    await db.end();
});

describe("Panchayat API Endpoints Integration Tests", () => {
    const uniqueId = Date.now();
    const testUserEmail = `citizen_${uniqueId}@example.com`;
    let testToken = "";
    let sampleGrievanceId = null;

    test("1. POST /api/auth/register - Should register a new user successfully", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                fullName: "Test Citizen",
                email: testUserEmail,
                password: "securepassword123",
                role: "user"
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("user");
        expect(response.body.user.email).toBe(testUserEmail);
        expect(response.body.user.role).toBe("user");
    });

    test("2. POST /api/auth/login - Should login and return a valid JWT token", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUserEmail,
                password: "securepassword123"
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("token");
        expect(response.body).toHaveProperty("user");
        expect(response.body.user.email).toBe(testUserEmail);
        testToken = response.body.token;
    });

    test("3. GET /api/auth/me - Should fetch user details with correct token authorization", async () => {
        const response = await request(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.user.email).toBe(testUserEmail);
    });

    test("4. GET /api/services - Should fetch available service templates successfully", async () => {
        const response = await request(app)
            .get("/api/services");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("services");
        expect(Array.isArray(response.body.services)).toBe(true);
    });

    test("5. GET /api/notifications - Should fetch active notification alerts list", async () => {
        const response = await request(app)
            .get("/api/notifications")
            .set("Authorization", `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("notifications");
        expect(Array.isArray(response.body.notifications)).toBe(true);
    });

    test("6. GET /api/notices - Should fetch public village circulars and notices", async () => {
        const response = await request(app)
            .get("/api/notices");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("notices");
        expect(Array.isArray(response.body.notices)).toBe(true);
    });

    test("7. GET /api/stats - Should return comprehensive stats and status breakdown", async () => {
        const response = await request(app)
            .get("/api/stats");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("citizens");
        expect(response.body).toHaveProperty("services");
        expect(response.body).toHaveProperty("applications");
        expect(response.body).toHaveProperty("approved");
        expect(response.body).toHaveProperty("pending");
        expect(response.body).toHaveProperty("notices");
        expect(response.body).toHaveProperty("grievances");
    });

    test("8. POST /api/grievances - Should allow citizen to register a grievance", async () => {
        const response = await request(app)
            .post("/api/grievances")
            .set("Authorization", `Bearer ${testToken}`)
            .send({
                subject: "Water Pipeline Leakage Test",
                category: "Water Supply",
                description: "Clean water pipeline leaking near community well in Ward 3."
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("grievance");
        expect(response.body.grievance.subject).toBe("Water Pipeline Leakage Test");
        sampleGrievanceId = response.body.grievance.id;
    });

    test("9. GET /api/grievances - Should allow citizen to view registered grievances", async () => {
        const response = await request(app)
            .get("/api/grievances")
            .set("Authorization", `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("grievances");
        expect(Array.isArray(response.body.grievances)).toBe(true);
        expect(response.body.grievances.length).toBeGreaterThanOrEqual(1);
    });

    test("10. GET /api/applications/track/:id - Public tracking endpoint returns 404 for non-existent reference", async () => {
        const response = await request(app)
            .get("/api/applications/track/999999");

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("message");
    });
});
