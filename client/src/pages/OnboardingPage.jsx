import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import api from "../api/axios";

const STEPS = ["Business Info", "Review", "Submit"];

const REGISTRATION_OPTIONS = [
  { value: "GST_REGISTERED",   label: "GST Registered" },
  { value: "COMPOSITE_SCHEME", label: "Composite Scheme" },
  { value: "UNREGISTERED",     label: "Unregistered / Below Threshold" },
];

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const fieldVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" },
  }),
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [form, setForm] = useState({
    businessName: "", gstin: "", pan: "", vpa: "",
    registrationStatus: "GST_REGISTERED",
  });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      const payload = { ...form };
      if (!payload.gstin) delete payload.gstin;
      const { data } = await api.post("/merchants/onboard", payload);
      navigate(`/apply/consent/${data.merchant._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Onboarding failed. Please try again.");
    } finally { setLoading(false); }
  };

  const isValid =
    form.businessName.trim() &&
    form.pan.trim().length >= 10 &&
    form.vpa.trim() &&
    form.registrationStatus;

  const fields = [
    { name: "businessName", label: "Business Name", placeholder: "e.g. Sharma General Store", type: "text" },
    { name: "pan", label: "PAN Number", placeholder: "e.g. ABCDE1234F", type: "text", maxLength: 10 },
  ];

  return (
    <motion.div
      className="min-h-screen bg-navy-900 bg-grid flex flex-col items-center justify-center px-4 py-12"
      variants={pageVariants} initial="initial" animate="animate" exit="exit"
    >
      <div className="fixed top-0 right-1/4 w-72 h-72 bg-brand/8 rounded-full blur-3xl pointer-events-none" />

      {/* Back */}
      <motion.button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        whileHover={{ x: -3 }} whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft size={16} /> Back
      </motion.button>

      {/* Logo */}
      <motion.div
        className="flex items-center gap-2 mb-8"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      >
        <motion.div
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-violet flex items-center justify-center"
          whileHover={{ rotate: 8 }} transition={{ type: "spring", stiffness: 400 }}
        >
          <span className="text-white font-black text-xs">KL</span>
        </motion.div>
        <span className="text-white font-bold">KredLink</span>
      </motion.div>

      {/* Step indicator */}
      <motion.div
        className="flex items-center gap-3 mb-8"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      >
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                animate={{
                  background: i === 0 ? "#3B82F6" : "rgba(255,255,255,0.05)",
                  color: i === 0 ? "white" : "#64748B",
                  boxShadow: i === 0 ? "0 0 20px rgba(59,130,246,0.5)" : "none",
                }}
                transition={{ duration: 0.3 }}
              >
                {i === 0 ? <CheckCircle2 size={14} /> : i + 1}
              </motion.div>
              <span className={`text-xs font-medium hidden sm:block ${i === 0 ? "text-slate-200" : "text-slate-600"}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight size={14} className={i < 0 ? "text-brand" : "text-slate-700"} />
            )}
          </div>
        ))}
      </motion.div>

      {/* Card */}
      <motion.div
        className="glass rounded-2xl p-8 w-full max-w-md"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-2xl font-bold text-white mb-2">Business Onboarding</h1>
        <p className="text-slate-400 text-sm mb-6">Enter your business details to begin your credit application.</p>

        <div className="space-y-4">
          {/* Business Name */}
          <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Business Name *
            </label>
            <input name="businessName" value={form.businessName} onChange={handleChange}
              placeholder="e.g. Sharma General Store" className="field" />
          </motion.div>

          {/* PAN */}
          <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              PAN Number *
            </label>
            <input name="pan" value={form.pan} onChange={handleChange}
              placeholder="e.g. ABCDE1234F" maxLength={10} className="field uppercase" />
          </motion.div>

          {/* Registration */}
          <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              GST Registration Status *
            </label>
            <select name="registrationStatus" value={form.registrationStatus}
              onChange={handleChange} className="field">
              {REGISTRATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-navy-800">{o.label}</option>
              ))}
            </select>
          </motion.div>

          {/* GSTIN (conditional) */}
          <AnimatePresence>
            {form.registrationStatus !== "UNREGISTERED" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
              >
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  GSTIN
                </label>
                <input name="gstin" value={form.gstin} onChange={handleChange}
                  placeholder="e.g. 27AAAAA1234A1Z0" maxLength={15} className="field uppercase" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* VPA */}
          <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              UPI VPA *
            </label>
            <input name="vpa" value={form.vpa} onChange={handleChange}
              placeholder="e.g. mybusiness@oksbi" className="field" />
          </motion.div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="btn-primary w-full mt-6 justify-center"
          whileHover={isValid && !loading ? { scale: 1.02, y: -1 } : {}}
          whileTap={isValid && !loading ? { scale: 0.98 } : {}}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Creating profile…</>
          ) : (
            <>Continue to Consent <ArrowRight size={16} /></>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
