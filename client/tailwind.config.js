/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          950: "#040812",
          900: "#0A0F1E",
          800: "#0F172A",
          700: "#1E293B",
          600: "#2D3A52",
        },
        brand: {
          DEFAULT: "#3B82F6",
          light: "#60A5FA",
          dark: "#1D4ED8",
        },
        gold: {
          DEFAULT: "#F59E0B",
          light: "#FCD34D",
        },
        emerald: {
          DEFAULT: "#10B981",
          light: "#34D399",
        },
        ruby: {
          DEFAULT: "#EF4444",
          light: "#FCA5A5",
        },
        violet: {
          DEFAULT: "#8B5CF6",
          light: "#A78BFA",
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
        "bounce-slow": "bounce 2s infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: {
          from: { opacity: 0, transform: "translateY(20px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(59,130,246,0.3)" },
          "50%":      { boxShadow: "0 0 40px rgba(59,130,246,0.7)" },
        },
      },
      backdropBlur: { xs: "2px" },
    },
  },
  plugins: [],
};
