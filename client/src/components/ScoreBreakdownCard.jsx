import { motion } from "framer-motion";

export default function ScoreBreakdownCard({ components, weightsUsed }) {
  if (!components) return null;

  const pillars = [
    {
      key: "uVel",    label: "UPI Velocity Stability",    weight: weightsUsed?.w1UVel    || 0.30, color: "#3B82F6",
      desc: "Consistency of daily inflow amounts and transaction counts",
    },
    {
      key: "gstAuth", label: "GST Authentication",         weight: weightsUsed?.w2GstAuth || 0.40, color: "#8B5CF6",
      desc: "Alignment between GSTN-reported turnover and AA-verified cash",
    },
    {
      key: "dsb",     label: "Debt Serviceability Buffer", weight: weightsUsed?.w3Dsb     || 0.30, color: "#10B981",
      desc: "Pre-payout balance headroom relative to monthly obligations",
    },
  ];

  return (
    <div className="space-y-5">
      {pillars.map(({ key, label, weight, color, desc }, i) => {
        const value = components[key];
        const pct   = value != null ? Math.round(value * 100) : null;

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
          >
            <div className="flex justify-between items-center mb-1.5">
              <div>
                <span className="text-sm font-semibold text-slate-200">{label}</span>
                <span className="ml-2 text-xs text-slate-500">({Math.round(weight * 100)}% weight)</span>
              </div>
              <motion.span
                className="text-sm font-bold tabular-nums"
                style={{ color: pct != null ? color : "#64748B" }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 300 }}
              >
                {pct != null ? `${pct}%` : "N/A"}
              </motion.span>
            </div>

            {/* Animated progress bar */}
            <div className="progress-bar">
              <motion.div
                className="progress-bar-fill"
                style={{ background: `linear-gradient(90deg, ${color}70, ${color})` }}
                initial={{ width: "0%" }}
                animate={{ width: pct != null ? `${pct}%` : "0%" }}
                transition={{ delay: 0.4 + i * 0.12, duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">{desc}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
