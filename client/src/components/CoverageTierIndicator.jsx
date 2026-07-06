import { motion } from "framer-motion";

const TIER_CONFIG = {
  FULL:    { color: "#10B981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  dots: [true,  true,  true],  label: "Full Coverage" },
  PARTIAL: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  dots: [true,  true,  false], label: "Partial Coverage" },
  MINIMAL: { color: "#EF4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   dots: [true,  false, false], label: "Minimal Coverage" },
};

export default function CoverageTierIndicator({ tier }) {
  const s = TIER_CONFIG[tier] || TIER_CONFIG.MINIMAL;

  return (
    <motion.div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.05 }}
    >
      {/* Animated dots */}
      <div className="flex gap-0.5">
        {s.dots.map((active, i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: active ? s.color : `${s.color}30` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 400 }}
          />
        ))}
      </div>
      {tier} — {s.label}
    </motion.div>
  );
}
