import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone, FileText, Landmark, Cpu, ShieldAlert, CheckCircle2,
} from "lucide-react";
import api from "../api/axios";

const PIPELINE_STEPS = [
  { Icon: Smartphone,  label: "Fetching UPI Transactions",      sub: "90-day inflow stream via NPCI",        delay: 0 },
  { Icon: FileText,    label: "Retrieving GST Filings",          sub: "GSTR-1 & GSTR-3B via GSTN API",       delay: 1400 },
  { Icon: Landmark,    label: "Pulling AA Balance Data",          sub: "180-day snapshots via AA network",     delay: 2600 },
  { Icon: Cpu,         label: "Computing U_vel, GST_auth, DSB",  sub: "Running scoring microservice",          delay: 3800 },
  { Icon: ShieldAlert, label: "Checking Fraud Flags",             sub: "Counterparty & circular tx scan",      delay: 4800 },
  { Icon: CheckCircle2,label: "Score Finalised",                  sub: "Writing to audit ledger",              delay: 5800 },
];

export default function ProcessingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(-1);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    PIPELINE_STEPS.forEach((step, i) => {
      setTimeout(() => setActiveStep(i), step.delay);
    });

    api.post("/credit/calculate-score", { merchantId: id }).catch((err) => {
      setError(err.response?.data?.message || "Scoring service unavailable.");
    });

    const timer = setTimeout(() => {
      setDone(true);
      setTimeout(() => navigate(`/apply/status/${id}`), 900);
    }, 7200);

    return () => clearTimeout(timer);
  }, [id, navigate]);

  return (
    <motion.div
      className="min-h-screen bg-navy-900 bg-grid flex flex-col items-center justify-center px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Pulsing background orb */}
      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Animated orb */}
        <div className="flex justify-center mb-8">
          <motion.div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))",
              border: "2px solid rgba(59,130,246,0.3)",
            }}
            animate={done
              ? { scale: 1, borderColor: "rgba(16,185,129,0.6)", background: "rgba(16,185,129,0.15)" }
              : { boxShadow: ["0 0 20px rgba(59,130,246,0.3)", "0 0 50px rgba(59,130,246,0.6)", "0 0 20px rgba(59,130,246,0.3)"] }
            }
            transition={{ duration: done ? 0.4 : 2, repeat: done ? 0 : Infinity }}
          >
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CheckCircle2 size={36} className="text-emerald-400" strokeWidth={1.8} />
                </motion.div>
              ) : (
                <motion.div
                  key="spin"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                >
                  <Cpu size={36} className="text-brand" strokeWidth={1.5} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <motion.h1
          className="text-2xl font-bold text-white text-center mb-2"
          animate={{ opacity: 1 }}
        >
          {done ? "Score Computed!" : "Processing Your Application"}
        </motion.h1>
        <p className="text-slate-400 text-sm text-center mb-8">
          {done
            ? "Your Financial Health Score is ready for officer review."
            : "Fetching alternate data streams and computing your Financial Health Score…"}
        </p>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs text-center"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pipeline steps */}
        <motion.div
          className="glass rounded-2xl p-6 space-y-5"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          {PIPELINE_STEPS.map(({ Icon, label, sub }, i) => {
            const completed = i < activeStep;
            const active    = i === activeStep;
            const pending   = i > activeStep;

            return (
              <motion.div
                key={label}
                className="flex items-center gap-4"
                animate={{ opacity: pending ? 0.28 : 1 }}
                transition={{ duration: 0.4 }}
              >
                {/* Status icon */}
                <motion.div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  animate={{
                    background: completed
                      ? "rgba(16,185,129,0.2)"
                      : active ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                    borderColor: completed
                      ? "rgba(16,185,129,0.5)"
                      : active ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)",
                    boxShadow: active ? "0 0 16px rgba(59,130,246,0.5)" : "none",
                  }}
                  style={{ border: "1px solid" }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimatePresence mode="wait">
                    {completed ? (
                      <motion.div key="check"
                        initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      </motion.div>
                    ) : active ? (
                      <motion.div key="spin"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Icon size={15} className="text-brand" />
                      </motion.div>
                    ) : (
                      <motion.div key="idle">
                        <Icon size={15} className="text-slate-600" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <div className="flex-1">
                  <motion.p
                    className="text-sm font-semibold"
                    animate={{
                      color: completed ? "#34D399" : active ? "#F1F5F9" : "#475569",
                    }}
                  >
                    {label}
                  </motion.p>
                  <p className="text-xs text-slate-600">{sub}</p>
                </div>

                {/* Connector line */}
                <AnimatePresence>
                  {completed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <CheckCircle2 size={14} className="text-emerald-500/50" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
