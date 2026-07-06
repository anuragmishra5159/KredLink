/**
 * KredLink — Redesigned Dark Mode Glassmorphism Officer Dashboard
 * Sleek dark-indigo UI with glowing neon-gradient accents, glass blur effects,
 * and rich micro-animations.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, ListChecks, Store, BarChart2, Settings2,
  Bell, CheckCircle2, AlertTriangle, ChevronRight, LogOut,
  Zap, FileText, ShieldAlert, Users, RefreshCw, X,
  TrendingUp, Clock, Database, Search, ArrowRight, ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

// ─── Theme / Colour Config ──────────────────────────────────────────────────
const C = {
  bg:         "#060913",
  sidebar:    "rgba(10, 15, 30, 0.7)",
  card:       "rgba(20, 27, 54, 0.45)",
  cardHover:  "rgba(25, 35, 70, 0.55)",
  border:     "rgba(255, 255, 255, 0.05)",
  borderHover:"rgba(139, 92, 246, 0.3)",
  text:       "#F1F5F9",
  muted:      "#94A3B8",
  
  // Neon accents
  cyan:       "#06B6D4",   // UPI
  purple:     "#8B5CF6",   // GST
  emerald:    "#10B981",   // DSB
  pink:       "#EC4899",   // Overall / Warning
  
  // Gradients
  accentGrad: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)",
  approveGrad: "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)",
  flagGrad:    "linear-gradient(135deg, #EF4444 0%, #EC4899 100%)",
};

// Fallback Demo Data
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
    monthly:   SAMPLE[0].monthly,
    weeklyUpi: SAMPLE[0].weeklyUpi,
  };
}

const STATUS_CFG = {
  APPROVED_FOR_MICRO_CREDIT: { label: "Approved",     bg: "rgba(16, 185, 129, 0.12)", text: C.emerald },
  REVIEW_REQUIRED:            { label: "Review Req",   bg: "rgba(245, 158, 11, 0.12)",  text: "#F59E0B" },
  PENDING:                    { label: "Pending",      bg: "rgba(59, 130, 246, 0.12)",  text: "#3B82F6" },
  INSUFFICIENT_DATA:          { label: "Insufficient", bg: "rgba(239, 68, 68, 0.12)",   text: C.pink },
};

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      background: s.bg, color: s.text, border: `1px solid ${s.text}25`
    }}>
      {s.label}
    </span>
  );
}

// ─── Score Radial Ring ──────────────────────────────────────────────────────────
function ScoreRing({ value, max = 1, color, label, size = 110 }) {
  const pct = value != null ? Math.max(0, Math.min(1, max === 1 ? value : (value - 300) / 600)) : 0;
  const display = value == null ? "—" : max === 1 ? `${Math.round(value * 100)}%` : String(value);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[{ v: pct }, { v: 1 - pct }]}
              dataKey="v"
              cx="50%" cy="50%"
              innerRadius={size * 0.38} outerRadius={size * 0.46}
              startAngle={90} endAngle={-270}
              strokeWidth={0}
            >
              <Cell fill={color} style={{ filter: `drop-shadow(0 0 6px ${color}80)` }} />
              <Cell fill="rgba(255, 255, 255, 0.04)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <span style={{
            fontSize: size > 140 ? 32 : 18,
            fontWeight: 900, color: C.text, fontVariantNumeric: "tabular-nums",
            textShadow: `0 0 16px ${color}50`
          }}>
            {display}
          </span>
          {size > 100 && (
            <span style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>
              {max === 1 ? "value" : "/ 900"}
            </span>
          )}
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </span>
    </div>
  );
}

// ─── Fraud Toggle Row ─────────────────────────────────────────────────────────
function FraudRow({ flagKey, label, IconComp, flags }) {
  const hit = flags.find(f => f.flagType === flagKey);
  const on  = !!hit;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
      background: "rgba(255, 255, 255, 0.015)", border: `1px solid ${C.border}`,
      borderRadius: 12, marginBottom: 8, transition: "all 0.3s"
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: on ? "rgba(239, 68, 68, 0.12)" : "rgba(255, 255, 255, 0.03)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <IconComp size={16} color={on ? C.pink : C.muted} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: on ? C.text : C.muted }}>{label}</p>
        {on && <p style={{ margin: "2px 0 0", fontSize: 11, color: C.pink }}>{hit.evidenceRef}</p>}
      </div>
      {/* Toggle visual */}
      <div style={{
        width: 38, height: 20, borderRadius: 10,
        background: on ? C.pink : "rgba(255, 255, 255, 0.08)",
        position: "relative", cursor: "pointer", transition: "background 0.2s"
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 3, left: on ? 21 : 3, transition: "left 0.2s"
        }} />
      </div>
    </div>
  );
}

// ─── Custom Card Wrapper ──────────────────────────────────────────────────────
function WidgetCard({ children, title, sub, style = {} }) {
  return (
    <motion.div
      className="glass-card"
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        backdropFilter: "blur(12px)",
        ...style
      }}
      whileHover={{ y: -3, borderColor: C.borderHover }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {title && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {title}
          </h3>
          {sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>{sub}</p>}
        </div>
      )}
      {children}
    </motion.div>
  );
}

// ─── Overall Dashboard ──────────────────────────────────────────────────────────
export default function OfficerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [merchants, setMerchants]   = useState(SAMPLE);
  const [selectedId, setSelectedId] = useState(SAMPLE[0].id);
  const [toast, setToast]           = useState(null);
  const [deciding, setDeciding]     = useState(false);

  // Load live data from backend if present
  useEffect(() => {
    api.get("/merchants")
      .then(({ data }) => {
        if (data?.merchants?.length) {
          const mapped = data.merchants.map(mapApi);
          setMerchants(mapped);
          setSelectedId(mapped[0].id);
        }
      })
      .catch(() => {});
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
      showToast("success", decision === "APPROVED_FOR_MICRO_CREDIT" ? "Merchant Approved" : "Merchant Flagged");
    } catch {
      showToast("error", "Failed to apply decision");
    } finally { setDeciding(false); }
  };

  return (
    <div style={{
      background: C.bg,
      minHeight: "100vh",
      color: C.text,
      display: "grid",
      gridTemplateColumns: "240px 1fr",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Toast alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            style={{
              position: "fixed", top: 20, right: 20, zIndex: 1000,
              background: toast.type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)",
              color: "#fff", padding: "12px 20px", borderRadius: 12,
              display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              fontSize: 13, fontWeight: 700
            }}
          >
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SIDEBAR ─── */}
      <aside style={{
        background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0
      }}>
        {/* Brand Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: C.accentGrad,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 12px rgba(139, 92, 246, 0.4)"
          }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>KL</span>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}>KredLink</h1>
            <p style={{ margin: 0, fontSize: 10, color: C.muted, fontWeight: 600 }}>UNDERWRITING</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { icon: LayoutDashboard, label: "Dashboard", key: "d" },
            { icon: ListChecks, label: "Review Queue", key: "q", active: true },
            { icon: Store, label: "Merchants", key: "m" },
            { icon: BarChart2, label: "Reports", key: "r" },
            { icon: Settings2, label: "Settings", key: "s" }
          ].map(n => (
            <button
              key={n.key}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10, border: "none",
                background: n.active ? "rgba(139, 92, 246, 0.15)" : "transparent",
                color: n.active ? "#C084FC" : C.muted,
                fontFamily: "inherit", fontSize: 13, fontWeight: n.active ? 700 : 500,
                textAlign: "left", cursor: "pointer", transition: "all 0.2s"
              }}
            >
              <n.icon size={16} color={n.active ? "#C084FC" : C.muted} />
              {n.label}
            </button>
          ))}
        </nav>

        {/* Merchant Queue Selection */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 12px", borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "16px 12px 8px" }}>
            Active Queue
          </p>
          {merchants.map(m => {
            const active = m.id === selectedId;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: "none", cursor: "pointer", textAlign: "left",
                  background: active ? "rgba(255, 255, 255, 0.03)" : "transparent",
                  borderLeft: active ? `3px solid ${C.purple}` : "3px solid transparent",
                  fontFamily: "inherit", transition: "all 0.2s", marginBottom: 4
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: active ? C.text : C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>
                    {m.name}
                  </span>
                  <StatusBadge status={m.status} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Pinned radial FHS widget */}
        <div style={{ padding: "20px 16px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <ScoreRing value={score.final} max={900} color={C.purple} label="Overall FHS" size={90} />
        </div>

        {/* Logout */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={logout}
            style={{
              display: "flex", alignItems: "center", gap: 8, background: "none", border: "none",
              color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit"
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* ─── MAIN PORTAL CONTENT ─── */}
      <main style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {/* Top bar header */}
        <header style={{
          background: "rgba(10, 15, 30, 0.4)",
          borderBottom: `1px solid ${C.border}`,
          height: 64, padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 10
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Underwriting Cockpit</h2>
            <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Reviewing: {merchant.name}</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Action pills */}
            <motion.button
              onClick={() => handleDecision("APPROVED_FOR_MICRO_CREDIT")}
              disabled={deciding}
              style={{
                background: C.approveGrad, color: "#fff", border: "none",
                borderRadius: 20, padding: "8px 18px", fontSize: 12, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                boxShadow: "0 0 12px rgba(16, 185, 129, 0.3)"
              }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              <CheckCircle2 size={13} /> Approve Credit
            </motion.button>

            <motion.button
              onClick={() => handleDecision("REVIEW_REQUIRED")}
              disabled={deciding}
              style={{
                background: "transparent", color: C.pink,
                border: `1.5px solid ${C.pink}`,
                borderRadius: 20, padding: "7px 16px", fontSize: 12, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6
              }}
              whileHover={{ scale: 1.03, background: "rgba(236, 72, 153, 0.05)" }} whileTap={{ scale: 0.97 }}
            >
              <AlertTriangle size={13} /> Flag Review
            </motion.button>

            <div style={{ width: 1, height: 24, background: C.border }} />

            {/* Officer Meta */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: C.accentGrad, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, color: "#fff"
              }}>
                {(user?.name || "O")[0]}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{user?.name || "Officer"}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Grid */}
        <div style={{ padding: 24, flex: 1, overflowY: "auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20
          }}>
            
            {/* 1. Score composition rings */}
            <WidgetCard title="Underwriting Score Composition" sub="FHS composite components" style={{ gridColumn: "span 2" }}>
              <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <ScoreRing value={score.final} max={900} color={C.purple} label="FHS Composite" size={150} />
                <div style={{ width: 1, height: 100, background: C.border }} />
                <ScoreRing value={score.components.uVel} max={1} color={C.cyan} label="UPI Velocity" size={100} />
                <ScoreRing value={score.components.gstAuth} max={1} color={C.purple} label="GST Authenticity" size={100} />
                <ScoreRing value={score.components.dsb} max={1} color={C.emerald} label="Debt Serviceability" size={100} />
              </div>

              {/* Weights bar */}
              <div style={{ marginTop: 20, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 8, background: "rgba(255,255,255,0.03)" }}>
                  <div style={{ flex: score.weights.w1 || 0.3, background: C.cyan }} />
                  <div style={{ flex: score.weights.w2 || 0.4, background: C.purple }} />
                  <div style={{ flex: score.weights.w3 || 0.3, background: C.emerald }} />
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 8, justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: C.cyan }} />
                    UPI ({Math.round((score.weights.w1 || 0.3) * 100)}%)
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: C.purple }} />
                    GST ({Math.round((score.weights.w2 || 0.4) * 100)}%)
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: C.emerald }} />
                    DSB ({Math.round((score.weights.w3 || 0.3) * 100)}%)
                  </div>
                </div>
              </div>
            </WidgetCard>

            {/* 2. GST vs Bank Deposits Area chart */}
            <WidgetCard title="GST Turnover vs verified deposits" sub="Monthly data alignment comparison">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={monthly} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.purple} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={C.purple} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.emerald} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={C.emerald} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "#0D1326", borderColor: C.border, borderRadius: 8, color: C.text }} />
                  <Area type="monotone" dataKey="gstTurnover" stroke={C.purple} fillOpacity={1} fill="url(#gPurple)" strokeWidth={2} name="GST Sales" />
                  <Area type="monotone" dataKey="deposits" stroke={C.emerald} fillOpacity={1} fill="url(#gEmerald)" strokeWidth={2} name="AA Deposits" />
                </AreaChart>
              </ResponsiveContainer>
            </WidgetCard>

            {/* 3. Weekly UPI Inflow chart */}
            <WidgetCard title="Weekly UPI Inflow Trend" sub="Daily transaction velocity monitor">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={weeklyUpi} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gCyan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.cyan} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={C.cyan} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "#0D1326", borderColor: C.border, borderRadius: 8, color: C.text }} />
                  <Area type="monotone" dataKey="amount" stroke={C.cyan} fillOpacity={1} fill="url(#gCyan)" strokeWidth={2} name="UPI Inflow" />
                </AreaChart>
              </ResponsiveContainer>
            </WidgetCard>

            {/* 4. Fraud anomaly signals */}
            <WidgetCard title="Fraud & Anomaly signals" sub="Real-time transaction compliance scan">
              <FraudRow flagKey="COUNTERPARTY_CONCENTRATION" label="Counterparty Concentration" IconComp={Users} flags={score.fraudFlags} />
              <FraudRow flagKey="CIRCULAR_TXN" label="Circular Transactions" IconComp={RefreshCw} flags={score.fraudFlags} />
              <FraudRow flagKey="INVOICE_MISMATCH" label="Invoice-Payment Mismatches" IconComp={FileText} flags={score.fraudFlags} />
            </WidgetCard>

            {/* 5. Data coverage stats */}
            <WidgetCard title="Data Stream Coverage" sub="Verified registry availability checks">
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "UPI", val: "90 days", color: C.cyan },
                  { label: "GST", val: merchant.gstin ? "4 Periods" : "None", color: C.purple },
                  { label: "AA Balance", val: "180 days", color: C.emerald }
                ].map(s => (
                  <div key={s.label} style={{
                    flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${C.border}`, borderRadius: 12, textAlign: "center"
                  }}>
                    <p style={{ margin: 0, fontSize: 10, color: C.muted, fontWeight: 700 }}>{s.label}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 800, color: s.color }}>{s.val}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: C.muted }}>Validated Tier:</span>
                <span style={{ fontWeight: 800, color: C.purple }}>{score.coverageTier}</span>
              </div>
            </WidgetCard>

            {/* 6. AI Rational / Explanation text */}
            <WidgetCard title="AI Underwriting Explanation" sub="Plain-language decision explanation" style={{ gridColumn: "span 2" }}>
              <div style={{
                background: "rgba(139, 92, 246, 0.05)", borderLeft: `4px solid ${C.purple}`,
                padding: "16px 20px", borderRadius: "0 12px 12px 0", fontSize: 13,
                lineHeight: 1.7, color: "#E2E8F0"
              }}>
                {score.explanation}
              </div>
              
              {/* Merchant registry parameters */}
              <div style={{ display: "flex", gap: 20, marginTop: 16, fontSize: 11, color: C.muted }}>
                <div>GSTIN: <span style={{ color: C.text, fontFamily: "monospace" }}>{merchant.gstin || "N/A"}</span></div>
                <div>UPI VPA: <span style={{ color: C.text, fontFamily: "monospace" }}>{merchant.vpa}</span></div>
                <div>Reg: <span style={{ color: C.text }}>{merchant.registrationStatus}</span></div>
              </div>
            </WidgetCard>

          </div>
        </div>
      </main>
    </div>
  );
}
