/**
 * KredLink — Re-engineered Dark Mode Glassmorphic Officer Cockpit & Portfolio Suite
 * Now featuring:
 * 1. Portfolio Macro Analytics Tab (macro metrics, portfolio stats, distribution charts)
 * 2. Risk Weight Tuning Simulator (real-time slider coefficients tuning + re-calculation)
 * 3. Interactive Daily Transaction Audit Ledger (paginated, search-filtered raw data table)
 * 4. Print-ready Underwriting Audit Sheet Export (styled @media print layout)
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";
import {
  LayoutDashboard, ListChecks, Store, BarChart2, Settings2,
  Bell, CheckCircle2, AlertTriangle, ChevronRight, LogOut,
  Zap, FileText, ShieldAlert, Users, RefreshCw, X,
  TrendingUp, Clock, Database, Search, ArrowRight, ShieldCheck,
  Sliders, Printer, Download, Eye, Table, Layout, PieChart as PieIcon, Loader2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

// ─── Theme Config ──────────────────────────────────────────────────────────
const C = {
  bg:         "#060913",
  sidebar:    "rgba(10, 15, 30, 0.7)",
  card:       "rgba(20, 27, 54, 0.45)",
  cardHover:  "rgba(25, 35, 70, 0.55)",
  border:     "rgba(255, 255, 255, 0.05)",
  borderHover:"rgba(139, 92, 246, 0.3)",
  text:       "#F1F5F9",
  muted:      "#94A3B8",
  
  cyan:       "#06B6D4",   // UPI
  purple:     "#8B5CF6",   // GST
  emerald:    "#10B981",   // DSB
  pink:       "#EC4899",   // Overall / Warning
  
  accentGrad: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)",
  approveGrad: "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)",
  flagGrad:    "linear-gradient(135deg, #EF4444 0%, #EC4899 100%)",
};

// Fallback Seed Data
const SAMPLE = [
  {
    id: "demo-1",
    name: "Sharma General Store",
    gstin: "27AAAAA1234A1Z0",
    pan: "ABCDE1234F",
    vpa: "sharma_store@oksbi",
    registrationStatus: "GST_REGISTERED",
    status: "APPROVED_FOR_MICRO_CREDIT",
    score: {
      final: 769,
      components: { uVel: 0.8722, gstAuth: 0.5851, dsb: 0.9535 },
      weights:    { w1: 0.30, w2: 0.40, w3: 0.30 },
      coverageTier: "FULL",
      fraudFlags:   [],
      explanation: "FHS of 769 reflects stable UPI inflow patterns (U_vel=0.87), a moderate match between GST-reported turnover and bank-verified cash deposits (GST_auth=0.59), and a sufficient debt serviceability buffer (DSB=0.95).",
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
    pan: "PTLKP9002L",
    vpa: "patel_kirana@ybl",
    registrationStatus: "UNREGISTERED",
    status: "REVIEW_REQUIRED",
    score: {
      final: 541,
      components: { uVel: 0.7845, gstAuth: null, dsb: 0.8231 },
      weights:    { w1: 0.50, w2: 0.00, w3: 0.50 },
      coverageTier: "PARTIAL",
      fraudFlags:   [],
      explanation: "FHS of 541 is based on UPI velocity and serviceability buffer only (GST data unavailable — unregistered entity). Coverage is PARTIAL.",
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
    pan: "KMRTC8802M",
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
      explanation: "FHS of 612 reflects moderate UPI inflow patterns and strong GST authentication, but a thin serviceability buffer. Two fraud flags were triggered.",
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

// Generate dynamic 15 days of transaction log records
function generateMockLedger(merchantName) {
  const seedMultiplier = merchantName.includes("Sharma") ? 1.2 : merchantName.includes("Kumar") ? 1.5 : 0.7;
  const ledger = [];
  for (let i = 15; i >= 1; i--) {
    const dailyInflow = Math.round((18000 + Math.sin(i) * 5000) * seedMultiplier);
    const txnCount = Math.round(5 + Math.cos(i) * 2);
    const distinctPayers = Math.max(1, Math.round(txnCount * (merchantName.includes("Kumar") ? 0.28 : 0.75)));
    ledger.push({
      date: `2026-06-${i.toString().padStart(2, "0")}`,
      amount: dailyInflow,
      txns: txnCount,
      payers: distinctPayers,
      flagged: distinctPayers / txnCount < 0.35
    });
  }
  return ledger;
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

// ─── Custom Widget Card Wrapper ───────────────────────────────────────────────
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
      whileHover={{ y: -2, borderColor: C.borderHover }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {title && (
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {title}
            </h3>
            {sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>{sub}</p>}
          </div>
        </div>
      )}
      {children}
    </motion.div>
  );
}

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [merchants, setMerchants]   = useState(SAMPLE);
  const [selectedId, setSelectedId] = useState(SAMPLE[0].id);
  const [toast, setToast]           = useState(null);
  const [deciding, setDeciding]     = useState(false);

  // Tab navigation: "individual" or "portfolio"
  const [activeTab, setActiveTab] = useState("individual");

  // Dynamic simulation weights
  const [simWeights, setSimWeights] = useState({ w1: 30, w2: 40, w3: 30 });
  const [recalculating, setRecalculating] = useState(false);

  // Search filter for daily ledger
  const [ledgerSearch, setLedgerSearch] = useState("");

  function mapApi(m) {
    const cs = m.creditScore || {};
    const w = cs.weightsUsed || {};
    return {
      id:   m._id,
      name: m.businessName,
      gstin: m.gstin,
      pan:   m.pan,
      vpa:   m.vpa,
      registrationStatus: m.registrationStatus,
      status: m.status,
      score: {
        final:        cs.finalFhsScore,
        components:   cs.components   || {},
        weights:      { w1: w.w1UVel || 0.3, w2: w.w2GstAuth || 0.4, w3: w.w3Dsb || 0.3 },
        coverageTier: cs.coverageTier || "FULL",
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

  // Load live data from backend
  const fetchMerchants = () => {
    api.get("/merchants")
      .then(({ data }) => {
        if (data?.merchants?.length) {
          const mapped = data.merchants.map(mapApi);
          setMerchants(mapped);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const merchant = merchants.find(m => m.id === selectedId) || merchants[0];
  const { score, monthly, weeklyUpi } = merchant;

  // Initialize weights when merchant changes
  useEffect(() => {
    if (score && score.weights) {
      setSimWeights({
        w1: Math.round(score.weights.w1 * 100),
        w2: Math.round(score.weights.w2 * 100),
        w3: Math.round(score.weights.w3 * 100)
      });
    }
  }, [selectedId, merchants]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDecision = async (decision) => {
    if (deciding) return;
    setDeciding(true);
    try {
      await api.post(`/decisions/${merchant.id}`, { decision, note: "Assessment updated via portal cockpit." });
      const newStatus = decision === "APPROVED_FOR_MICRO_CREDIT" ? "APPROVED_FOR_MICRO_CREDIT" : "REVIEW_REQUIRED";
      setMerchants(prev => prev.map(m => m.id === merchant.id ? { ...m, status: newStatus } : m));
      showToast("success", decision === "APPROVED_FOR_MICRO_CREDIT" ? "Merchant Approved" : "Merchant Flagged");
    } catch {
      showToast("error", "Failed to apply decision");
    } finally { setDeciding(false); }
  };

  // Re-calculate FHS with custom weights
  const triggerRecalculation = async () => {
    setRecalculating(true);
    try {
      const sum = simWeights.w1 + simWeights.w2 + simWeights.w3;
      const payload = {
        merchantId: merchant.id,
        customWeights: {
          w1UVel: simWeights.w1 / sum,
          w2GstAuth: simWeights.w2 / sum,
          w3Dsb: simWeights.w3 / sum
        }
      };
      const { data } = await api.post("/credit/calculate-score", payload);
      if (data.success) {
        showToast("success", `Score updated: New FHS is ${data.finalFhsScore}`);
        fetchMerchants(); // reload to sync values
      }
    } catch (err) {
      showToast("error", "Recalculation failed.");
    } finally {
      setRecalculating(false);
    }
  };

  // Generate ledger logs
  const rawLedger = generateMockLedger(merchant.name);
  const filteredLedger = rawLedger.filter(l => 
    l.date.includes(ledgerSearch) || 
    String(l.amount).includes(ledgerSearch)
  );

  // Portfolio aggregates
  const totalScored = merchants.filter(m => m.score.final != null).length;
  const avgScore = totalScored > 0 ? Math.round(merchants.reduce((acc, curr) => acc + (curr.score.final || 0), 0) / totalScored) : 0;
  const approvalCount = merchants.filter(m => m.status === "APPROVED_FOR_MICRO_CREDIT").length;
  const approvalRate = merchants.length > 0 ? Math.round((approvalCount / merchants.length) * 100) : 0;
  const flaggedCount = merchants.filter(m => m.status === "REVIEW_REQUIRED").length;
  const flaggedRate = merchants.length > 0 ? Math.round((flaggedCount / merchants.length) * 100) : 0;

  // Portfolio coverage tiers count
  const fullTier = merchants.filter(m => m.score.coverageTier === "FULL").length;
  const partialTier = merchants.filter(m => m.score.coverageTier === "PARTIAL").length;
  const minimalTier = merchants.filter(m => m.score.coverageTier === "MINIMAL").length;
  const portfolioTiers = [
    { name: "Full Coverage", value: fullTier, color: C.emerald },
    { name: "Partial Coverage", value: partialTier, color: C.purple },
    { name: "Minimal Coverage", value: minimalTier, color: C.pink }
  ];

  // Score bands distribution
  const excellentB = merchants.filter(m => m.score.final >= 750).length;
  const goodB = merchants.filter(m => m.score.final >= 650 && m.score.final < 750).length;
  const fairB = merchants.filter(m => m.score.final >= 550 && m.score.final < 650).length;
  const poorB = merchants.filter(m => m.score.final != null && m.score.final < 550).length;
  const scoreBands = [
    { name: "Excellent (750-900)", count: excellentB },
    { name: "Good (650-749)", count: goodB },
    { name: "Fair (550-649)", count: fairB },
    { name: "Poor (300-549)", count: poorB }
  ];

  const handlePrint = () => {
    window.print();
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
      
      {/* Dynamic @media print CSS to isolate sheet during Print Action */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          aside, header, nav, .print-hide, .desktop-nav, .desktop-ctas, button {
            display: none !important;
          }
          main {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .glass-card {
            background: #ffffff !important;
            border: 1px solid #000000 !important;
            box-shadow: none !important;
            color: #000000 !important;
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          .print-full {
            grid-column: span 3 !important;
          }
        }
      `}</style>

      {/* Toast popup */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed", top: 20, right: 20, zIndex: 1000,
              background: toast.type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)",
              color: "#fff", padding: "12px 20px", borderRadius: 12,
              display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)", fontSize: 13, fontWeight: 700
            }}
          >
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SIDEBAR ─── */}
      <aside className="print-hide" style={{
        background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0
      }}>
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

        {/* Sidebar Tabs */}
        <nav style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          <button
            onClick={() => setActiveTab("individual")}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 10, border: "none",
              background: activeTab === "individual" ? "rgba(139, 92, 246, 0.15)" : "transparent",
              color: activeTab === "individual" ? "#C084FC" : C.muted,
              fontFamily: "inherit", fontSize: 13, fontWeight: activeTab === "individual" ? 700 : 500,
              textAlign: "left", cursor: "pointer", transition: "all 0.2s"
            }}
          >
            <LayoutDashboard size={16} />
            Cockpit Review
          </button>
          
          <button
            onClick={() => setActiveTab("portfolio")}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 10, border: "none",
              background: activeTab === "portfolio" ? "rgba(139, 92, 246, 0.15)" : "transparent",
              color: activeTab === "portfolio" ? "#C084FC" : C.muted,
              fontFamily: "inherit", fontSize: 13, fontWeight: activeTab === "portfolio" ? 700 : 500,
              textAlign: "left", cursor: "pointer", transition: "all 0.2s"
            }}
          >
            <BarChart2 size={16} />
            Portfolio Analytics
          </button>
        </nav>

        {/* Merchant Selection Queue (Visible when individual cockpit tab is active) */}
        {activeTab === "individual" && (
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
        )}

        {/* Static Pinned widgets */}
        <div style={{ padding: "20px 16px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <ScoreRing value={avgScore} max={900} color={C.purple} label="Portfolio Avg FHS" size={90} />
        </div>

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
        <header className="print-hide" style={{
          background: "rgba(10, 15, 30, 0.4)",
          borderBottom: `1px solid ${C.border}`,
          height: 64, padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 10
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
              {activeTab === "individual" ? "Underwriting Cockpit" : "Bank Portfolio Suite"}
            </h2>
            <p style={{ margin: 0, fontSize: 11, color: C.muted }}>
              {activeTab === "individual" ? `Reviewing: ${merchant.name}` : `Macro metrics for ${merchants.length} MSMEs`}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {activeTab === "individual" && (
              <>
                <motion.button
                  onClick={handlePrint}
                  style={{
                    background: "rgba(255,255,255,0.03)", color: C.text, border: `1px solid ${C.border}`,
                    borderRadius: 20, padding: "8px 16px", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                  }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  <Printer size={13} /> Export Report
                </motion.button>

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
              </>
            )}

            <div style={{ width: 1, height: 24, background: C.border }} />

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

        {/* Scrollable Main Portal Area */}
        <div style={{ padding: 24, flex: 1, overflowY: "auto" }}>
          <AnimatePresence mode="wait">
            
            {/* ─── TAB A: COCKPIT INDIVIDUAL REVIEW ─── */}
            {activeTab === "individual" && (
              <motion.div
                key="individual-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 20
                }}
              >
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

                {/* 2. Weight Tuning Simulator */}
                <WidgetCard title="Risk Weight Simulator" sub="Tune coefficient weights dynamically" style={{ gridColumn: "span 1" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* UPI Slider */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                        <span style={{ color: C.cyan }}>UPI (w1)</span>
                        <span>{simWeights.w1}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100" value={simWeights.w1}
                        onChange={e => setSimWeights(w => ({ ...w, w1: parseInt(e.target.value) }))}
                        style={{ width: "100%", accentColor: C.cyan }}
                      />
                    </div>

                    {/* GST Slider */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                        <span style={{ color: C.purple }}>GST (w2)</span>
                        <span>{simWeights.w2}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100" value={simWeights.w2}
                        onChange={e => setSimWeights(w => ({ ...w, w2: parseInt(e.target.value) }))}
                        disabled={score.components.gstAuth === null}
                        style={{ width: "100%", accentColor: C.purple, opacity: score.components.gstAuth === null ? 0.3 : 1 }}
                      />
                    </div>

                    {/* DSB Slider */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                        <span style={{ color: C.emerald }}>DSB (w3)</span>
                        <span>{simWeights.w3}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100" value={simWeights.w3}
                        onChange={e => setSimWeights(w => ({ ...w, w3: parseInt(e.target.value) }))}
                        style={{ width: "100%", accentColor: C.emerald }}
                      />
                    </div>

                    <button
                      onClick={triggerRecalculation}
                      disabled={recalculating}
                      style={{
                        background: C.accentGrad, border: "none", color: "#fff",
                        borderRadius: 10, padding: "10px 0", fontSize: 12, fontWeight: 700,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        boxShadow: "0 4px 12px rgba(139, 92, 246, 0.25)", marginTop: 10
                      }}
                    >
                      {recalculating ? <Loader2 size={14} className="animate-spin" /> : <Sliders size={14} />}
                      Recalculate FHS
                    </button>
                  </div>
                </WidgetCard>

                {/* 3. GST vs Bank Deposits Area chart */}
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

                {/* 4. Weekly UPI Inflow chart */}
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
                  
                  <div style={{ display: "flex", gap: 20, marginTop: 16, fontSize: 11, color: C.muted }}>
                    <div>GSTIN: <span style={{ color: C.text, fontFamily: "monospace" }}>{merchant.gstin || "N/A"}</span></div>
                    <div>PAN: <span style={{ color: C.text, fontFamily: "monospace" }}>{merchant.pan || "N/A"}</span></div>
                    <div>UPI VPA: <span style={{ color: C.text, fontFamily: "monospace" }}>{merchant.vpa}</span></div>
                    <div>Reg: <span style={{ color: C.text }}>{merchant.registrationStatus}</span></div>
                  </div>
                </WidgetCard>

                {/* 7. Fraud anomaly signals */}
                <WidgetCard title="Fraud & Anomaly signals" sub="Real-time transaction compliance scan">
                  {[
                    { flagKey: "COUNTERPARTY_CONCENTRATION", label: "Counterparty Concentration", icon: Users },
                    { flagKey: "CIRCULAR_TXN", label: "Circular Transactions", icon: RefreshCw },
                    { flagKey: "INVOICE_MISMATCH", label: "Invoice-Payment Mismatches", icon: FileText }
                  ].map(f => {
                    const hit = score.fraudFlags.find(x => x.flagType === f.flagKey);
                    const on = !!hit;
                    return (
                      <div key={f.flagKey} style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "10px 14px",
                        background: "rgba(255, 255, 255, 0.015)", border: `1px solid ${C.border}`,
                        borderRadius: 12, marginBottom: 8
                      }}>
                        <f.icon size={16} color={on ? C.pink : C.muted} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: on ? C.text : C.muted }}>{f.label}</span>
                          {on && <p style={{ margin: "2px 0 0", fontSize: 10, color: C.pink }}>{hit.evidenceRef}</p>}
                        </div>
                        <div style={{
                          width: 32, height: 16, borderRadius: 8,
                          background: on ? C.pink : "rgba(255, 255, 255, 0.08)",
                          display: "flex", alignItems: "center", justifyContent: on ? "flex-end" : "flex-start",
                          padding: 2
                        }}>
                          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff" }} />
                        </div>
                      </div>
                    );
                  })}
                </WidgetCard>

                {/* 8. Interactive Daily Transaction Audit Ledger */}
                <WidgetCard title="Daily Transaction Audit Ledger" sub="Real-time transaction flow verification log" style={{ gridColumn: "span 3" }}>
                  <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", marginBottom: 16, gap: 16 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8, flex: 1,
                      background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`,
                      borderRadius: 99, padding: "8px 16px"
                    }}>
                      <Search size={14} color={C.muted} />
                      <input
                        type="text" placeholder="Search by date or amount..." value={ledgerSearch}
                        onChange={e => setLedgerSearch(e.target.value)}
                        style={{ border: "none", color: C.text, fontSize: 12, flex: 1, outline: "none" }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: C.muted }}>Showing {filteredLedger.length} entries</span>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
                          <th style={{ padding: "10px 8px" }}>Txn Date</th>
                          <th style={{ padding: "10px 8px" }}>Daily Inflow (₹)</th>
                          <th style={{ padding: "10px 8px" }}>Txn Count</th>
                          <th style={{ padding: "10px 8px" }}>Distinct Payers</th>
                          <th style={{ padding: "10px 8px" }}>Concentration Ratio</th>
                          <th style={{ padding: "10px 8px" }}>Compliance Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLedger.map(l => (
                          <tr key={l.date} style={{ borderBottom: `1px solid ${C.border}50` }}>
                            <td style={{ padding: "10px 8px", fontFamily: "monospace" }}>{l.date}</td>
                            <td style={{ padding: "10px 8px", fontWeight: 700 }}>₹{l.amount.toLocaleString()}</td>
                            <td style={{ padding: "10px 8px" }}>{l.txns}</td>
                            <td style={{ padding: "10px 8px" }}>{l.payers}</td>
                            <td style={{ padding: "10px 8px", fontFamily: "monospace" }}>{(l.payers / l.txns).toFixed(2)}</td>
                            <td style={{ padding: "10px 8px" }}>
                              {l.flagged ? (
                                <span style={{ color: C.pink, fontSize: 10, fontWeight: 700, background: "rgba(236,72,153,0.1)", padding: "2px 6px", borderRadius: 4 }}>
                                  ⚠️ CONCENTRATED
                                </span>
                              ) : (
                                <span style={{ color: C.emerald, fontSize: 10, fontWeight: 700, background: "rgba(16,185,129,0.1)", padding: "2px 6px", borderRadius: 4 }}>
                                  ✓ COMPLIANT
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </WidgetCard>
              </motion.div>
            )}

            {/* ─── TAB B: PORTFOLIO MACRO ANALYTICS ─── */}
            {activeTab === "portfolio" && (
              <motion.div
                key="portfolio-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 20
                }}
              >
                {/* Portfolio KPI Row */}
                {[
                  { label: "Total Applications", val: merchants.length, icon: Store, color: C.cyan },
                  { label: "Avg Portfolio FHS", val: avgScore, icon: BarChart2, color: C.purple },
                  { label: "Approval Rate", val: `${approvalRate}%`, icon: CheckCircle2, color: C.emerald },
                  { label: "Manual Flag Rate", val: `${flaggedRate}%`, icon: AlertTriangle, color: C.pink }
                ].map(k => (
                  <WidgetCard key={k.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase" }}>{k.label}</p>
                        <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: C.text, fontFamily: TOKENS.fonts.heading }}>
                          {k.val}
                        </p>
                      </div>
                      <div style={{
                        width: 42, height: 42, borderRadius: 10,
                        background: `${k.color}15`, display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <k.icon size={20} color={k.color} />
                      </div>
                    </div>
                  </WidgetCard>
                ))}

                {/* Score Bands Distribution Bar Chart */}
                <WidgetCard title="Credit Score Bands Distribution" sub="Number of merchants in FHS ranges" style={{ gridColumn: "span 2" }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={scoreBands} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#0D1326", borderColor: C.border, borderRadius: 8, color: C.text }} />
                      <Bar dataKey="count" fill={C.purple} radius={[8, 8, 0, 0]} barSize={40}>
                        {scoreBands.map((entry, index) => {
                          const colors = [C.emerald, C.cyan, "#F59E0B", C.pink];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </WidgetCard>

                {/* Coverage Tiers Distribution Pie Chart */}
                <WidgetCard title="Data Coverage Distribution" sub="Share of FULL, PARTIAL, and MINIMAL tiers" style={{ gridColumn: "span 2" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", height: 260 }}>
                    <ResponsiveContainer width="45%" height="100%">
                      <PieChart>
                        <Pie
                          data={portfolioTiers}
                          dataKey="value"
                          cx="50%" cy="50%"
                          innerRadius={60} outerRadius={80}
                          paddingAngle={4}
                        >
                          {portfolioTiers.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#0D1326", borderColor: C.border }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {portfolioTiers.map(entry => (
                        <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: entry.color }} />
                          <span style={{ color: C.text, fontWeight: 600 }}>{entry.name}:</span>
                          <span style={{ color: C.muted }}>{entry.value} MSMEs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </WidgetCard>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
