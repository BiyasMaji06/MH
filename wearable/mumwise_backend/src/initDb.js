import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(sql);
  // Development-only demo patient. Replace with authenticated user provisioning.
  await pool.query(
    `INSERT INTO patients (id, display_name)
     VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
    ["11111111-1111-4111-8111-111111111111", "Demo MumWise Patient"]
  );
  console.log("Database schema initialized.");
} catch (error) {
  console.error("Database initialization failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
