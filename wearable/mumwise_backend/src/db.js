import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Enable SSL configuration explicitly for your production database provider.
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: true }
    : false
});
