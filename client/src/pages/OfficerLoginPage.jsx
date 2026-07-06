import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Scale } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function OfficerLoginPage() {
  const navigate      = useNavigate();
  const { login, loading } = useAuth();
  const [form, setForm]    = useState({ email: "officer@idbibank.com", password: "Demo@1234" });
  const [error, setError]  = useState("");
  const [showPw, setShowPw]= useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    const result = await login(form.email, form.password);
    if (result.success) navigate("/officer/dashboard");
    else setError(result.message);
  };

  return (
    <motion.div
      className="min-h-screen bg-navy-900 bg-grid flex flex-col items-center justify-center px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="fixed top-0 left-0 w-80 h-80 bg-violet/8 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="fixed bottom-0 right-0 w-80 h-80 bg-brand/8 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }}
      />

      <motion.button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        whileHover={{ x: -3 }} whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft size={16} /> Back
      </motion.button>

      <div className="w-full max-w-sm relative z-10">
        {/* Bank branding */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <motion.div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/20 to-violet/20 border border-brand/20 flex items-center justify-center mx-auto mb-4"
            whileHover={{ rotate: 6, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}
          >
            <Scale size={30} className="text-brand" strokeWidth={1.6} />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-1">Officer Portal</h1>
          <p className="text-slate-500 text-sm">IDBI Bank · KredLink Credit Review System</p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="glass rounded-2xl p-7"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        >
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="field" placeholder="officer@idbibank.com" required />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.38 }}
            >
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input name="password" type={showPw ? "text" : "password"} value={form.password}
                  onChange={handleChange} className="field pr-10" placeholder="••••••••" required />
                <motion.button
                  type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </motion.button>
              </div>
            </motion.div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Demo hint */}
          <motion.div
            className="mt-4 p-3 rounded-xl bg-brand/5 border border-brand/15"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          >
            <p className="text-xs text-slate-500 font-medium">Demo credentials pre-filled</p>
            <p className="text-xs text-slate-400 mt-0.5">officer@idbibank.com · Demo@1234</p>
          </motion.div>

          <motion.button
            type="submit" disabled={loading}
            className="btn-primary w-full mt-5 justify-center"
            whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Authenticating…</>
            ) : (
              <>Sign In to Officer Portal <ArrowRight size={16} /></>
            )}
          </motion.button>
        </motion.form>
      </div>
    </motion.div>
  );
}
