import pg from "pg";
import fs from "fs";

const { Client } = pg;

const COMMON_PASSWORDS = ["postgres", "admin", "root", "password", "1234", ""];
const TARGET_DB = "digital_egram_db";

async function tryConnect(password) {
    const client = new Client({
        host: "localhost",
        port: 5432,
        user: "postgres",
        password: password,
        database: "postgres",
        connectionTimeoutMillis: 2000 // 2 seconds timeout
    });
    try {
        await client.connect();
        return client;
    } catch (err) {
        return null;
    }
}

async function run() {
    let client = null;
    let workingPassword = null;
    
    console.log("Searching for working local PostgreSQL password...");
    for (const pwd of COMMON_PASSWORDS) {
        console.log(`Trying password: "${pwd}"...`);
        client = await tryConnect(pwd);
        if (client) {
            workingPassword = pwd;
            break;
        }
    }
    
    if (!client) {
        console.error("\n[Error] Could not connect to PostgreSQL. Tested common passwords: " + COMMON_PASSWORDS.map(p => `"${p}"`).join(", "));
        console.error("Please ensure PostgreSQL is running and you have the correct password.");
        process.exit(1);
    }
    
    console.log(`\n[Success] Connected successfully using password: "${workingPassword}"`);
    
    try {
        // Create target database if not exists
        const dbCheck = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [TARGET_DB]);
        if (dbCheck.rows.length === 0) {
            console.log(`Creating database "${TARGET_DB}"...`);
            await client.query(`CREATE DATABASE ${TARGET_DB}`);
        } else {
            console.log(`Database "${TARGET_DB}" already exists.`);
        }
        await client.end();
        
        // Connect to target database
        const targetClient = new Client({
            host: "localhost",
            port: 5432,
            user: "postgres",
            password: workingPassword,
            database: TARGET_DB
        });
        await targetClient.connect();
        
        console.log("Creating tables...");
        
        // Users Table
        await targetClient.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'user',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Services Table
        await targetClient.query(`
            CREATE TABLE IF NOT EXISTS services (
                id SERIAL PRIMARY KEY,
                service_name VARCHAR(100) NOT NULL,
                service_description TEXT NOT NULL,
                created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Applications Table
        await targetClient.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                user_name VARCHAR(100) NOT NULL,
                service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
                service_name VARCHAR(100) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'Pending',
                details TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Logs Table
        await targetClient.query(`
            CREATE TABLE IF NOT EXISTS logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                action TEXT NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log("[Success] All tables created successfully.");
        await targetClient.end();
        
        // Write env file
        const envContent = `DATABASE_URL=postgresql://postgres:${workingPassword}@localhost:5432/${TARGET_DB}
JWT_SECRET=digital_egram_secret_jwt_key_2026
PORT=5000
NODE_ENV=development
`;
        fs.writeFileSync(".env", envContent);
        console.log("[Success] Local .env configuration file generated successfully.");
        
    } catch (err) {
        console.error("[Error] Database setup failed:", err);
        process.exit(1);
    }
}

run();
