import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const metrics = [
  { key: "heart_rate", label: "Heart rate", unit: "bpm", icon: "♥" },
  { key: "hrv", label: "Heart-rate variability", unit: "ms", icon: "〰" },
  { key: "steps", label: "Daily steps", unit: "steps", icon: "↗" },
  { key: "sleep_hours", label: "Sleep duration", unit: "hours", icon: "☾" },
  { key: "spo2", label: "Blood oxygen", unit: "%", icon: "◉" },
  { key: "blood_pressure_systolic", label: "Systolic blood pressure", unit: "mmHg", icon: "＋" },
  { key: "blood_pressure_diastolic", label: "Diastolic blood pressure", unit: "mmHg", icon: "＋" },
  { key: "temperature", label: "Temperature", unit: "°C", icon: "♨" }
];
const sourceOptions = [
  { value: "apple_health", label: "Apple Health (demo connector)" },
  { value: "health_connect", label: "Health Connect (demo connector)" },
  { value: "medical_device", label: "Medical device (demo connector)" },
  { value: "demo", label: "Demo device" }
];

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function fmt(value, digits = 1) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
}

export default function App() {
  const [devices, setDevices] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState("heart_rate");
  const [days, setDays] = useState(7);
  const [measurements, setMeasurements] = useState([]);
  const [consent, setConsent] = useState([]);
  const [scope, setScope] = useState(["heart_rate", "hrv", "steps", "sleep_hours"]);
  const [clinicianSharing, setClinicianSharing] = useState(false);
  const [historyDays, setHistoryDays] = useState(7);
  const [summary, setSummary] = useState(null);
  const [sourceType, setSourceType] = useState("demo");
  const [deviceName, setDeviceName] = useState("MumWise Demo Wearable");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadDevices() {
    const result = await api("/devices");
    setDevices(result.devices || []);
  }
  async function loadConsent() {
    const result = await api("/consent");
    setConsent(result.consents || []);
    const active = (result.consents || []).find(c => !c.withdrawn_at);
    if (active) {
      setScope(active.scope || []);
      setClinicianSharing(Boolean(active.clinician_sharing));
      setHistoryDays(active.history_days || 7);
    }
  }
  async function loadMeasurements() {
    const result = await api(`/measurements?metric=${selectedMetric}&days=${days}`);
    setMeasurements(result.measurements || []);
  }
  useEffect(() => {
    Promise.all([loadDevices(), loadConsent()]).catch(e => setStatus(e.message));
  }, []);
  useEffect(() => {
    loadMeasurements().catch(e => setStatus(e.message));
  }, [selectedMetric, days]);
  const activeMetric = metrics.find(m => m.key === selectedMetric);
  const latest = measurements.length ? measurements[measurements.length - 1] : null;
  const chartData = useMemo(() => measurements.map(m => ({
    time: new Date(m.measured_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    value: Number(m.value)
  })), [measurements]);

  async function connectDemo(e) {
    e.preventDefault();
    setLoading(true); setStatus("");
    try {
      const result = await api("/devices/demo-connect", {
        method: "POST",
        body: JSON.stringify({ sourceType, displayName: deviceName, permissions: scope })
      });
      await loadDevices();
      setStatus(result.warning || "Demo source added.");
    } catch (e) { setStatus(e.message); }
    finally { setLoading(false); }
  }

  async function disconnect(id) {
    setStatus("");
    try {
      await api(`/devices/${id}/disconnect`, { method: "POST", body: "{}" });
      await loadDevices();
      setStatus("Device marked disconnected. Demo only; a real adapter must also stop upstream sync.");
    } catch (e) { setStatus(e.message); }
  }

  async function saveConsent(e) {
    e.preventDefault(); setLoading(true); setStatus("");
    try {
      await api("/consent", {
        method: "POST",
        body: JSON.stringify({
          scope, clinicianSharing, historyDays, consentVersion: "wearables-v1"
        })
      });
      await loadConsent();
      setStatus("Demo consent record saved. This does not grant operating-system permissions.");
    } catch (e) { setStatus(e.message); }
    finally { setLoading(false); }
  }

  async function loadSummary() {
    setStatus("");
    try {
      const result = await api(`/clinician-summary?days=${days}`);
      setSummary(result);
    } catch (e) {
      setSummary(null);
      setStatus(e.message);
    }
  }

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">M</div><div><strong>MumWise</strong><span>Maternal wellbeing</span></div></div>
      <div className="nav-label">PATIENT SPACE</div>
      <a className="nav-item active" href="#overview">◫ <span>Health overview</span></a>
      <a className="nav-item" href="#devices">⌚ <span>Wearables & data</span></a>
      <a className="nav-item" href="#trends">⌁ <span>Health trends</span></a>
      <a className="nav-item" href="#consent">♧ <span>Privacy & consent</span></a>
      <div className="sidebar-note"><span className="shield">✓</span><strong>Your data, your choice</strong><p>Review what is imported and what is shared with your care team.</p></div>
      <div className="demo-tag">DEVELOPMENT PREVIEW</div>
    </aside>

    <section className="main">
      <header className="topbar">
        <div><span className="eyebrow">MUMWISE / HEALTH DATA</span><h1>Wearables & Health Data</h1><p>Connect health sources and review your measurements in one place.</p></div>
        <div className="profile-chip"><div className="avatar">P</div><div><strong>Demo patient</strong><span>Patient view</span></div></div>
      </header>

      {status && <div className="notice" role="status"><span>ⓘ</span><div>{status}</div><button onClick={() => setStatus("")} aria-label="Dismiss message">×</button></div>}

      <section id="overview" className="section">
        <div className="section-heading"><div><h2>Your health at a glance</h2><p>Summary of imported data. No clinical interpretation is made here.</p></div><span className="pill neutral">Demo environment</span></div>
        <div className="metric-grid">
          {[
            { key: "heart_rate", label: "Latest heart rate", unit: "bpm", icon: "♥" },
            { key: "hrv", label: "Latest HRV", unit: "ms", icon: "〰" },
            { key: "steps", label: "Latest step record", unit: "steps", icon: "↗" },
            { key: "sleep_hours", label: "Latest sleep record", unit: "hours", icon: "☾" }
          ].map(m => {
            const val = m.key === selectedMetric ? latest?.value : null;
            return <button className={`metric-card ${selectedMetric === m.key ? "selected" : ""}`} key={m.key} onClick={() => setSelectedMetric(m.key)}>
              <div className="metric-top"><span className="metric-icon">{m.icon}</span><span className="tiny-label">{m.unit}</span></div>
              <span className="metric-label">{m.label}</span><strong>{val != null ? fmt(val) : "View trend"}</strong>
              <span className="metric-foot">{val != null ? `${latest.unit} · latest record` : "Select to explore"}</span>
            </button>;
          })}
        </div>
      </section>

      <section id="devices" className="section">
        <div className="section-heading"><div><h2>Connected sources</h2><p>Device status is separate from the freshness of its readings.</p></div><span className="count-pill">{devices.length} sources</span></div>
        <div className="panel">
          {devices.length === 0 ? <div className="empty-state"><div className="empty-icon">⌚</div><strong>No sources connected</strong><p>Add a demo source to preview the connection-management interface.</p></div> :
            <div className="device-list">{devices.map(d => <div className="device-row" key={d.id}>
              <div className="device-icon">⌚</div><div className="device-info"><strong>{d.display_name}</strong><span>{d.source_type.replaceAll("_", " ")} · Last sync: {d.last_sync_at ? new Date(d.last_sync_at).toLocaleString() : "Never"}</span><span className="permission-list">Data types: {(d.permissions || []).join(", ") || "None selected"}</span></div>
              <span className={`pill ${d.status === "connected" ? "success" : "neutral"}`}>{d.status}</span>
              {d.status !== "disconnected" && <button className="button button-light" onClick={() => disconnect(d.id)}>Disconnect</button>}
            </div>)}</div>}
          <form className="connect-form" onSubmit={connectDemo}>
            <div className="form-title"><div><h3>Add a source (demo)</h3><p>This creates a simulated connection only; no actual wearable access occurs.</p></div><span className="pill warning">Not live integration</span></div>
            <div className="form-grid">
              <label>Source type<select value={sourceType} onChange={e => setSourceType(e.target.value)}>{sourceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
              <label>Display name<input value={deviceName} onChange={e => setDeviceName(e.target.value)} minLength="2" maxLength="120" required /></label>
            </div>
            <button className="button button-primary" disabled={loading}>{loading ? "Saving…" : "Add demo source"}</button>
          </form>
        </div>
      </section>

      <section id="trends" className="section">
        <div className="section-heading"><div><h2>Measurement trends</h2><p>Choose a metric and period to inspect imported records.</p></div></div>
        <div className="panel trend-panel">
          <div className="trend-controls">
            <label>Measurement<select value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)}>{metrics.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}</select></label>
            <label>Time range<select value={days} onChange={e => setDays(Number(e.target.value))}><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option></select></label>
          </div>
          <div className="chart-summary"><div><span className="metric-label">{activeMetric?.label}</span><strong>{latest ? `${fmt(latest.value)} ${latest.unit}` : "No readings yet"}</strong><span className="metric-foot">{latest ? `Latest: ${new Date(latest.measured_at).toLocaleString()}` : "Records will appear after data is imported."}</span></div><span className="pill neutral">{measurements.length} records</span></div>
          {chartData.length > 0 ? <div className="chart-wrap"><ResponsiveContainer width="100%" height={260}><LineChart data={chartData} margin={{ top: 12, right: 18, left: 0, bottom: 24 }}><CartesianGrid strokeDasharray="3 3" stroke="#e9e7e1" /><XAxis dataKey="time" tick={{ fontSize: 11, fill: "#73776f" }} angle={-18} textAnchor="end" /><YAxis tick={{ fontSize: 11, fill: "#73776f" }} /><Tooltip /><Line type="monotone" dataKey="value" name={activeMetric?.label} stroke="#287b68" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} /></LineChart></ResponsiveContainer></div> :
            <div className="empty-chart"><span>⌁</span><strong>No data for this metric and period</strong><p>The chart will display imported readings once available.</p></div>}
          <p className="fine-print">Missing values are not interpolated. Device readings are not diagnoses; discuss concerns with your clinician.</p>
        </div>
      </section>

      <section id="consent" className="section">
        <div className="section-heading"><div><h2>Privacy & consent</h2><p>Select data categories and whether summaries may be shared with your care team.</p></div></div>
        <form className="panel consent-panel" onSubmit={saveConsent}>
          <div className="consent-intro"><span className="privacy-icon">♧</span><div><strong>Your choices matter</strong><p>This demo saves a consent record in the database. It does not replace native platform permissions or a legally reviewed consent process.</p></div></div>
          <div className="consent-grid">{metrics.map(m => <label className="check-option" key={m.key}><input type="checkbox" checked={scope.includes(m.key)} onChange={e => setScope(old => e.target.checked ? [...old, m.key] : old.filter(x => x !== m.key))} /><span><strong>{m.label}</strong><small>{m.unit}</small></span></label>)}</div>
          <label className="block-label">Initial history period<select value={historyDays} onChange={e => setHistoryDays(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days (if source supports it)</option></select></label>
          <label className="share-option"><input type="checkbox" checked={clinicianSharing} onChange={e => setClinicianSharing(e.target.checked)} /><span><strong>Allow clinician report sharing</strong><small>Selected data may be included in the MumWise clinician summary.</small></span></label>
          <button className="button button-primary" disabled={loading}>{loading ? "Saving…" : "Save demo consent"}</button>
          {consent.length > 0 && <p className="fine-print">Consent history: {consent.length} record(s). Production UI should include withdrawal and history details.</p>}
        </form>
      </section>

      <section className="section">
        <div className="section-heading"><div><h2>Clinician report preview</h2><p>Summary is available only when clinician sharing is enabled in the latest active consent.</p></div><button className="button button-primary" onClick={loadSummary}>Generate summary</button></div>
        {summary && <div className="panel report-panel"><div className="report-header"><div><h3>MumWise wearable summary</h3><p>Generated {new Date(summary.generatedAt).toLocaleString()} · Period: {summary.periodDays} days</p></div><span className="pill neutral">For clinician review</span></div><p className="fine-print">{summary.disclaimer}</p>
          {summary.metrics.length === 0 ? <p>No eligible readings in this period.</p> : <div className="table-wrap"><table><thead><tr><th>Metric</th><th>Mean</th><th>Min</th><th>Max</th><th>Records</th><th>Days with data</th></tr></thead><tbody>{summary.metrics.map(m => <tr key={m.metric_type}><td>{metrics.find(x => x.key === m.metric_type)?.label || m.metric_type}</td><td>{fmt(m.mean)}</td><td>{fmt(m.min)}</td><td>{fmt(m.max)}</td><td>{m.count}</td><td>{m.days_with_data}</td></tr>)}</tbody></table></div>}
        </div>}
      </section>
      <footer>© MumWise · Development starter · Demo records are not clinical advice.</footer>
    </section>
  </main>;
}
