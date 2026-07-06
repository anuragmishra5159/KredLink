import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

// Generate monthly labels and mock data from gstReturns & aaBalanceDaily
function buildChartData(creditScore) {
  // Use fixed demo data for presentation
  const labels = ["Mar 2026", "Apr 2026", "May 2026", "Jun 2026"];
  const gstTurnover = [947323, 1012890, 983450, 1024780];
  const aaDeposits  = [921000, 988200, 971800, 1009400];

  return { labels, gstTurnover, aaDeposits };
}

export default function TurnoverChart({ creditScore }) {
  const { labels, gstTurnover, aaDeposits } = buildChartData(creditScore);

  const data = {
    labels,
    datasets: [
      {
        label: "GST-Reported Turnover",
        data: gstTurnover,
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139,92,246,0.08)",
        pointBackgroundColor: "#8B5CF6",
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
        borderWidth: 2,
      },
      {
        label: "AA-Verified Deposits",
        data: aaDeposits,
        borderColor: "#10B981",
        backgroundColor: "rgba(16,185,129,0.06)",
        pointBackgroundColor: "#10B981",
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#94A3B8",
          font: { family: "Inter", size: 12 },
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.95)",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        titleColor: "#F1F5F9",
        bodyColor: "#94A3B8",
        callbacks: {
          label: (ctx) =>
            ` ${ctx.dataset.label}: ₹${(ctx.parsed.y / 1000).toFixed(1)}K`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#64748B", font: { family: "Inter", size: 11 } },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: {
          color: "#64748B",
          font: { family: "Inter", size: 11 },
          callback: (v) => `₹${(v / 1000).toFixed(0)}K`,
        },
      },
    },
    animation: { duration: 1000, easing: "easeOutQuart" },
  };

  return (
    <div style={{ height: 260 }}>
      <Line data={data} options={options} />
    </div>
  );
}
