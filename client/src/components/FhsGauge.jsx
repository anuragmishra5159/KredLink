import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform, animate } from "framer-motion";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip);

function getScoreColor(score) {
  if (!score) return "#64748B";
  if (score >= 750) return "#10B981";
  if (score >= 650) return "#3B82F6";
  if (score >= 550) return "#F59E0B";
  return "#EF4444";
}

function getScoreLabel(score) {
  if (!score) return "N/A";
  if (score >= 750) return "Excellent";
  if (score >= 650) return "Good";
  if (score >= 550) return "Fair";
  return "Poor";
}

// Animated count-up number
function AnimatedNumber({ value, color }) {
  const ref      = useRef(null);
  const prevRef  = useRef(0);

  useEffect(() => {
    if (!value) return;
    const controls = animate(prevRef.current, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v);
      },
    });
    prevRef.current = value;
    return controls.stop;
  }, [value]);

  return (
    <span
      ref={ref}
      style={{ color, textShadow: `0 0 20px ${color}80` }}
    >
      {value ?? "—"}
    </span>
  );
}

export default function FhsGauge({ score, size = "lg" }) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const filled = score ? Math.max(0, Math.min(1, (score - 300) / 600)) : 0;

  const data = {
    datasets: [{
      data: [filled, 1 - filled],
      backgroundColor: [color, "rgba(255,255,255,0.05)"],
      borderWidth: 0,
      circumference: 240,
      rotation: 240,
    }],
  };

  const options = {
    cutout: size === "lg" ? "78%" : "70%",
    plugins: { tooltip: { enabled: false } },
    animation: { animateRotate: true, duration: 1400, easing: "easeOutQuart" },
    responsive: true,
    maintainAspectRatio: true,
  };

  const dim = size === "lg" ? 220 : 120;

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: dim, height: dim }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
    >
      <Doughnut data={data} options={options} />

      {/* Center overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className="font-black leading-none"
          style={{ fontSize: size === "lg" ? "2.4rem" : "1.3rem" }}
        >
          {score ? (
            <AnimatedNumber value={score} color={color} />
          ) : (
            <span style={{ color: "#64748B" }}>—</span>
          )}
        </span>
        <motion.span
          className="text-xs font-semibold mt-1"
          style={{ color }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        >
          {label}
        </motion.span>
        {size === "lg" && (
          <span className="text-xs text-slate-500 mt-0.5">300 — 900</span>
        )}
      </div>
    </motion.div>
  );
}
