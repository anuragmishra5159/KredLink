import { motion } from "framer-motion";
import { AlertTriangle, Info, AlertOctagon } from "lucide-react";

const FLAG_CONFIG = {
  HIGH:   { bg: "rgba(239,68,68,0.12)",   border: "#EF444440", text: "#FCA5A5", icon: AlertOctagon },
  MEDIUM: { bg: "rgba(245,158,11,0.12)",  border: "#F59E0B40", text: "#FCD34D", icon: AlertTriangle },
  LOW:    { bg: "rgba(148,163,184,0.08)", border: "#64748B40", text: "#94A3B8", icon: Info },
};

const FLAG_LABELS = {
  COUNTERPARTY_CONCENTRATION: "Counterparty Concentration",
  CIRCULAR_TXN:               "Circular Transaction",
  INVOICE_MISMATCH:           "Invoice Mismatch",
};

export default function FraudFlagBadge({ flag, index = 0 }) {
  const c   = FLAG_CONFIG[flag.severity] || FLAG_CONFIG.LOW;
  const Icon = c.icon;

  return (
    <motion.div
      className="rounded-xl p-3 mb-2"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
      initial={{ opacity: 0, x: -12, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.01, x: 2 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <motion.div
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
        >
          <Icon size={13} style={{ color: c.text }} />
        </motion.div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-bold"
          style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
        >
          {flag.severity}
        </span>
        <span className="text-sm font-semibold" style={{ color: c.text }}>
          {FLAG_LABELS[flag.flagType] || flag.flagType}
        </span>
      </div>
      {flag.evidenceRef && (
        <p className="text-xs text-slate-400 ml-5">{flag.evidenceRef}</p>
      )}
    </motion.div>
  );
}
