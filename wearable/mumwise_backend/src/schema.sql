CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_connections (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('apple_health', 'health_connect', 'manufacturer_api', 'medical_device', 'demo')),
  display_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('connected', 'syncing', 'needs_permission', 'interrupted', 'partial_data', 'disconnected', 'error')),
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  scope JSONB NOT NULL,
  clinician_sharing BOOLEAN NOT NULL DEFAULT FALSE,
  history_days INTEGER NOT NULL DEFAULT 7 CHECK (history_days IN (7, 30, 90)),
  consent_version TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS measurements (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  device_connection_id UUID REFERENCES device_connections(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('heart_rate', 'hrv', 'steps', 'sleep_hours', 'spo2', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'temperature')),
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_label TEXT NOT NULL,
  quality_status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (quality_status IN ('unreviewed', 'valid', 'incomplete', 'suspect')),
  external_record_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, source_label, external_record_id)
);

CREATE INDEX IF NOT EXISTS measurements_patient_metric_time_idx
  ON measurements(patient_id, metric_type, measured_at DESC);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
