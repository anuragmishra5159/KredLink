import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, Search, FileX, Loader2, RefreshCw, Home } from "lucide-react";
import api from "../api/axios";
import FhsGauge from "../components/FhsGauge";
import CoverageTierIndicator from "../components/CoverageTierIndicator";

const STATUS_CONFIG = {
  PENDING:                   { Icon: Clock,         color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  title: "Application Submitted",     message: "Your application is in the review queue. A credit officer will evaluate it shortly." },
  PROCESSING:                { Icon: Loader2,       color: "#3B82F6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.25)",  title: "Computing Score",           message: "Our engine is analysing your financial data. This usually takes under 60 seconds." },
  APPROVED_FOR_MICRO_CREDIT: { Icon: CheckCircle2,  color: "#10B981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)",  title: "Approved for Micro Credit", message: "Congratulations! Your application has been approved. A loan officer will contact you within 24 hours." },
  REVIEW_REQUIRED:           { Icon: Search,        color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  title: "Under Manual Review",       message: "Your application requires additional review by a credit officer. You will be notified of the outcome." },
  INSUFFICIENT_DATA:         { Icon: FileX,         color: "#EF4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   title: "Insufficient Data",         message: "We could not compute a reliable score from the available data. A representative will reach out to you." },
};

export default function StatusPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [merchant, setMerchant]       = useState(null);
  const [creditScore, setCreditScore] = useState(null);
  const [loading, setLoading]         = useState(true);

  const fetchData = async () => {
    try {
      const { data } = await api.get(`/merchants/${id}`);
      setMerchant(data.merchant);
      setCreditScore(data.creditScore);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const status = merchant?.status || "PENDING";
  const cfg    = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const { Icon } = cfg;

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 size={32} className="text-brand" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-navy-900 bg-grid flex flex-col items-center justify-center px-4 py-12"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: `${cfg.color}12` }}
        animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Status card */}
        <motion.div
          className="rounded-2xl p-8 mb-4 text-center"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.2 }}
          >
            <Icon
              size={28}
              style={{ color: cfg.color }}
              strokeWidth={1.7}
              className={status === "PROCESSING" ? "animate-spin" : ""}
            />
          </motion.div>

          <motion.h1
            className="text-xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          >
            {cfg.title}
          </motion.h1>
          <motion.p
            className="text-sm text-slate-400 leading-relaxed"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          >
            {cfg.message}
          </motion.p>

          {merchant && (
            <motion.div
              className="mt-4 pt-4 border-t border-white/5 text-left"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
            >
              <p className="text-xs text-slate-500 mb-1">Business</p>
              <p className="text-sm font-semibold text-white">{merchant.businessName}</p>
              {merchant.gstin && (
                <>
                  <p className="text-xs text-slate-500 mt-2 mb-1">GSTIN</p>
                  <p className="text-sm font-mono text-slate-300">{merchant.gstin}</p>
                </>
              )}
              <p className="text-xs text-slate-500 mt-2 mb-1">Application ID</p>
              <p className="text-xs font-mono text-slate-400">{id}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Score preview */}
        <AnimatePresence>
          {creditScore?.finalFhsScore && (
            <motion.div
              className="glass rounded-2xl p-6 mb-4"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            >
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Your Financial Health Score
              </p>
              <div className="flex items-center gap-6">
                <FhsGauge score={creditScore.finalFhsScore} size="sm" />
                <div className="flex-1">
                  <p className="text-3xl font-black text-white">{creditScore.finalFhsScore}</p>
                  <p className="text-xs text-slate-500 mb-3">out of 900</p>
                  {creditScore.coverageTier && (
                    <CoverageTierIndicator tier={creditScore.coverageTier} />
                  )}
                </div>
              </div>
              {creditScore.explanationText && (
                <p className="text-xs text-slate-400 mt-4 leading-relaxed border-t border-white/5 pt-4">
                  {creditScore.explanationText}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={() => navigate("/")} className="btn-secondary flex-1 justify-center"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          >
            <Home size={15} /> Back to Home
          </motion.button>
          <motion.button
            onClick={fetchData} className="btn-primary flex-1 justify-center"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          >
            <RefreshCw size={15} /> Refresh
          </motion.button>
        </motion.div>

        <p className="text-xs text-slate-600 text-center mt-4">
          Application ID: <span className="font-mono">{id?.slice(-8)}</span> · Auto-refreshes every 10s
        </p>
      </div>
    </motion.div>
  );
}
