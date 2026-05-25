import React, { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const API = "http://localhost:5000/api";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// ─── colour helpers ───────────────────────────────────────────────────────────
const DEPT_COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

// ─── small shared components ─────────────────────────────────────────────────

function Badge({ type, children }) {
  const styles = {
    critical: { background: "#fee2e2", color: "#991b1b" },
    warning:  { background: "#fef9c3", color: "#854d0e" },
    ok:       { background: "#d1fae5", color: "#065f46" },
    forecast: { background: "#e0e7ff", color: "#3730a3" },
    actual:   { background: "#f3f4f6", color: "#374151" },
  };
  const s = styles[type] || styles.ok;
  return (
    <span style={{
      ...s, padding: "2px 10px", borderRadius: 99,
      fontSize: 12, fontWeight: 600, whiteSpace: "nowrap"
    }}>
      {children}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      padding: "20px 24px", ...style
    }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <Card style={{ borderTop: `4px solid ${color || "#4f46e5"}` }}>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{sub}</p>}
    </Card>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
      {children}
    </h2>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

const NAV = [
  { id: "dashboard",    label: "Dashboard",       icon: "📊" },
  { id: "departments",  label: "Departments",      icon: "🏢" },
  { id: "transactions", label: "Transactions",     icon: "💳" },
  { id: "reports",      label: "Monthly Reports",  icon: "📈" },
  { id: "alerts",       label: "Alerts",           icon: "🔔" },
  { id: "import",       label: "Import CSV",       icon: "📂" },
];

function Sidebar({ active, onNav, alertCount }) {
  return (
    <nav style={{
      width: 220, background: "#1e1b4b", minHeight: "100vh",
      display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0
    }}>
      <div style={{ padding: "0 20px 28px" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>💰 FinTrack</div>
        <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 2 }}>Budget Monitoring System</div>
      </div>
      {NAV.map(n => (
        <button
          key={n.id}
          onClick={() => onNav(n.id)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 20px", border: "none", width: "100%", textAlign: "left",
            background: active === n.id ? "rgba(255,255,255,0.12)" : "transparent",
            color: active === n.id ? "#fff" : "#c7d2fe",
            fontWeight: active === n.id ? 700 : 400,
            fontSize: 14, borderLeft: active === n.id ? "3px solid #818cf8" : "3px solid transparent",
            cursor: "pointer", transition: "all 0.15s",
          }}
        >
          <span>{n.icon}</span>
          <span>{n.label}</span>
          {n.id === "alerts" && alertCount > 0 && (
            <span style={{
              marginLeft: "auto", background: "#ef4444", color: "#fff",
              borderRadius: 99, fontSize: 11, padding: "1px 7px", fontWeight: 700
            }}>{alertCount}</span>
          )}
        </button>
      ))}
    </nav>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

function Dashboard({ summary }) {
  const totalBudget   = summary.reduce((s, d) => s + d.annual_budget, 0);
  const totalActuals  = summary.reduce((s, d) => s + d.total_actuals, 0);
  const totalForecast = summary.reduce((s, d) => s + d.total_forecast, 0);
  const overBudget    = summary.filter(d => d.alert === "critical").length;

  const chartData = summary.map((d, i) => ({
    name: d.dept_name,
    Actuals: d.total_actuals,
    Forecast: d.total_forecast,
    Budget: d.annual_budget,
  }));

  return (
    <div>
      <SectionTitle>Overview</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Annual Budget"    value={fmt(totalBudget)}   color="#4f46e5" />
        <StatCard label="Total Actuals Spent"    value={fmt(totalActuals)}  color="#0ea5e9" />
        <StatCard label="Total Forecast"         value={fmt(totalForecast)} color="#10b981" />
        <StatCard label="Departments Over 80%"   value={overBudget}         color="#ef4444"
          sub={overBudget > 0 ? "Need attention" : "All within limits"} />
      </div>

      <Card style={{ marginBottom: 24 }}>
        <SectionTitle>Budget vs Actuals vs Forecast — All Departments</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Legend />
            <Bar dataKey="Budget"   fill="#e0e7ff" />
            <Bar dataKey="Forecast" fill="#a5b4fc" />
            <Bar dataKey="Actuals"  fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionTitle>Department Status</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
              {["Department", "Annual Budget", "Actuals", "Forecast", "Variance", "Utilisation", "Status"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.map((d, i) => (
              <tr key={d.dept_id} style={{ borderBottom: "1px solid #f9fafb" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{d.dept_name}</td>
                <td style={{ padding: "10px 12px" }}>{fmt(d.annual_budget)}</td>
                <td style={{ padding: "10px 12px" }}>{fmt(d.total_actuals)}</td>
                <td style={{ padding: "10px 12px" }}>{fmt(d.total_forecast)}</td>
                <td style={{ padding: "10px 12px", color: d.variance > 0 ? "#ef4444" : "#10b981" }}>
                  {d.variance > 0 ? "▲ " : "▼ "}{fmt(Math.abs(d.variance))}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 4, height: 8 }}>
                      <div style={{
                        width: `${Math.min(d.utilisation_pct, 100)}%`,
                        background: d.utilisation_pct > 80 ? "#ef4444" : d.utilisation_pct > 60 ? "#f59e0b" : "#10b981",
                        height: 8, borderRadius: 4, transition: "width 0.4s"
                      }} />
                    </div>
                    <span style={{ fontSize: 12, color: "#6b7280", minWidth: 36 }}>{d.utilisation_pct}%</span>
                  </div>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <Badge type={d.alert || "ok"}>
                    {d.alert === "critical" ? "Critical" : d.alert === "warning" ? "Warning" : "On Track"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── DEPARTMENTS ─────────────────────────────────────────────────────────────

function Departments({ departments, onRefresh }) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const add = async () => {
    if (!name || !budget) return setMsg("Please fill in both fields.");
    setLoading(true);
    await fetch(`${API}/departments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, annual_budget: parseFloat(budget) }),
    });
    setName(""); setBudget(""); setMsg("Department added!");
    setLoading(false);
    onRefresh();
    setTimeout(() => setMsg(""), 2000);
  };

  const del = async (id) => {
    if (!window.confirm("Delete this department and all its transactions?")) return;
    await fetch(`${API}/departments/${id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div>
      <SectionTitle>Departments</SectionTitle>
      <Card style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Add New Department</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Department name"
            style={{ flex: 1, minWidth: 160, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }}
          />
          <input
            value={budget} onChange={e => setBudget(e.target.value)}
            placeholder="Annual budget (₹)"
            type="number"
            style={{ flex: 1, minWidth: 160, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }}
          />
          <button onClick={add} disabled={loading}
            style={{
              background: "#4f46e5", color: "#fff", border: "none",
              borderRadius: 8, padding: "8px 20px", fontWeight: 600, fontSize: 13
            }}>
            {loading ? "Adding…" : "Add Department"}
          </button>
        </div>
        {msg && <p style={{ marginTop: 8, fontSize: 12, color: "#4f46e5" }}>{msg}</p>}
      </Card>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
              {["#", "Department Name", "Annual Budget", ""].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {departments.map((d, i) => (
              <tr key={d.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                <td style={{ padding: "10px 12px", color: "#9ca3af" }}>{i + 1}</td>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{d.name}</td>
                <td style={{ padding: "10px 12px" }}>{fmt(d.annual_budget)}</td>
                <td style={{ padding: "10px 12px" }}>
                  <button onClick={() => del(d.id)}
                    style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

function Transactions({ departments, onRefresh }) {
  const [txns, setTxns] = useState([]);
  const [filter, setFilter] = useState({ dept_id: "", month: "" });
  const [form, setForm] = useState({ dept_id: "", description: "", amount: "", month: "", type: "actual" });
  const [msg, setMsg] = useState("");

  const fetchTxns = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter.dept_id) params.set("dept_id", filter.dept_id);
    if (filter.month) params.set("month", filter.month);
    const res = await fetch(`${API}/transactions?${params}`);
    setTxns(await res.json());
  }, [filter]);

  useEffect(() => { fetchTxns(); }, [fetchTxns]);

  const add = async () => {
    if (!form.dept_id || !form.description || !form.amount || !form.month) return setMsg("All fields required.");
    await fetch(`${API}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount), dept_id: parseInt(form.dept_id) }),
    });
    setForm({ dept_id: "", description: "", amount: "", month: "", type: "actual" });
    setMsg("Entry added!"); fetchTxns(); onRefresh();
    setTimeout(() => setMsg(""), 2000);
  };

  const del = async (id) => {
    await fetch(`${API}/transactions/${id}`, { method: "DELETE" });
    fetchTxns(); onRefresh();
  };

  const deptName = (id) => departments.find(d => d.id === id)?.name || "—";

  return (
    <div>
      <SectionTitle>Transactions</SectionTitle>

      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Add New Entry</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 10 }}>
          <select value={form.dept_id} onChange={e => setForm({ ...form, dept_id: e.target.value })}
            style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }} />
          <input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
            placeholder="Amount (₹)" type="number"
            style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }} />
          <input value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}
            placeholder="Month (YYYY-MM)" type="month"
            style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }} />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
            style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
            <option value="actual">Actual</option>
            <option value="forecast">Forecast</option>
          </select>
          <button onClick={add}
            style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13 }}>
            Add Entry
          </button>
        </div>
        {msg && <p style={{ fontSize: 12, color: "#4f46e5" }}>{msg}</p>}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Filter</p>
        <div style={{ display: "flex", gap: 12 }}>
          <select value={filter.dept_id} onChange={e => setFilter({ ...filter, dept_id: e.target.value })}
            style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input value={filter.month} onChange={e => setFilter({ ...filter, month: e.target.value })}
            type="month"
            style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }} />
          <button onClick={() => setFilter({ dept_id: "", month: "" })}
            style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13 }}>
            Clear
          </button>
        </div>
      </Card>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
              {["Department", "Description", "Month", "Type", "Amount", ""].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {txns.map(t => (
              <tr key={t.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                <td style={{ padding: "9px 12px" }}>{deptName(t.dept_id)}</td>
                <td style={{ padding: "9px 12px" }}>{t.description}</td>
                <td style={{ padding: "9px 12px", color: "#6b7280" }}>{t.month}</td>
                <td style={{ padding: "9px 12px" }}><Badge type={t.type}>{t.type}</Badge></td>
                <td style={{ padding: "9px 12px", fontWeight: 600 }}>{fmt(t.amount)}</td>
                <td style={{ padding: "9px 12px" }}>
                  <button onClick={() => del(t.id)}
                    style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 12 }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {txns.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#9ca3af" }}>No transactions found.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── MONTHLY REPORTS ──────────────────────────────────────────────────────────

function Reports({ departments }) {
  const [data, setData] = useState([]);
  const [deptId, setDeptId] = useState("");

  useEffect(() => {
    const params = deptId ? `?dept_id=${deptId}` : "";
    fetch(`${API}/report/monthly${params}`)
      .then(r => r.json())
      .then(setData);
  }, [deptId]);

  return (
    <div>
      <SectionTitle>Monthly Reports</SectionTitle>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontSize: 13, color: "#6b7280" }}>Filter by department:</label>
          <select value={deptId} onChange={e => setDeptId(e.target.value)}
            style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <SectionTitle>Actuals vs Forecast by Month</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => fmt(v)} />
            <Legend />
            <Line type="monotone" dataKey="actuals"  stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="forecast" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
              {["Month", "Actuals", "Forecast", "Variance"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.month} style={{ borderBottom: "1px solid #f9fafb" }}>
                <td style={{ padding: "9px 12px", fontWeight: 600 }}>{row.month}</td>
                <td style={{ padding: "9px 12px" }}>{fmt(row.actuals)}</td>
                <td style={{ padding: "9px 12px" }}>{fmt(row.forecast)}</td>
                <td style={{ padding: "9px 12px", color: row.variance > 0 ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                  {row.variance > 0 ? "▲ " : "▼ "}{fmt(Math.abs(row.variance))}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#9ca3af" }}>No data for this selection.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── ALERTS ───────────────────────────────────────────────────────────────────

function Alerts({ alerts }) {
  return (
    <div>
      <SectionTitle>Budget Alerts</SectionTitle>
      {alerts.length === 0 ? (
        <Card>
          <p style={{ color: "#10b981", fontWeight: 600, textAlign: "center", padding: 24 }}>
            ✅ All departments are within budget thresholds.
          </p>
        </Card>
      ) : (
        alerts.map((a, i) => (
          <Card key={i} style={{
            marginBottom: 12,
            borderLeft: `4px solid ${a.severity === "critical" ? "#ef4444" : "#f59e0b"}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{a.dept_name}</p>
                <p style={{ color: "#6b7280", fontSize: 13 }}>{a.message}</p>
              </div>
              <Badge type={a.severity}>{a.severity === "critical" ? "Critical" : "Warning"}</Badge>
            </div>
            <div style={{ marginTop: 12, background: "#f3f4f6", borderRadius: 6, height: 10 }}>
              <div style={{
                width: `${Math.min(a.utilisation_pct, 100)}%`,
                background: a.severity === "critical" ? "#ef4444" : "#f59e0b",
                height: 10, borderRadius: 6, transition: "width 0.4s"
              }} />
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{a.utilisation_pct}% of annual budget used</p>
          </Card>
        ))
      )}
    </div>
  );
}

// ─── CSV IMPORT ───────────────────────────────────────────────────────────────

function ImportCSV({ departments, onRefresh }) {
  const [preview, setPreview] = useState([]);
  const [msg, setMsg] = useState("");
  const [importing, setImporting] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => setPreview(result.data),
    });
  };

  const doImport = async () => {
    if (!preview.length) return;
    setImporting(true);
    let ok = 0, fail = 0;
    for (const row of preview) {
      const dept = departments.find(d => d.name.toLowerCase() === (row.department || "").toLowerCase());
      if (!dept) { fail++; continue; }
      const res = await fetch(`${API}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dept_id: dept.id,
          description: row.description || "Imported entry",
          amount: parseFloat(row.amount) || 0,
          month: row.month || "2024-01",
          type: (row.type || "actual").toLowerCase(),
        }),
      });
      if (res.ok) ok++; else fail++;
    }
    setImporting(false);
    setPreview([]);
    setMsg(`Import complete: ${ok} added, ${fail} failed.`);
    onRefresh();
    setTimeout(() => setMsg(""), 4000);
  };

  return (
    <div>
      <SectionTitle>Import from CSV</SectionTitle>
      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          Upload a <strong>.csv</strong> file with columns: <code style={{ background: "#f3f4f6", padding: "1px 6px", borderRadius: 4 }}>department, description, amount, month, type</code>
        </p>
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>
          Example row: <code style={{ background: "#f3f4f6", padding: "1px 6px", borderRadius: 4 }}>Engineering, AWS Servers, 12000, 2024-03, actual</code>
        </p>
        <input type="file" accept=".csv" onChange={handleFile}
          style={{ fontSize: 13, marginBottom: 12 }} />
        {preview.length > 0 && (
          <>
            <p style={{ fontWeight: 600, fontSize: 13, margin: "12px 0 8px" }}>{preview.length} rows detected — preview:</p>
            <div style={{ overflowX: "auto", marginBottom: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    {Object.keys(preview[0]).map(k => (
                      <th key={k} style={{ padding: "6px 10px", textAlign: "left", color: "#6b7280" }}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 5).map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}>
                      {Object.values(row).map((v, j) => (
                        <td key={j} style={{ padding: "6px 10px" }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={doImport} disabled={importing}
              style={{
                background: "#4f46e5", color: "#fff", border: "none",
                borderRadius: 8, padding: "9px 20px", fontWeight: 600, fontSize: 13
              }}>
              {importing ? "Importing…" : `Import ${preview.length} Rows`}
            </button>
          </>
        )}
        {msg && <p style={{ marginTop: 10, fontSize: 13, color: "#4f46e5", fontWeight: 600 }}>{msg}</p>}
      </Card>

      <Card>
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Sample CSV Template</p>
        <pre style={{
          background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8,
          padding: 14, fontSize: 12, lineHeight: 1.7, overflowX: "auto"
        }}>
{`department,description,amount,month,type
Engineering,AWS Infrastructure,45000,2024-03,actual
Marketing,Ad Campaign Q2,25000,2024-03,actual
Operations,Office Rent,18000,2024-03,actual
Engineering,Q2 Budget Estimate,180000,2024-04,forecast`}
        </pre>
      </Card>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const fetchAll = useCallback(async () => {
    const [depts, sum, alrt] = await Promise.all([
      fetch(`${API}/departments`).then(r => r.json()),
      fetch(`${API}/report/summary`).then(r => r.json()),
      fetch(`${API}/alerts`).then(r => r.json()),
    ]);
    setDepartments(depts);
    setSummary(sum);
    setAlerts(alrt);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pages = {
    dashboard:    <Dashboard summary={summary} />,
    departments:  <Departments departments={departments} onRefresh={fetchAll} />,
    transactions: <Transactions departments={departments} onRefresh={fetchAll} />,
    reports:      <Reports departments={departments} />,
    alerts:       <Alerts alerts={alerts} />,
    import:       <ImportCSV departments={departments} onRefresh={fetchAll} />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar active={page} onNav={setPage} alertCount={alerts.length} />
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
        <div style={{ maxWidth: 1100 }}>
          {pages[page]}
        </div>
      </main>
    </div>
  );
}
