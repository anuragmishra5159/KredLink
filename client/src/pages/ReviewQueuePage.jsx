import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, LogOut, ChevronRight, AlertTriangle, CheckCircle2, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import FhsGauge from "../components/FhsGauge";
import CoverageTierIndicator from "../components/CoverageTierIndicator";

const STATUS_PILL = {
  PENDING:                   { label: "Pending",     bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  PROCESSING:                { label: "Processing",  bg: "rgba(59,130,246,0.12)",  text: "#3B82F6" },
  APPROVED_FOR_MICRO_CREDIT: { label: "Approved",    bg: "rgba(16,185,129,0.12)",  text: "#10B981" },
  REVIEW_REQUIRED:           { label: "Review",      bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  INSUFFICIENT_DATA:         { label: "Insufficient",bg: "rgba(239,68,68,0.12)",   text: "#EF4444" },
};

function StatusPill({ status }) {
  const s = STATUS_PILL[status] || STATUS_PILL.PENDING;
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

const rowVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" },
  }),
};

const FILTERS = ["ALL", "REVIEW_REQUIRED", "APPROVED_FOR_MICRO_CREDIT", "PENDING"];

export default function ReviewQueuePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("ALL");

  const fetchQueue = async () => {
    try {
      const { data } = await api.get("/merchants");
      setMerchants(data.merchants);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = merchants.filter((m) => filter === "ALL" ? true : m.status === filter);

  const stats = [
    { label: "Total",       value: merchants.length,                                                       color: "#94A3B8" },
    { label: "Need Review", value: merchants.filter((m) => m.status === "REVIEW_REQUIRED").length,         color: "#F59E0B" },
    { label: "Approved",    value: merchants.filter((m) => m.status === "APPROVED_FOR_MICRO_CREDIT").length,color: "#10B981" },
    { label: "Pending",     value: merchants.filter((m) => ["PENDING","PROCESSING"].includes(m.status)).length, color: "#3B82F6" },
  ];

  return (
    <motion.div
      className="min-h-screen bg-navy-900 bg-grid"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="fixed top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navbar */}
      <motion.nav
        className="relative z-10 border-b border-white/5 px-6 py-4 flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-violet flex items-center justify-center"
            whileHover={{ rotate: 8, scale: 1.1 }} transition={{ type: "spring", stiffness: 400 }}
          >
            <span className="text-white font-black text-xs">KL</span>
          </motion.div>
          <div>
            <span className="text-white font-bold text-sm">KredLink</span>
            <span className="text-slate-500 text-xs block -mt-0.5">Officer Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <motion.button
            onClick={fetchQueue}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
            whileHover={{ rotate: 180 }} transition={{ duration: 0.4 }}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </motion.button>
          <div className="flex items-center gap-2">
            <motion.div
              className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
            >
              <Users size={13} className="text-brand" />
            </motion.div>
            <span className="text-slate-300 text-sm hidden sm:block">{user?.name}</span>
          </div>
          <motion.button
            onClick={logout}
            className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 transition-colors text-xs"
            whileHover={{ x: 2 }}
          >
            <LogOut size={13} /> Sign out
          </motion.button>
        </div>
      </motion.nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl font-bold text-white mb-1">Review Queue</h1>
          <p className="text-slate-500 text-sm">Merchant applications ranked by Financial Health Score</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="glass rounded-xl p-4"
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.4 }}
              whileHover={{ y: -2, scale: 1.02 }}
            >
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <motion.p
                className="text-2xl font-black"
                style={{ color: s.color }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.07 }}
              >
                {s.value}
              </motion.p>
            </motion.div>
          ))}
        </div>

        {/* Filter tabs */}
        <motion.div
          className="flex gap-2 mb-4 overflow-x-auto pb-1"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          {FILTERS.map((f) => (
            <motion.button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap relative"
              style={{ color: filter === f ? "#3B82F6" : "#64748B" }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            >
              {filter === f && (
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.35)" }}
                  layoutId="filter-active"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                {f === "ALL" ? "All" : f.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                {" "}
                <span className="opacity-50">
                  {f === "ALL" ? merchants.length : merchants.filter((m) => m.status === f).length}
                </span>
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <RefreshCw size={24} className="text-brand" />
            </motion.div>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            className="glass rounded-2xl p-12 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <p className="text-slate-500">No applications in this category yet.</p>
          </motion.div>
        ) : (
          <motion.div
            className="glass rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          >
            {/* Header row */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/5">
              <div className="col-span-4">Business</div>
              <div className="col-span-2 text-center">FHS Score</div>
              <div className="col-span-2 text-center">Coverage</div>
              <div className="col-span-2 text-center">Flags</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1" />
            </div>

            <AnimatePresence mode="popLayout">
              {filtered.map((m, idx) => {
                const score     = m.creditScore;
                const flagCount = score?.fraudFlags?.length || 0;

                return (
                  <motion.div
                    key={m._id}
                    custom={idx}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: 16 }}
                    layout
                    onClick={() => navigate(`/officer/merchant/${m._id}`)}
                    className="grid grid-cols-12 gap-4 px-5 py-4 items-center cursor-pointer border-b border-white/4 group"
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.025)", x: 2 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="col-span-4">
                      <p className="text-sm font-semibold text-white group-hover:text-brand transition-colors truncate">
                        {m.businessName}
                      </p>
                      <p className="text-xs text-slate-500 font-mono truncate">{m.gstin || m.pan}</p>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      {score?.finalFhsScore ? (
                        <FhsGauge score={score.finalFhsScore} size="sm" />
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </div>

                    <div className="col-span-2 flex justify-center">
                      {score?.coverageTier ? (
                        <CoverageTierIndicator tier={score.coverageTier} />
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </div>

                    <div className="col-span-2 flex justify-center">
                      {flagCount > 0 ? (
                        <motion.span
                          className="badge text-xs flex items-center gap-1"
                          style={{ background: "rgba(239,68,68,0.15)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.3)" }}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <AlertTriangle size={10} /> {flagCount} flag{flagCount > 1 ? "s" : ""}
                        </motion.span>
                      ) : (
                        <span className="text-emerald-600 text-xs flex items-center gap-1">
                          <CheckCircle2 size={12} /> Clean
                        </span>
                      )}
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <StatusPill status={m.status} />
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <motion.div
                        className="text-slate-600 group-hover:text-brand transition-colors"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <ChevronRight size={16} />
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
