import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Scale } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { TOKENS } from "../theme/tokens";

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
      style={{
        background: TOKENS.colors.bgBase,
        fontFamily: TOKENS.fonts.body,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
        position: "relative"
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          color: TOKENS.colors.textMuted,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: TOKENS.fonts.heading
        }}
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft size={16} /> BACK TO LANDING
      </motion.button>

      <div style={{ width: "100%", maxWidth: 380, zIndex: 10 }}>
        {/* Bank branding */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 32 }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: TOKENS.colors.bgAccent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 16px rgba(166, 214, 8, 0.15)"
            }}
            whileHover={{ rotate: 6, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Scale size={26} color={TOKENS.colors.darkAccent} strokeWidth={2} />
          </motion.div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, fontFamily: TOKENS.fonts.heading, color: TOKENS.colors.darkAccent }}>
            Officer Portal
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: TOKENS.colors.textMuted, fontWeight: 600 }}>
            IDBI Bank · Alternate Credit Review
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          style={{
            background: "#FFFFFF",
            border: `1.5px solid ${TOKENS.colors.border}`,
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 12px 32px rgba(22, 50, 31, 0.03)"
          }}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: TOKENS.colors.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  background: TOKENS.colors.bgBase,
                  border: `1.5px solid ${TOKENS.colors.border}`,
                  borderRadius: 12,
                  padding: "12px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: TOKENS.colors.textPrimary,
                  outline: "none"
                }}
                placeholder="officer@idbibank.com"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.38 }}
            >
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: TOKENS.colors.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    background: TOKENS.colors.bgBase,
                    border: `1.5px solid ${TOKENS.colors.border}`,
                    borderRadius: 12,
                    padding: "12px 16px",
                    paddingRight: 40,
                    fontSize: 13,
                    fontWeight: 600,
                    color: TOKENS.colors.textPrimary,
                    outline: "none"
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: TOKENS.colors.textMuted,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 12,
                background: "rgba(239, 68, 68, 0.08)",
                border: "1.5px solid rgba(239, 68, 68, 0.15)",
                color: "#EF4444",
                fontSize: 12,
                fontWeight: 600
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Demo credential helper */}
          <motion.div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 12,
              background: TOKENS.colors.bgBase,
              border: `1px solid ${TOKENS.colors.border}`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: TOKENS.colors.textMuted, uppercase: true }}>
              DEMO CREDENTIALS PRE-FILLED
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 600, color: TOKENS.colors.darkAccent }}>
              officer@idbibank.com · Demo@1234
            </p>
          </motion.div>

          <motion.button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 20,
              background: TOKENS.colors.darkAccent,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 12,
              padding: "14px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: TOKENS.fonts.heading
            }}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> AUTHENTICATING…</>
            ) : (
              <>SIGN IN <ArrowRight size={16} /></>
            )}
          </motion.button>
        </motion.form>
      </div>
    </motion.div>
  );
}
