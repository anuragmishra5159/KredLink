import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, ClipboardCheck, ArrowRight, Zap, Shield, BarChart3, CheckCircle } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.4 + i * 0.15, duration: 0.5, ease: "easeOut" },
  }),
};

const statVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.7 + i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

const STATS = [
  { value: "3 Streams", label: "Alternate Data Sources" },
  { value: "300–900",   label: "Bounded FHS Score" },
  { value: "<150ms",    label: "Scoring Latency" },
  { value: "100%",      label: "Explainable Decisions" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="min-h-screen bg-navy-900 bg-grid flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Ambient glows */}
      <motion.div
        className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-brand/10 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed bottom-0 right-1/4 w-96 h-96 bg-violet/10 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Header */}
      <motion.header
        className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-violet flex items-center justify-center shadow-lg"
            whileHover={{ rotate: 5, scale: 1.08 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <span className="text-white font-black text-sm">KL</span>
          </motion.div>
          <div>
            <span className="font-bold text-white text-lg tracking-tight">KredLink</span>
            <span className="text-xs text-slate-500 block -mt-0.5">Alternate Credit Engine</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <motion.span
            className="w-2 h-2 rounded-full bg-emerald"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          IDBI Bank Hackathon 2026
        </div>
      </motion.header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Badge */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-semibold text-brand border border-brand/30 bg-brand/10"
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-brand"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          Track 03 — NTB MSME Credit Underwriting
        </motion.div>

        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-5xl md:text-6xl font-black text-white leading-tight mb-4"
        >
          Credit Scoring for<br />
          <span className="gradient-text">The Unbanked Business</span>
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-slate-400 text-lg max-w-xl mx-auto mb-12 leading-relaxed"
        >
          No CIBIL score? No problem. KredLink builds a verified Financial Health Score
          from your UPI transactions, GST filings, and bank account data — in seconds.
        </motion.p>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
          {[
            {
              icon: Building2,
              title: "I'm a Business Owner",
              desc: "Apply for micro-credit using your UPI, GST, and bank account data. Get a score in under 60 seconds.",
              cta: "Start Application",
              path: "/apply/onboard",
              accent: "#3B82F6",
              accentBg: "rgba(59,130,246,0.12)",
              gradient: "from-brand to-brand-dark",
            },
            {
              icon: ClipboardCheck,
              title: "I'm a Credit Officer",
              desc: "Review scored applications, inspect score breakdowns, and make credit decisions from the IDBI officer portal.",
              cta: "Officer Login",
              path: "/officer/login",
              accent: "#8B5CF6",
              accentBg: "rgba(139,92,246,0.12)",
              gradient: "from-violet to-violet",
            },
          ].map((card, i) => (
            <motion.button
              key={card.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              onClick={() => navigate(card.path)}
              className="glass text-left p-7 rounded-2xl cursor-pointer group relative overflow-hidden"
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Hover glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(ellipse at top left, ${card.accentBg}, transparent 70%)` }}
              />

              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative"
                style={{ background: card.accentBg, border: `1px solid ${card.accent}30` }}
              >
                <card.icon size={22} style={{ color: card.accent }} strokeWidth={1.8} />
              </div>

              <h2 className="text-white font-bold text-xl mb-2 relative">{card.title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed relative">{card.desc}</p>

              <div
                className="mt-5 flex items-center gap-2 text-sm font-semibold relative"
                style={{ color: card.accent }}
              >
                {card.cta}
                <motion.span
                  className="inline-flex"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight size={14} />
                </motion.span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { icon: Shield, text: "RBI AA Framework" },
            { icon: Zap, text: "Real-time Scoring" },
            { icon: BarChart3, text: "Full Explainability" },
            { icon: CheckCircle, text: "Fraud Detection" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-slate-400 border border-white/8 bg-white/3"
            >
              <Icon size={12} className="text-brand" />
              {text}
            </div>
          ))}
        </motion.div>

        {/* Stats */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-10 text-center">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              variants={statVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="text-2xl font-black gradient-text">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 text-center py-4 text-xs text-slate-600">
        KredLink Track 03 · IDBI Bank Hackathon 2026 · Powered by AA + GSTN + UPI
      </footer>
    </motion.div>
  );
}
