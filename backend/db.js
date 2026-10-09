import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// SSL setting is required for hosted PostgreSQL (like Render, Neon, or Supabase)
const isProduction = process.env.NODE_ENV === "production";
const hasDbUrl = !!process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: hasDbUrl && (process.env.DATABASE_URL.includes("supabase") || isProduction)
    ? { rejectUnauthorized: false }
    : false
});

export default pool;
