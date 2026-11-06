import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import crypto from "node:crypto";
import { z } from "zod";
import { pool } from "./db.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const PATIENT_ID = "11111111-1111-4111-8111-111111111111"; // DEMO ONLY: replace with authenticated identity.
const uuid = () => crypto.randomUUID();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "256kb" }));

const allowedMetrics = [
  "heart_rate", "hrv", "steps", "sleep_hours", "spo2",
  "blood_pressure_systolic", "blood_pressure_diastolic", "temperature"
];

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

async function audit(eventType, details = {}) {
  await pool.query(
    `INSERT INTO audit_events (id, patient_id, actor_type, event_type, details)
     VALUES ($1, $2, 'demo_user', $3, $4)`,
    [uuid(), PATIENT_ID, eventType, JSON.stringify(details)]
  );
}

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "mumwise-wearables-api" }));

app.get("/api/devices", asyncRoute(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, source_type, display_name, status, permissions,
            connected_at, last_sync_at, created_at, updated_at
     FROM device_connections WHERE patient_id = $1 ORDER BY created_at DESC`,
    [PATIENT_ID]
  );
  res.json({ devices: rows });
}));

app.post("/api/devices/demo-connect", asyncRoute(async (req, res) => {
  const schema = z.object({
    sourceType: z.enum(["apple_health", "health_connect", "manufacturer_api", "medical_device", "demo"]),
    displayName: z.string().trim().min(2).max(120),
    permissions: z.array(z.enum(allowedMetrics)).max(8).default([])
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid device request", details: parsed.error.flatten() });

  const { sourceType, displayName, permissions } = parsed.data;
  const id = uuid();
  const now = new Date().toISOString();
  await pool.query(
    `INSERT INTO device_connections
      (id, patient_id, source_type, display_name, status, permissions, connected_at, last_sync_at)
     VALUES ($1, $2, $3, $4, 'connected', $5, $6, $6)`,
    [id, PATIENT_ID, sourceType, displayName, JSON.stringify(permissions), now]
  );
  await audit("demo_device_connected", { deviceId: id, sourceType, permissionCount: permissions.length });
  res.status(201).json({
    device: { id, source_type: sourceType, display_name: displayName, status: "connected", permissions, connected_at: now, last_sync_at: now },
    warning: "Demo connection only. No real device authorization or data sync occurred."
  });
}));

app.post("/api/devices/:id/disconnect", asyncRoute(async (req, res) => {
  const { rowCount } = await pool.query(
    `UPDATE device_connections SET status = 'disconnected', updated_at = NOW()
     WHERE id = $1 AND patient_id = $2`,
    [req.params.id, PATIENT_ID]
  );
  if (!rowCount) return res.status(404).json({ error: "Device not found" });
  await audit("device_disconnected", { deviceId: req.params.id });
  res.json({ ok: true, message: "Marked disconnected. Production adapter must also revoke/stop upstream sync where supported." });
}));

app.get("/api/measurements", asyncRoute(async (req, res) => {
  const metric = String(req.query.metric || "");
  const days = Math.min(90, Math.max(1, Number(req.query.days || 7)));
  if (!allowedMetrics.includes(metric)) return res.status(400).json({ error: "Unsupported metric", allowedMetrics });
  const { rows } = await pool.query(
    `SELECT id, metric_type, value, unit, measured_at, received_at, source_label,
            quality_status, metadata
     FROM measurements
     WHERE patient_id = $1 AND metric_type = $2
       AND measured_at >= NOW() - ($3::text || ' days')::interval
     ORDER BY measured_at ASC`,
    [PATIENT_ID, metric, days]
  );
  res.json({ metric, days, measurements: rows });
}));

app.post("/api/measurements", asyncRoute(async (req, res) => {
  // Demo ingestion endpoint. Production ingestion must authenticate the source,
  // verify consent, validate provenance, and prevent arbitrary client submissions.
  const schema = z.object({
    deviceConnectionId: z.string().uuid().nullable().optional(),
    metricType: z.enum(allowedMetrics),
    value: z.number().finite(),
    unit: z.string().trim().min(1).max(20),
    measuredAt: z.string().datetime(),
    sourceLabel: z.string().trim().min(1).max(100),
    externalRecordId: z.string().max(200).optional(),
    qualityStatus: z.enum(["unreviewed", "valid", "incomplete", "suspect"]).default("unreviewed"),
    metadata: z.record(z.unknown()).default({})
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid measurement", details: parsed.error.flatten() });

  const m = parsed.data;
  if (m.metricType === "spo2" && (m.value < 0 || m.value > 100)) {
    return res.status(400).json({ error: "SpO₂ must be between 0 and 100." });
  }
  if (m.metricType === "steps" && m.value < 0) {
    return res.status(400).json({ error: "Steps cannot be negative." });
  }

  const id = uuid();
  const { rows } = await pool.query(
    `INSERT INTO measurements
      (id, patient_id, device_connection_id, metric_type, value, unit, measured_at,
       source_label, quality_status, external_record_id, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (patient_id, source_label, external_record_id)
     DO UPDATE SET received_at = NOW()
     RETURNING id, metric_type, value, unit, measured_at, received_at, source_label, quality_status`,
    [id, PATIENT_ID, m.deviceConnectionId || null, m.metricType, m.value, m.unit,
     m.measuredAt, m.sourceLabel, m.qualityStatus, m.externalRecordId || null, JSON.stringify(m.metadata)]
  );
  await audit("measurement_ingested_demo", { metricType: m.metricType, sourceLabel: m.sourceLabel });
  res.status(201).json({ measurement: rows[0], warning: "Demo endpoint; production ingestion requires authenticated trusted adapters." });
}));

app.get("/api/consent", asyncRoute(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, scope, clinician_sharing, history_days, consent_version, granted_at, withdrawn_at
     FROM consent_records WHERE patient_id = $1 ORDER BY granted_at DESC`,
    [PATIENT_ID]
  );
  res.json({ consents: rows });
}));

app.post("/api/consent", asyncRoute(async (req, res) => {
  const schema = z.object({
    scope: z.array(z.enum(allowedMetrics)).max(8),
    clinicianSharing: z.boolean(),
    historyDays: z.union([z.literal(7), z.literal(30), z.literal(90)]),
    consentVersion: z.string().trim().min(1).max(40)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid consent", details: parsed.error.flatten() });
  const c = parsed.data;
  const id = uuid();
  await pool.query(
    `INSERT INTO consent_records (id, patient_id, scope, clinician_sharing, history_days, consent_version)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, PATIENT_ID, JSON.stringify(c.scope), c.clinicianSharing, c.historyDays, c.consentVersion]
  );
  await audit("consent_granted_demo", { consentId: id, scope: c.scope, clinicianSharing: c.clinicianSharing });
  res.status(201).json({ id, saved: true, note: "Demo consent record only; production must bind this to authenticated patient identity and legal consent flows." });
}));

app.get("/api/clinician-summary", asyncRoute(async (req, res) => {
  const days = Math.min(90, Math.max(1, Number(req.query.days || 7)));
  const consentResult = await pool.query(
    `SELECT scope, clinician_sharing FROM consent_records
     WHERE patient_id = $1 AND withdrawn_at IS NULL
     ORDER BY granted_at DESC LIMIT 1`,
    [PATIENT_ID]
  );
  const consent = consentResult.rows[0];
  if (!consent?.clinician_sharing) {
    return res.status(403).json({ error: "Clinician sharing has not been enabled in the latest active consent." });
  }

  const { rows } = await pool.query(
    `SELECT metric_type, unit, COUNT(*)::int AS count,
            AVG(value)::float AS mean, MIN(value)::float AS min,
            MAX(value)::float AS max,
            MIN(measured_at) AS first_measurement,
            MAX(measured_at) AS last_measurement,
            COUNT(DISTINCT DATE(measured_at))::int AS days_with_data
     FROM measurements
     WHERE patient_id = $1
       AND metric_type = ANY($2::text[])
       AND measured_at >= NOW() - ($3::text || ' days')::interval
       AND quality_status IN ('valid', 'unreviewed')
     GROUP BY metric_type, unit
     ORDER BY metric_type`,
    [PATIENT_ID, consent.scope, days]
  );
  const summary = {
    generatedAt: new Date().toISOString(),
    periodDays: days,
    disclaimer: "Automatically generated summary for clinician review; not a diagnosis or treatment recommendation.",
    metrics: rows
  };
  await audit("clinician_summary_generated", { days, metricCount: rows.length });
  res.json(summary);
}));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => console.log(`MumWise API listening on http://localhost:${PORT}`));
