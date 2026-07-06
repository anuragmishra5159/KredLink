/**
 * KredLink — Officer Dashboard
 * Light-theme underwriting review portal.
 * Single-file, default export, no required props.
 * Tries to pull live data from /api/v1/merchants; falls back to sample data.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, ListChecks, Store, BarChart2, Settings2,
  Bell, CheckCircle2, AlertTriangle, ChevronRight, LogOut,
  Zap, FileText, ShieldAlert, Users, RefreshCw, X,
  TrendingUp, Clock, Database,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

// ─── Colour constants ──────────────────────────────────────────────────────────
const C = {
  coral:    "#FF6F7D",   // UPI
  blue:     "#5B8DEF",   // GST
  teal:     "#2FC7A1",   // DSB / Buffer
  magenta:  "#D65DB1",   // overall / accent
  bg:       "#F7F6FB",
  card:     "#FFFFFF",
  border:   "#ECEAF5",
  shadow:   "0 2px 12px rgba(42,42,60,0.07)",
  text:     "#2A2A3C",
  muted:    "#8B87A6",
  sidebar:  "#FFFFFF",
  approveGrad: "linear-gradient(135deg, #2FC7A1 0%, #5B8DEF 100%)",
  flagGrad:    "linear-gradient(135deg, #FF6F7D 0%, #D65DB1 100%)",
  navGrad:     "linear-gradient(135deg, #5B8DEF 0%, #D65DB1 100%)",
};

// ─── Responsive hook ───────────────────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

// ─── Sample / fallback data ────────────────────────────────────────────────────
const SAMPLE = [
  {
    id: "demo-1",
    name: "Sharma General Store",
    gstin: "27AAAAA1234A1Z0",
    vpa: "sharma_store@oksbi",
    registrationStatus: "GST_REGISTERED",
    status: "APPROVED_FOR_MICRO_CREDIT",
    score: {
      final: 769,
      components: { uVel: 0.8722, gstAuth: 0.5851, dsb: 0.9535 },
      weights:    { w1: 0.30, w2: 0.40, w3: 0.30 },
      coverageTier: "FULL",
      fraudFlags:   [],
      explanation: "FHS of 769 reflects stable UPI inflow patterns (U_vel=0.87), a moderate match between GST-reported turnover and bank-verified cash deposits (GST_auth=0.59), and a sufficient debt serviceability buffer ahead of monthly obligations (DSB=0.95).",
    },
    monthly: [
      { month: "Mar", gstTurnover: 912000, deposits: 870000 },
      { month: "Apr", gstTurnover: 985000, deposits: 940000 },
      { month: "May", gstTurnover: 940000, deposits: 955000 },
      { month: "Jun", gstTurnover: 998000, deposits: 970000 },
    ],
    weeklyUpi: [
      { day: "Mon", amount: 28000 }, { day: "Tue", amount: 31000 },
      { day: "Wed", amount: 29500 }, { day: "Thu", amount: 33000 },
      { day: "Fri", amount: 35000 }, { day: "Sat", amount: 42000 },
      { day: "Sun", amount: 39000 },
    ],
  },
  {
    id: "demo-2",
    name: "Patel Kirana Hub",
    gstin: null,
    vpa: "patel_kirana@ybl",
    registrationStatus: "UNREGISTERED",
    status: "REVIEW_REQUIRED",
    score: {
      final: 541,
      components: { uVel: 0.7845, gstAuth: null, dsb: 0.8231 },
      weights:    { w1: 0.50, w2: 0.00, w3: 0.50 },
      coverageTier: "PARTIAL",
      fraudFlags:   [],
      explanation: "FHS of 541 is based on UPI velocity and serviceability buffer only (GST data unavailable — unregistered entity). Coverage is PARTIAL. Requires additional scrutiny before approval.",
    },
    monthly: [
      { month: "Mar", gstTurnover: 0, deposits: 420000 },
      { month: "Apr", gstTurnover: 0, deposits: 450000 },
      { month: "May", gstTurnover: 0, deposits: 410000 },
      { month: "Jun", gstTurnover: 0, deposits: 480000 },
    ],
    weeklyUpi: [
      { day: "Mon", amount: 14000 }, { day: "Tue", amount: 16000 },
      { day: "Wed", amount: 13500 }, { day: "Thu", amount: 17000 },
      { day: "Fri", amount: 18000 }, { day: "Sat", amount: 22000 },
      { day: "Sun", amount: 19000 },
    ],
  },
  {
    id: "demo-3",
    name: "Kumar Trading Co.",
    gstin: "09BBBBB5678B2Z1",
    vpa: "kumar_trading@paytm",
    registrationStatus: "GST_REGISTERED",
    status: "REVIEW_REQUIRED",
    score: {
      final: 612,
      components: { uVel: 0.6240, gstAuth: 0.7120, dsb: 0.5880 },
      weights:    { w1: 0.30, w2: 0.40, w3: 0.30 },
      coverageTier: "FULL",
      fraudFlags: [
        { flagType: "COUNTERPARTY_CONCENTRATION", severity: "MEDIUM", evidenceRef: "avg distinct-payer ratio 0.28 below 0.35 threshold" },
        { flagType: "INVOICE_MISMATCH",           severity: "LOW",    evidenceRef: "GSTR-1 invoice #KT-2026-041 lacks corresponding AA credit entry" },
      ],
      explanation: "FHS of 612 reflects moderate UPI inflow patterns and strong GST authentication, but a thin serviceability buffer. Two fraud flags were triggered: counterparty concentration and an invoice–payment mismatch. Manual review required before any credit decision.",
    },
    monthly: [
      { month: "Mar", gstTurnover: 1250000, deposits:  980000 },
      { month: "Apr", gstTurnover: 1380000, deposits: 1050000 },
      { month: "May", gstTurnover: 1200000, deposits: 1100000 },
      { month: "Jun", gstTurnover: 1450000, deposits: 1120000 },
    ],
    weeklyUpi: [
      { day: "Mon", amount: 45000 }, { day: "Tue", amount: 38000 },
      { day: "Wed", amount: 52000 }, { day: "Thu", amount: 41000 },
      { day: "Fri", amount: 48000 }, { day: "Sat", amount: 55000 },
      { day: "Sun", amount: 43000 },
    ],
  },
];

// ─── Map API merchant shape → internal shape ───────────────────────────────────
function mapApi(m) {
  const cs = m.creditScore || {};
  return {
    id:   m._id,
    name: m.businessName,
    gstin: m.gstin,
    vpa:   m.vpa,
    registrationStatus: m.registrationStatus,
    status: m.status,
    score: {
      final:        cs.finalFhsScore,
      components:   cs.components   || {},
      weights:      cs.weightsUsed  || {},
      coverageTier: cs.coverageTier,
      fraudFlags:   (cs.fraudFlags || []).map(f => ({
        flagType:   f.flagType,
        severity:   f.severity,
        evidenceRef:f.evidenceRef,
      })),
      explanation:  cs.explanationText,
    },
    monthly:   SAMPLE[0].monthly,   // no live monthly data from API yet
    weeklyUpi: SAMPLE[0].weeklyUpi, // no live weekly data from API yet
  };
}

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  APPROVED_FOR_MICRO_CREDIT: { label: "Approved",     bg: "#E8FAF4", text: "#1A9E73" },
  REVIEW_REQUIRED:            { label: "Review",       bg: "#FFF3E0", text: "#E07B00" },
  PENDING:                    { label: "Pending",      bg: "#EEF2FF", text: "#5B8DEF" },
  PROCESSING:                 { label: "Processing",   bg: "#EEF2FF", text: "#5B8DEF" },
  INSUFFICIENT_DATA:          { label: "Insufficient", bg: "#FEE8E8", text: "#C0392B" },
};
const sp = (s) => STATUS[s] || STATUS.PENDING;

// ─── Score ring ─────────────────────────────────────────────────────────────────
function ScoreRing({ value, max = 1, color, label, size = 110, unit = "%" }) {
  const pct = value != null ? Math.max(0, Math.min(1, max === 1 ? value : (value - 300) / 600)) : 0;
  const display = value == null ? "N/A"
    : max === 1 ? `${Math.round(value * 100)}%`
    : String(value);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <PieChart width={size} height={size}>
          <Pie
            data={[{ v: pct }, { v: 1 - pct }]}
            dataKey="v"
            cx="50%" cy="50%"
            innerRadius={size * 0.35} outerRadius={size * 0.46}
            startAngle={90} endAngle={-270}
            strokeWidth={0}
          >
            <Cell fill={color} />
            <Cell fill="#ECEAF5" />
          </Pie>
        </PieChart>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <span style={{
            fontSize: size > 140 ? 26 : size > 100 ? 18 : 13,
            fontWeight: 800, color: C.text, fontVariantNumeric: "tabular-nums", lineHeight: 1,
          }}>
            {display}
          </span>
          {size > 100 && (
            <span style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
              {max === 1 ? "score" : "/ 900"}
            </span>
          )}
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, textAlign: "center", lineHeight: 1.3 }}>
        {label}
      </span>
    </div>
  );
}

// ─── Fraud toggle row ─────────────────────────────────────────────────────────
const FLAG_CHECKS = [
  { key: "COUNTERPARTY_CONCENTRATION", label: "Counterparty Concentration", icon: Users },
  { key: "CIRCULAR_TXN",               label: "Circular Transaction",        icon: RefreshCw },
  { key: "INVOICE_MISMATCH",           label: "Invoice–Payment Mismatch",    icon: FileText },
];

function FraudToggleRow({ flagKey, label, IconComp, flags }) {
  const hit = flags.find(f => f.flagType === flagKey);
  const on  = !!hit;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
      borderBottom: `1px solid ${C.border}`,
    }}>
      <IconComp size={16} color={on ? C.coral : C.muted} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: on ? C.text : C.muted }}>{label}</span>
      {/* Toggle pill */}
      <div
        role="status"
        aria-label={on ? "Flagged" : "Clear"}
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: on ? C.coral : "#ECEAF5",
          position: "relative", flexShrink: 0, transition: "background 0.2s",
        }}
      >
        <div style={{
          width: 16, height: 16, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 3,
          left: on ? 21 : 3,
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
        }} />
      </div>
      {on && (
        <span style={{ fontSize: 11, color: C.coral, fontWeight: 600, maxWidth: 180, lineHeight: 1.3 }}>
          {hit.evidenceRef}
        </span>
      )}
      {!on && (
        <span style={{ fontSize: 11, color: C.muted }}>No anomaly</span>
      )}
    </div>
  );
}

// ─── Custom chart tooltip ──────────────────────────────────────────────────────
function ChartTip({ active, payload, label, fmt = v => `₹${(v / 1000).toFixed(0)}k` }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "8px 14px", fontSize: 12, color: C.text,
      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: C.muted }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, style = {}, title, sub }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 16, boxShadow: C.shadow, padding: 20, ...style,
    }}>
      {title && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>{title}</p>
          {sub && <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>{sub}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── NAV items ─────────────────────────────────────────────────────────────────
const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",    key: "dash" },
  { icon: ListChecks,      label: "Review Queue", key: "queue", active: true },
  { icon: Store,           label: "Merchants",    key: "merchants" },
  { icon: BarChart2,       label: "Reports",      key: "reports" },
  { icon: Settings2,       label: "Settings",     key: "settings" },
];

// ─── Coverage badge ─────────────────────────────────────────────────────────────
function TierBadge({ tier }) {
  const cfg = {
    FULL:    { bg: "#E8FAF4", text: "#1A9E73" },
    PARTIAL: { bg: "#FFF3E0", text: "#E07B00" },
    MINIMAL: { bg: "#FEE8E8", text: "#C0392B" },
  }[tier] || { bg: "#EEF2FF", text: "#5B8DEF" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 20, background: cfg.bg, color: cfg.text,
    }}>
      {tier}
    </span>
  );
}

// ─── Score colour helper ────────────────────────────────────────────────────────
function scoreColor(s) {
  if (!s) return C.muted;
  if (s >= 750) return C.teal;
  if (s >= 650) return C.blue;
  if (s >= 550) return C.magenta;
  return C.coral;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function OfficerDashboard() {
  const navigate       = useNavigate();
  const { user, logout } = useAuth();
  const width          = useWindowWidth();
  const narrow         = width < 768;

  const [merchants, setMerchants]   = useState(SAMPLE);
  const [selectedId, setSelectedId] = useState(SAMPLE[0].id);
  const [toast, setToast]           = useState(null);
  const [deciding, setDeciding]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Inject Poppins font
  useEffect(() => {
    if (!document.getElementById("poppins-font")) {
      const link = document.createElement("link");
      link.id   = "poppins-font";
      link.rel  = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // Try to fetch live data
  useEffect(() => {
    api.get("/merchants")
      .then(({ data }) => {
        if (data?.merchants?.length) {
          const mapped = data.merchants.map(mapApi);
          setMerchants(mapped);
          setSelectedId(mapped[0].id);
        }
      })
      .catch(() => {/* stay with sample data */});
  }, []);

  const merchant = merchants.find(m => m.id === selectedId) || merchants[0];
  const { score, monthly, weeklyUpi } = merchant;

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDecision = async (decision) => {
    if (deciding) return;
    setDeciding(true);
    try {
      await api.post(`/decisions/${merchant.id}`, { decision });
      const newStatus = decision === "APPROVED_FOR_MICRO_CREDIT" ? "APPROVED_FOR_MICRO_CREDIT" : "REVIEW_REQUIRED";
      setMerchants(prev => prev.map(m => m.id === merchant.id ? { ...m, status: newStatus } : m));
      showToast("success", decision === "APPROVED_FOR_MICRO_CREDIT"
        ? "Application approved — applicant notified."
        : "Flagged for manual review — applicant notified.");
    } catch {
      showToast("error", "Decision failed. Please try again.");
    } finally { setDeciding(false); }
  };

  // ── Sidebar content ─────────────────────────────────────────────────────────
  const sidebarContent = (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      fontFamily: "'Poppins', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: C.navGrad,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>KL</span>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: C.text }}>KredLink</p>
            <p style={{ margin: 0, fontSize: 10, color: C.muted }}>Officer Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 12px 0", flex: 1 }}>
        {NAV.map(({ icon: Icon, label, key, active: navActive }) => (
          <button
            key={key}
            onClick={() => key === "queue" && setSidebarOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "10px 12px", borderRadius: 10,
              background: navActive ? C.navGrad : "transparent",
              border: "none", cursor: "pointer", marginBottom: 4,
              color: navActive ? "#fff" : C.muted,
              fontFamily: "inherit", fontSize: 13, fontWeight: navActive ? 700 : 500,
              textAlign: "left",
              outline: "none",
            }}
            onFocus={e => e.currentTarget.style.outline = `2px solid ${C.blue}`}
            onBlur={e => e.currentTarget.style.outline = "none"}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* Merchant queue */}
      <div style={{ padding: 12, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Review Queue
        </p>
        {merchants.map(m => {
          const s = sp(m.status);
          const active = m.id === selectedId;
          return (
            <button
              key={m.id}
              onClick={() => { setSelectedId(m.id); setSidebarOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "9px 10px", borderRadius: 10, marginBottom: 4,
                background: active ? "#F0EEFF" : "transparent",
                border: active ? `1.5px solid ${C.blue}30` : "1.5px solid transparent",
                cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                outline: "none",
              }}
              onFocus={e => e.currentTarget.style.outline = `2px solid ${C.blue}`}
              onBlur={e => e.currentTarget.style.outline = "none"}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: active ? C.navGrad : "#ECEAF5",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: active ? "#fff" : C.muted,
              }}>
                {m.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {m.name}
                </p>
                <span style={{ fontSize: 10, fontWeight: 700, background: s.bg, color: s.text, padding: "1px 6px", borderRadius: 20 }}>
                  {s.label}
                </span>
              </div>
              <ChevronRight size={13} color={C.muted} />
            </button>
          );
        })}
      </div>

      {/* Score badge */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <ScoreRing
          value={score.final}
          max={900}
          color={scoreColor(score.final)}
          label="FHS Score"
          size={100}
        />
        <TierBadge tier={score.coverageTier} />
      </div>

      {/* Logout */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
        <button
          onClick={logout}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "none", border: "none", cursor: "pointer",
            color: C.muted, fontSize: 12, fontFamily: "inherit", padding: "6px 0",
            outline: "none",
          }}
          onFocus={e => e.currentTarget.style.outline = `2px solid ${C.blue}`}
          onBlur={e => e.currentTarget.style.outline = "none"}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );

  // ── Root layout ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: narrow ? "1fr" : "220px 1fr",
      minHeight: "100vh",
      background: C.bg,
      fontFamily: "'Poppins', sans-serif",
      position: "relative",
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, right: 16, zIndex: 9999,
          background: toast.type === "success" ? "#1A9E73" : "#C0392B",
          color: "#fff", borderRadius: 12, padding: "12px 18px",
          fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", padding: 0 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      {!narrow && (
        <aside style={{
          background: C.sidebar, borderRight: `1px solid ${C.border}`,
          height: "100vh", position: "sticky", top: 0, overflowY: "auto",
        }}>
          {sidebarContent}
        </aside>
      )}

      {/* Mobile sidebar overlay */}
      {narrow && sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div onClick={() => setSidebarOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(42,42,60,0.4)" }} />
          <aside style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 260,
            background: C.sidebar, borderRight: `1px solid ${C.border}`, overflowY: "auto",
          }}>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* ── MAIN ── */}
      <main style={{ display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "hidden" }}>
        {/* Top bar */}
        <header style={{
          background: C.card, borderBottom: `1px solid ${C.border}`,
          padding: "0 24px", height: 64,
          display: "flex", alignItems: "center", gap: 12,
          position: "sticky", top: 0, zIndex: 10,
        }}>
          {narrow && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4, outline: "none" }}
            >
              ☰
            </button>
          )}

          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text }}>Merchant Review</p>
            <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{merchant.name} · {merchant.gstin || "Unregistered"}</p>
          </div>

          {/* Action buttons */}
          <button
            onClick={() => handleDecision("APPROVED_FOR_MICRO_CREDIT")}
            disabled={deciding}
            style={{
              background: C.approveGrad, color: "#fff", border: "none",
              borderRadius: 24, padding: "8px 18px", fontSize: 12, fontWeight: 700,
              cursor: deciding ? "not-allowed" : "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6, opacity: deciding ? 0.7 : 1,
              outline: "none",
            }}
            onFocus={e => e.currentTarget.style.outline = `2px solid ${C.teal}`}
            onBlur={e => e.currentTarget.style.outline = "none"}
          >
            <CheckCircle2 size={14} /> Approve for micro-credit
          </button>
          <button
            onClick={() => handleDecision("REVIEW_REQUIRED")}
            disabled={deciding}
            style={{
              background: "transparent", color: C.coral,
              border: `1.5px solid ${C.coral}`,
              borderRadius: 24, padding: "7px 16px", fontSize: 12, fontWeight: 700,
              cursor: deciding ? "not-allowed" : "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6, opacity: deciding ? 0.7 : 1,
              outline: "none",
            }}
            onFocus={e => e.currentTarget.style.outline = `2px solid ${C.coral}`}
            onBlur={e => e.currentTarget.style.outline = "none"}
          >
            <AlertTriangle size={14} /> Flag for review
          </button>

          <button style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, position: "relative", outline: "none" }}
            onFocus={e => e.currentTarget.style.outline = `2px solid ${C.blue}`}
            onBlur={e => e.currentTarget.style.outline = "none"}
          >
            <Bell size={18} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: C.navGrad, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "#fff",
            }}>
              {(user?.name || "O")[0]}
            </div>
            {!narrow && (
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{user?.name || "Officer"}</span>
            )}
          </div>
        </header>

        {/* Widget grid */}
        <div style={{ padding: 24, flex: 1, overflowY: "auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
          }}>

            {/* ─── 1. Score Composition ─────────────────────────────────────── */}
            <Card title="Score Composition" sub="FHS components — 300 to 900 scale"
              style={{ gridColumn: "span 2" }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-around",
                flexWrap: "wrap", gap: 24,
              }}>
                <ScoreRing value={score.final} max={900} color={scoreColor(score.final)}
                  label="Overall FHS" size={160} />
                <div style={{ width: 1, height: 120, background: C.border, flexShrink: 0 }} />
                <ScoreRing value={score.components.uVel} max={1} color={C.coral}
                  label="UPI Velocity" size={110} />
                <ScoreRing value={score.components.gstAuth} max={1} color={C.blue}
                  label="GST Authenticity" size={110} />
                <ScoreRing value={score.components.dsb} max={1} color={C.teal}
                  label="Debt Serviceability" size={110} />
              </div>
              {/* Weight bar */}
              <div style={{ marginTop: 20, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                <p style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Weight allocation</p>
                <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 10 }}>
                  <div style={{ flex: score.weights.w1 || 0.3, background: C.coral, transition: "flex 0.5s" }} title={`UPI ${Math.round((score.weights.w1 || 0.3) * 100)}%`} />
                  <div style={{ flex: score.weights.w2 || 0.4, background: C.blue,  transition: "flex 0.5s" }} title={`GST ${Math.round((score.weights.w2 || 0.4) * 100)}%`} />
                  <div style={{ flex: score.weights.w3 || 0.3, background: C.teal,  transition: "flex 0.5s" }} title={`DSB ${Math.round((score.weights.w3 || 0.3) * 100)}%`} />
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                  {[
                    { color: C.coral, label: "UPI Velocity",       w: score.weights.w1 || 0.3 },
                    { color: C.blue,  label: "GST Authenticity",    w: score.weights.w2 || 0.4 },
                    { color: C.teal,  label: "Debt Serviceability", w: score.weights.w3 || 0.3 },
                  ].map(({ color, label, w }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.muted }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
                      {label} ({Math.round(w * 100)}%)
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* ─── 2. GST Turnover vs Deposits ──────────────────────────────── */}
            <Card title="GST Turnover vs Bank Deposits" sub="Monthly, in ₹ — 4-period view">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gstGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.blue}  stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.blue}  stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.teal}  stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.teal}  stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="gstTurnover" name="GST Turnover"
                    stroke={C.blue} fill="url(#gstGrad)" strokeWidth={2.5} dot={{ r: 3, fill: C.blue }} />
                  <Area type="monotone" dataKey="deposits" name="AA Deposits"
                    stroke={C.teal} fill="url(#depGrad)" strokeWidth={2.5} dot={{ r: 3, fill: C.teal }} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted }}>
                  <span style={{ width: 20, height: 2, background: C.blue, borderRadius: 1, display: "inline-block" }} /> GST Reported
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted }}>
                  <span style={{ width: 20, height: 2, background: C.teal, borderRadius: 1, display: "inline-block" }} /> AA Verified
                </div>
              </div>
            </Card>

            {/* ─── 3. Weekly UPI Inflow ──────────────────────────────────────── */}
            <Card title="Weekly UPI Inflow" sub="Monday – Sunday, this week">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={weeklyUpi} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="upiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.coral} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.coral} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTip fmt={v => `₹${(v/1000).toFixed(1)}k`} />} />
                  <Area type="monotone" dataKey="amount" name="UPI Inflow"
                    stroke={C.coral} fill="url(#upiGrad)" strokeWidth={2.5} dot={{ r: 3, fill: C.coral }} />
                </AreaChart>
              </ResponsiveContainer>
              {/* Mini KPI row */}
              <div style={{ display: "flex", gap: 0, marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                {[
                  { label: "Peak day",  value: weeklyUpi.reduce((a, b) => a.amount > b.amount ? a : b, weeklyUpi[0])?.day },
                  { label: "Weekly avg",value: `₹${Math.round(weeklyUpi.reduce((s, d) => s + d.amount, 0) / weeklyUpi.length / 1000)}k` },
                  { label: "Weekly total",value: `₹${Math.round(weeklyUpi.reduce((s, d) => s + d.amount, 0) / 1000)}k` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ flex: 1, textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.coral, fontVariantNumeric: "tabular-nums" }}>{value}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: C.muted }}>{label}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* ─── 4. Fraud Signals ─────────────────────────────────────────── */}
            <Card title="Fraud & Anomaly Signals" sub="3 automated checks run on alternate data">
              {FLAG_CHECKS.map(({ key, label, icon: Icon }) => (
                <FraudToggleRow key={key} flagKey={key} label={label} IconComp={Icon} flags={score.fraudFlags} />
              ))}
              {score.fraudFlags.length === 0 && (
                <div style={{
                  marginTop: 12, padding: "10px 14px", borderRadius: 10,
                  background: "#E8FAF4", display: "flex", alignItems: "center", gap: 8,
                }}>
                  <CheckCircle2 size={14} color="#1A9E73" />
                  <span style={{ fontSize: 12, color: "#1A9E73", fontWeight: 600 }}>
                    No anomalies detected across all checks
                  </span>
                </div>
              )}
            </Card>

            {/* ─── 5. Data Coverage ─────────────────────────────────────────── */}
            <Card title="Data Coverage" sub="Alternate data streams available for this merchant">
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                {[
                  { icon: TrendingUp, label: "UPI History",   value: "90 days", color: C.coral },
                  { icon: FileText,   label: "GST Periods",   value: merchant.gstin ? "4 filings" : "None", color: merchant.gstin ? C.blue : C.muted },
                  { icon: Database,   label: "AA Balance",    value: "180 days", color: C.teal },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} style={{
                    flex: 1, minWidth: 80,
                    background: C.bg, borderRadius: 12, padding: "12px 14px",
                    border: `1px solid ${C.border}`,
                    display: "flex", flexDirection: "column", gap: 6,
                  }}>
                    <Icon size={16} color={color} />
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{value}</p>
                    <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{label}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Coverage Tier</span>
                <TierBadge tier={score.coverageTier} />
              </div>
              {/* Coverage progress bar */}
              <div style={{ marginTop: 10 }}>
                <div style={{ background: C.border, borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    background: score.coverageTier === "FULL" ? C.teal : score.coverageTier === "PARTIAL" ? C.magenta : C.coral,
                    width: score.coverageTier === "FULL" ? "100%" : score.coverageTier === "PARTIAL" ? "66%" : "33%",
                    transition: "width 0.8s ease",
                  }} />
                </div>
              </div>
            </Card>

            {/* ─── 6. Assessment Note ───────────────────────────────────────── */}
            <Card title="Officer Assessment Note" sub="AI-generated plain-language rationale" style={{ gridColumn: "span 2" }}>
              <div style={{
                background: "#F0EEFF", borderRadius: 12, padding: "16px 18px",
                borderLeft: `4px solid ${C.magenta}`,
              }}>
                <p style={{
                  margin: 0, fontSize: 14, color: C.text, lineHeight: 1.75, fontWeight: 400,
                }}>
                  {score.explanation || "No explanation available."}
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                {[
                  { label: "GSTIN",   value: merchant.gstin || "Unregistered" },
                  { label: "VPA",     value: merchant.vpa },
                  { label: "Status",  value: sp(merchant.status).label },
                  { label: "Reg",     value: merchant.registrationStatus?.replace(/_/g, " ") },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", gap: 6, fontSize: 11, alignItems: "center" }}>
                    <span style={{ color: C.muted, fontWeight: 600 }}>{label}:</span>
                    <span style={{ color: C.text, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value}</span>
                  </div>
                ))}
              </div>
            </Card>

          </div>{/* /grid */}
        </div>{/* /content */}
      </main>
    </div>
  );
}
