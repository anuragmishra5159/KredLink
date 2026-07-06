import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ShieldCheck, Loader2, Landmark, FileText, Smartphone } from "lucide-react";
import api from "../api/axios";

const CONSENTS = [
  {
    key: "aaConsent",
    Icon: Landmark,
    title: "Account Aggregator (AA)",
    subtitle: "Banking data via RBI-regulated AA framework",
    description: "Allows KredLink to retrieve 180 days of balance snapshots and transaction history from your linked bank accounts through the Account Aggregator network.",
    required: true,
    accent: "#3B82F6",
  },
  {
    key: "gstnConsent",
    Icon: FileText,
    title: "GSTN Tax Filings",
    subtitle: "GSTR-1 and GSTR-3B returns",
    description: "Allows KredLink to access your last 4 GST filing periods to verify reported turnover against your bank cash flows. Optional for unregistered entities.",
    required: false,
    accent: "#8B5CF6",
  },
  {
    key: "upiConsent",
    Icon: Smartphone,
    title: "UPI Transaction Logs",
    subtitle: "90-day daily inflow & payer data",
    description: "Allows KredLink to analyse your daily UPI inflows, transaction counts, and payer diversity to assess cash flow stability.",
    required: true,
    accent: "#10B981",
  },
];

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function ConsentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [consents, setConsents] = useState({ aaConsent: false, gstnConsent: false, upiConsent: false });

  const toggle = (key) => setConsents((c) => ({ ...c, [key]: !c[key] }));
  const canProceed = consents.aaConsent && consents.upiConsent;

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      await api.post(`/merchants/${id}/consent`, consents);
      navigate(`/apply/processing/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record consent.");
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      className="min-h-screen bg-navy-900 bg-grid flex flex-col items-center justify-center px-4 py-12"
      variants={pageVariants} initial="initial" animate="animate" exit="exit"
    >
      <div className="fixed top-0 left-1/3 w-80 h-80 bg-violet/8 rounded-full blur-3xl pointer-events-none" />

      <motion.button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        whileHover={{ x: -3 }} whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft size={16} /> Back
      </motion.button>

      <div className="w-full max-w-lg">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <motion.div
            className="w-14 h-14 rounded-2xl bg-violet/20 border border-violet/30 flex items-center justify-center mx-auto mb-4"
            whileHover={{ rotate: 8, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}
          >
            <ShieldCheck size={26} className="text-violet-400" strokeWidth={1.8} />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Data Consent</h1>
          <p className="text-slate-400 text-sm">
            KredLink needs permission to fetch your financial data. All data is
            processed under the RBI Account Aggregator framework.
          </p>
        </motion.div>

        {/* Consent cards */}
        <div className="space-y-3 mb-6">
          {CONSENTS.map(({ key, Icon, title, subtitle, description, required, accent }, i) => {
            const active = consents[key];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                onClick={() => toggle(key)}
                className="rounded-xl p-5 cursor-pointer transition-colors duration-200"
                style={{
                  background: active ? `${accent}10` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? `${accent}40` : "rgba(255,255,255,0.06)"}`,
                }}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <motion.div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: active ? `${accent}20` : "rgba(255,255,255,0.05)" }}
                      animate={{ background: active ? `${accent}20` : "rgba(255,255,255,0.05)" }}
                    >
                      <Icon size={18} style={{ color: active ? accent : "#64748B" }} strokeWidth={1.8} />
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{title}</span>
                        {required && (
                          <span className="text-xs text-ruby bg-ruby/10 border border-ruby/20 px-1.5 py-0.5 rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{description}</p>
                    </div>
                  </div>

                  {/* Animated toggle */}
                  <motion.div
                    className="flex-shrink-0 w-11 h-6 rounded-full relative mt-1 cursor-pointer"
                    animate={{ background: active ? accent : "rgba(255,255,255,0.1)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow"
                      animate={{ left: active ? "calc(100% - 22px)" : "2px" }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {!canProceed && (
            <motion.p
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="text-xs text-slate-500 text-center mb-4"
            >
              ⚠️ AA and UPI consents are required to proceed
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleSubmit}
          disabled={!canProceed || loading}
          className="btn-primary w-full justify-center"
          whileHover={canProceed && !loading ? { scale: 1.02, y: -1 } : {}}
          whileTap={canProceed && !loading ? { scale: 0.98 } : {}}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Recording consent…</>
          ) : (
            <>Grant Consent & Proceed <ArrowRight size={16} /></>
          )}
        </motion.button>

        <p className="text-xs text-slate-600 text-center mt-4">
          You can revoke consent at any time. Data is processed under RBI's AA framework.
        </p>
      </div>
    </motion.div>
  );
}
