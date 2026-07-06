import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Loader2,
  ChevronRight, X, LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import FhsGauge from "../components/FhsGauge";
import TurnoverChart from "../components/TurnoverChart";
import FraudFlagBadge from "../components/FraudFlagBadge";
import CoverageTierIndicator from "../components/CoverageTierIndicator";
import ScoreBreakdownCard from "../components/ScoreBreakdownCard";

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" },
  }),
};

export default function MerchantDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [merchant, setMerchant]       = useState(null);
  const [creditScore, setCreditScore] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [deciding, setDeciding]       = useState(false);
  const [note, setNote]               = useState("");
  const [toast, setToast]             = useState(null);
  const [showModal, setShowModal]     = useState(null); // 'approve' | 'review'

  const fetchData = async () => {
    try {
      const { data } = await api.get(`/merchants/${id}`);
      setMerchant(data.merchant);
      setCreditScore(data.creditScore);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const makeDecision = async (decision) => {
    setDeciding(true);
    try {
      await api.post(`/decisions/${id}`, { decision, note });
      await fetchData();
      setShowModal(null);
      setToast({ type: "success", msg: decision === "APPROVED_FOR_MICRO_CREDIT" ? "Application approved successfully." : "Flagged for manual review." });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setToast({ type: "error", msg: err.response?.data?.message || "Decision failed." });
      setTimeout(() => setToast(null), 4000);
    } finally { setDeciding(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 size={32} className="text-brand" />
        </motion.div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Merchant not found.</p>
          <button onClick={() => navigate("/officer/queue")} className="btn-secondary">Back to Queue</button>
        </div>
      </div>
    );
  }

  const flagCount    = creditScore?.fraudFlags?.length || 0;
  const alreadyDecided = ["APPROVED_FOR_MICRO_CREDIT", "REVIEW_REQUIRED"].includes(merchant.status) && merchant.decidedBy;

  return (
    <motion.div
      className="min-h-screen bg-navy-900 bg-grid"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="fixed top-0 right-0 w-96 h-96 bg-violet/5 rounded-full blur-3xl pointer-events-none" />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-2xl"
            style={{
              background: toast.type === "success" ? "rgba(16,185,129,0.95)" : "rgba(239,68,68,0.95)",
              color: "white",
            }}
          >
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {toast.msg}
            <motion.button onClick={() => setToast(null)} whileHover={{ rotate: 90 }}>
              <X size={14} className="ml-2 opacity-70" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decision Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
            initial={{ backdropFilter: "blur(0px)", opacity: 0 }}
            animate={{ backdropFilter: "blur(8px)", opacity: 1 }}
            exit={{ backdropFilter: "blur(0px)", opacity: 0 }}
          >
            <motion.div
              className="glass rounded-2xl p-8 max-w-md w-full mx-4"
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  {showModal === "approve" ? "✅ Approve Application" : "🔍 Flag for Review"}
                </h3>
                <motion.button
                  onClick={() => setShowModal(null)}
                  className="text-slate-500 hover:text-white p-1"
                  whileHover={{ rotate: 90, scale: 1.1 }}
                >
                  <X size={18} />
                </motion.button>
              </div>

              <p className="text-slate-400 text-sm mb-4">
                {showModal === "approve"
                  ? `Approving micro-credit for ${merchant.businessName}. The applicant will be notified.`
                  : `Flagging ${merchant.businessName} for additional review. The applicant will be informed.`}
              </p>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Officer Note (optional)
                </label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note for the record..." rows={3} className="field resize-none" />
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowModal(null)}
                  className="btn-secondary flex-1 justify-center" disabled={deciding}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => makeDecision(showModal === "approve" ? "APPROVED_FOR_MICRO_CREDIT" : "REVIEW_REQUIRED")}
                  disabled={deciding}
                  className={showModal === "approve" ? "btn-success flex-1 justify-center" : "btn-danger flex-1 justify-center"}
                  whileHover={!deciding ? { scale: 1.02 } : {}} whileTap={!deciding ? { scale: 0.97 } : {}}
                >
                  {deciding ? <><Loader2 size={14} className="animate-spin" /> Processing…</> :
                    showModal === "approve" ? "Confirm Approval" : "Confirm Review Flag"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <motion.nav
        className="relative z-10 border-b border-white/5 px-6 py-4 flex items-center gap-3"
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      >
        <motion.button
          onClick={() => navigate("/officer/queue")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          whileHover={{ x: -3 }} whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft size={16} /> Review Queue
        </motion.button>
        <ChevronRight size={14} className="text-slate-700" />
        <span className="text-slate-300 text-sm font-medium truncate">{merchant.businessName}</span>
      </motion.nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Top grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Identity card */}
          <motion.div
            className="lg:col-span-2 glass rounded-2xl p-6"
            custom={0} variants={sectionVariants} initial="hidden" animate="visible"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{merchant.businessName}</h1>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  {merchant.gstin && <span>GSTIN: <span className="font-mono text-slate-300">{merchant.gstin}</span></span>}
                  <span>PAN: <span className="font-mono text-slate-300">{merchant.pan}</span></span>
                  <span>UPI: <span className="font-mono text-slate-300">{merchant.vpa}</span></span>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-400 border border-white/8 whitespace-nowrap">
                {merchant.registrationStatus?.replace(/_/g, " ")}
              </span>
            </div>

            {creditScore?.coverageTier && (
              <motion.div className="mb-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                <CoverageTierIndicator tier={creditScore.coverageTier} />
              </motion.div>
            )}

            {creditScore?.explanationText && (
              <motion.div
                className="p-4 rounded-xl bg-white/3 border border-white/5"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              >
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  AI Rationale for Credit Officer
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">{creditScore.explanationText}</p>
              </motion.div>
            )}

            {flagCount > 0 && (
              <motion.div className="mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle size={12} className="text-gold" /> Fraud Flags ({flagCount})
                </p>
                {creditScore.fraudFlags.map((f, i) => <FraudFlagBadge key={i} flag={f} />)}
              </motion.div>
            )}
          </motion.div>

          {/* Gauge card */}
          <motion.div
            className="glass rounded-2xl p-6 flex flex-col items-center justify-center"
            custom={1} variants={sectionVariants} initial="hidden" animate="visible"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Financial Health Score
            </p>
            <FhsGauge score={creditScore?.finalFhsScore} size="lg" />
            <div className="mt-4 grid grid-cols-3 w-full text-center gap-2">
              {creditScore?.weightsUsed && [
                { k: "w1UVel",    label: "U_vel", color: "#3B82F6" },
                { k: "w2GstAuth", label: "GST",   color: "#8B5CF6" },
                { k: "w3Dsb",     label: "DSB",   color: "#10B981" },
              ].map(({ k, label, color }) => (
                <motion.div
                  key={k}
                  className="p-2 rounded-lg bg-white/3"
                  whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.06)" }}
                >
                  <p className="text-xs font-bold" style={{ color }}>
                    {Math.round((creditScore.weightsUsed[k] || 0) * 100)}%
                  </p>
                  <p className="text-xs text-slate-600">{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Score breakdown + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            className="glass rounded-2xl p-6"
            custom={2} variants={sectionVariants} initial="hidden" animate="visible"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Score Pillar Breakdown</p>
            <ScoreBreakdownCard components={creditScore?.components} weightsUsed={creditScore?.weightsUsed} />
          </motion.div>

          <motion.div
            className="glass rounded-2xl p-6"
            custom={3} variants={sectionVariants} initial="hidden" animate="visible"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              GST Turnover vs AA-Verified Deposits
            </p>
            <TurnoverChart creditScore={creditScore} />
          </motion.div>
        </div>

        {/* Decision panel */}
        <motion.div
          className="glass rounded-2xl p-6"
          custom={4} variants={sectionVariants} initial="hidden" animate="visible"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-bold text-white mb-1">Credit Decision</p>
              <p className="text-xs text-slate-500">
                {alreadyDecided && merchant.decidedAt
                  ? `Decided on ${new Date(merchant.decidedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                  : "Make a final credit decision for this application."}
              </p>
            </div>

            <div className="flex gap-3">
              <motion.button
                onClick={() => setShowModal("review")}
                className="btn-danger"
                whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
              >
                <AlertTriangle size={14} /> Flag for Review
              </motion.button>
              <motion.button
                onClick={() => setShowModal("approve")}
                className="btn-success"
                whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
              >
                <CheckCircle2 size={14} /> Approve Credit
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {merchant.status === "APPROVED_FOR_MICRO_CREDIT" && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl bg-emerald/10 border border-emerald/20 text-emerald-400 text-sm flex items-center gap-2"
              >
                <CheckCircle2 size={15} /> Approved — Applicant has been notified.
              </motion.div>
            )}
            {merchant.status === "REVIEW_REQUIRED" && merchant.decidedBy && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl bg-gold/10 border border-gold/20 text-gold text-sm flex items-center gap-2"
              >
                <AlertTriangle size={15} /> Flagged for manual review — Applicant has been notified.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
