/**
 * KredLink — Unified Onboarding Wizard
 * 3-step applicant flow styled in warm off-white cream (#F1F0E8), lime green,
 * and forest dark-green accents.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Loader2, CheckCircle2, ShieldCheck,
  Landmark, Smartphone, FileText, Cpu, ChevronRight, RefreshCw, AlertTriangle
} from "lucide-react";
import api from "../api/axios";
import { TOKENS } from "../theme/tokens";
import FhsGauge from "../components/FhsGauge";
import CoverageTierIndicator from "../components/CoverageTierIndicator";

const STEPS = ["Business Info", "Connect Accounts", "Review Score"];

export default function OnboardingPage() {
  const navigate = useNavigate();

  // Wizard State
  const [step, setStep] = useState(1); // 1 = Business Info, 2 = Connect, 3 = Processing/Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Form
  const [form, setForm] = useState({
    businessName: "",
    pan: "",
    vpa: "",
    registrationStatus: "GST_REGISTERED",
    gstin: ""
  });
  const [notGstRegistered, setNotGstRegistered] = useState(false);

  // Step 2: Consent
  const [consents, setConsents] = useState({
    aaConsent: false,
    gstnConsent: false,
    upiConsent: false
  });

  // Step 3: Calculation & Result
  const [calcStatus, setCalcStatus] = useState("fetching"); // "fetching" | "scoring" | "final"
  const [calcMessage, setCalcMessage] = useState("Verifying UPI transaction streams...");
  const [merchant, setMerchant] = useState(null);
  const [creditScore, setCreditScore] = useState(null);

  // Sync notGstRegistered to registrationStatus
  useEffect(() => {
    if (notGstRegistered) {
      setForm(f => ({ ...f, registrationStatus: "UNREGISTERED", gstin: "" }));
      setConsents(c => ({ ...c, gstnConsent: false }));
    } else {
      setForm(f => ({ ...f, registrationStatus: "GST_REGISTERED" }));
    }
  }, [notGstRegistered]);

  const handleFormChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const isFormValid =
    form.businessName.trim() &&
    form.pan.trim().length >= 10 &&
    form.vpa.trim() &&
    (notGstRegistered || form.gstin.trim().length >= 15);

  // Handle Step 1 Submit
  const handleStep1Submit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = { ...form };
      if (notGstRegistered) {
        delete payload.gstin;
      }
      const { data } = await api.post("/merchants/onboard", payload);
      setMerchant(data.merchant);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please check fields.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2 Consent Toggle
  const toggleConsent = (key) => {
    if (key === "gstnConsent" && notGstRegistered) return; // cannot link GST if unregistered
    setConsents(c => ({ ...c, [key]: !c[key] }));
  };

  const canSubmitConsent = consents.aaConsent && consents.upiConsent;

  // Handle Step 2 Submit (Consents + Calculate FHS)
  const handleStep2Submit = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Save consent records
      await api.post(`/merchants/${merchant._id}/consent`, consents);
      
      // 2. Advance to Step 3 processing
      setStep(3);
      setCalcStatus("fetching");
      setCalcMessage("Retrieving daily UPI logs from NPCI...");

      // Simulate live pipeline visual feedback
      setTimeout(() => setCalcMessage("Fetching Account Aggregator snapshots..."), 1200);
      setTimeout(() => {
        setCalcStatus("scoring");
        setCalcMessage("Running scoring formulas (U_vel, GST_auth, DSB)...");
      }, 2600);
      setTimeout(() => setCalcMessage("Checking counterparty concentrations..."), 3800);

      // Actually trigger FHS calculation
      const { data } = await api.post("/credit/calculate-score", { merchantId: merchant._id });
      
      setTimeout(() => {
        setCreditScore(data);
        setCalcStatus("final");
      }, 5000);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to record consent or compute score.");
      setStep(2); // fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: TOKENS.colors.bgBase,
      color: TOKENS.colors.textPrimary,
      fontFamily: TOKENS.colors.body,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px"
    }}>
      {/* Back button */}
      {step < 3 && (
        <button
          onClick={() => step === 1 ? navigate("/") : setStep(1)}
          style={{
            position: "absolute", top: 24, left: 24,
            background: "none", border: "none", color: TOKENS.colors.textMuted,
            fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}

      {/* Stepper indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
        {STEPS.map((s, idx) => {
          const current = idx + 1 === step;
          const completed = idx + 1 < step;
          return (
            <React.Fragment key={s}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 999,
                  background: current ? TOKENS.colors.darkAccent : completed ? TOKENS.colors.primaryAccent : "#FFFFFF",
                  color: current || completed ? "#FFFFFF" : TOKENS.colors.textMuted,
                  border: `1.5px solid ${current || completed ? "transparent" : TOKENS.colors.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800
                }}>
                  {completed ? "✓" : idx + 1}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: current ? TOKENS.colors.darkAccent : TOKENS.colors.textMuted
                }}>
                  {s}
                </span>
              </div>
              {idx < STEPS.length - 1 && <ChevronRight size={14} style={{ color: TOKENS.colors.border }} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* ─── STEP 1: BUSINESS INFO CARD ─── */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              background: "#FFFFFF",
              border: `1px solid ${TOKENS.colors.border}`,
              borderRadius: 24,
              padding: 32,
              width: "100%",
              maxWidth: 460,
              boxShadow: "0 10px 30px rgba(22, 50, 31, 0.03)"
            }}
          >
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, fontFamily: TOKENS.fonts.heading }}>
              Business Profile
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: TOKENS.colors.textMuted }}>
              Provide details of your merchant registry to initialize your FHS evaluation.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Business Name */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: TOKENS.colors.textMuted, textTransform: "uppercase", marginBottom: 6 }}>
                  Business Name *
                </label>
                <input name="businessName" value={form.businessName} onChange={handleFormChange}
                  placeholder="e.g. Sharma General Store" className="onboard-field" />
              </div>

              {/* PAN */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: TOKENS.colors.textMuted, textTransform: "uppercase", marginBottom: 6 }}>
                  PAN Number *
                </label>
                <input name="pan" value={form.pan} onChange={handleFormChange}
                  placeholder="e.g. ABCDE1234F" maxLength={10} style={{ textTransform: "uppercase" }} className="onboard-field" />
              </div>

              {/* UPI VPA */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: TOKENS.colors.textMuted, textTransform: "uppercase", marginBottom: 6 }}>
                  UPI VPA (Virtual Payment Address) *
                </label>
                <input name="vpa" value={form.vpa} onChange={handleFormChange}
                  placeholder="e.g. storename@oksbi" className="onboard-field" />
              </div>

              {/* GST Toggle row */}
              <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", gap: 12, padding: "8px 0" }}>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>My business is not registered for GST</span>
                <div
                  onClick={() => setNotGstRegistered(!notGstRegistered)}
                  style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: notGstRegistered ? TOKENS.colors.primaryAccent : TOKENS.colors.border,
                    position: "relative", cursor: "pointer", transition: "background 0.2s"
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 3, left: notGstRegistered ? 21 : 3, transition: "left 0.2s"
                  }} />
                </div>
              </div>

              {/* Conditional GSTIN Field */}
              {!notGstRegistered && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: TOKENS.colors.textMuted, textTransform: "uppercase", marginBottom: 6 }}>
                    GSTIN *
                  </label>
                  <input name="gstin" value={form.gstin} onChange={handleFormChange}
                    placeholder="e.g. 27AAAAA1234A1Z0" maxLength={15} style={{ textTransform: "uppercase" }} className="onboard-field" />
                </motion.div>
              )}

              {notGstRegistered && (
                <div style={{
                  background: "rgba(141, 198, 63, 0.1)", border: `1.5px solid ${TOKENS.colors.primaryAccent}40`,
                  borderRadius: 12, padding: 12, fontSize: 12, color: TOKENS.colors.darkAccent
                }}>
                  💡 Scoring without GST is allowed under our partial-coverage tier. Overall score will rely purely on UPI and bank snapshots.
                </div>
              )}
            </div>

            {error && <div style={{ color: "#EF4444", fontSize: 13, marginTop: 16 }}>{error}</div>}

            <motion.button
              onClick={handleStep1Submit}
              disabled={!isFormValid || loading}
              style={{
                width: "100%", marginTop: 24, padding: "14px 0", borderRadius: 999, border: "none",
                background: isFormValid ? TOKENS.colors.darkAccent : TOKENS.colors.border,
                color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: isFormValid ? "pointer" : "default"
              }}
              whileHover={isFormValid ? { scale: 1.02 } : {}}
              whileTap={isFormValid ? { scale: 0.98 } : {}}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Link Accounts <ArrowRight size={14} style={{ marginLeft: 6, display: "inline" }} /></>}
            </motion.button>
          </motion.div>
        )}

        {/* ─── STEP 2: CONNECT ACCOUNTS ─── */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              background: "#FFFFFF",
              border: `1px solid ${TOKENS.colors.border}`,
              borderRadius: 24,
              padding: 32,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 10px 30px rgba(22, 50, 31, 0.03)"
            }}
          >
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, fontFamily: TOKENS.fonts.heading }}>
              Link Data Streams
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: TOKENS.colors.textMuted }}>
              Linking digital streams grants the scoring engine read-only consent.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Card A: Account Aggregator */}
              <div style={{
                border: `1px solid ${consents.aaConsent ? TOKENS.colors.primaryAccent : TOKENS.colors.border}`,
                background: consents.aaConsent ? "rgba(141, 198, 63, 0.05)" : "transparent",
                borderRadius: 16, padding: 16, display: "flex", alignItems: "start", gap: 12, cursor: "pointer"
              }} onClick={() => toggleConsent("aaConsent")}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F1F0E8", display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.colors.darkAccent }}>
                  <Landmark size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Account Aggregator *</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: consents.aaConsent ? TOKENS.colors.primaryAccent : TOKENS.colors.textMuted }}>
                      {consents.aaConsent ? "CONNECTED" : "DISCONNECTED"}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: TOKENS.colors.textMuted, lineHeight: 1.4 }}>
                    Link 180 days of balance snapshots under RBI AA framework. Secure & revocable.
                  </p>
                </div>
              </div>

              {/* Card B: UPI logs */}
              <div style={{
                border: `1px solid ${consents.upiConsent ? TOKENS.colors.primaryAccent : TOKENS.colors.border}`,
                background: consents.upiConsent ? "rgba(141, 198, 63, 0.05)" : "transparent",
                borderRadius: 16, padding: 16, display: "flex", alignItems: "start", gap: 12, cursor: "pointer"
              }} onClick={() => toggleConsent("upiConsent")}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F1F0E8", display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.colors.darkAccent }}>
                  <Smartphone size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>UPI Transaction Inflows *</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: consents.upiConsent ? TOKENS.colors.primaryAccent : TOKENS.colors.textMuted }}>
                      {consents.upiConsent ? "CONNECTED" : "DISCONNECTED"}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: TOKENS.colors.textMuted, lineHeight: 1.4 }}>
                    Analyzes transaction count & daily revenue logs. Revoke anytime.
                  </p>
                </div>
              </div>

              {/* Card C: GSTN (Conditional on registration status) */}
              <div style={{
                border: `1px solid ${consents.gstnConsent ? TOKENS.colors.primaryAccent : TOKENS.colors.border}`,
                background: notGstRegistered ? "rgba(22,50,31,0.02)" : consents.gstnConsent ? "rgba(141, 198, 63, 0.05)" : "transparent",
                opacity: notGstRegistered ? 0.4 : 1,
                borderRadius: 16, padding: 16, display: "flex", alignItems: "start", gap: 12,
                cursor: notGstRegistered ? "not-allowed" : "pointer"
              }} onClick={() => toggleConsent("gstnConsent")}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F1F0E8", display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.colors.darkAccent }}>
                  <FileText size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>GST Returns Filings</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: consents.gstnConsent ? TOKENS.colors.primaryAccent : TOKENS.colors.textMuted }}>
                      {notGstRegistered ? "N/A" : consents.gstnConsent ? "CONNECTED" : "DISCONNECTED"}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: TOKENS.colors.textMuted, lineHeight: 1.4 }}>
                    {notGstRegistered ? "Not applicable for unregistered business profiles." : "Compares monthly GSTR-1 and GSTR-3B filings to verify cash flow stability."}
                  </p>
                </div>
              </div>
            </div>

            {error && <div style={{ color: "#EF4444", fontSize: 13, marginTop: 16 }}>{error}</div>}

            <motion.button
              onClick={handleStep2Submit}
              disabled={!canSubmitConsent || loading}
              style={{
                width: "100%", marginTop: 24, padding: "14px 0", borderRadius: 999, border: "none",
                background: canSubmitConsent ? TOKENS.colors.darkAccent : TOKENS.colors.border,
                color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: canSubmitConsent ? "pointer" : "default"
              }}
              whileHover={canSubmitConsent ? { scale: 1.02 } : {}}
              whileTap={canSubmitConsent ? { scale: 0.98 } : {}}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Request Credit Score <Cpu size={14} style={{ marginLeft: 6, display: "inline" }} /></>}
            </motion.button>
          </motion.div>
        )}

        {/* ─── STEP 3: PROCESSING & RESULTS ─── */}
        {step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              width: "100%",
              maxWidth: 540,
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
          >
            {/* Loading / Processing view */}
            {calcStatus !== "final" && (
              <div style={{
                background: "#FFFFFF",
                border: `1px solid ${TOKENS.colors.border}`,
                borderRadius: 24,
                padding: "48px 32px",
                textAlign: "center",
                width: "100%",
                boxShadow: "0 10px 30px rgba(22, 50, 31, 0.03)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}>
                <motion.div
                  style={{
                    width: 72, height: 72, borderRadius: "50%",
                    border: `3px solid ${TOKENS.colors.primaryAccent}30`,
                    borderTopColor: TOKENS.colors.darkAccent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 24
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                >
                  <Cpu size={30} style={{ color: TOKENS.colors.darkAccent }} />
                </motion.div>

                <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, fontFamily: TOKENS.fonts.heading }}>
                  Evaluating Creditworthiness
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: TOKENS.colors.textMuted }}>
                  {calcMessage}
                </p>
              </div>
            )}

            {/* Score reveal view */}
            {calcStatus === "final" && creditScore && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: "#FFFFFF",
                  border: `1px solid ${TOKENS.colors.border}`,
                  borderRadius: 24,
                  padding: 32,
                  width: "100%",
                  boxShadow: "0 10px 30px rgba(22, 50, 31, 0.03)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: TOKENS.colors.primaryAccent, marginBottom: 20 }}>
                  <CheckCircle2 size={24} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: TOKENS.fonts.heading, color: TOKENS.colors.darkAccent }}>
                      Analysis Successful
                    </h3>
                    <p style={{ margin: 0, fontSize: 12, color: TOKENS.colors.textMuted }}>
                      Your financial profile has been logged on MongoDB Atlas.
                    </p>
                  </div>
                </div>

                {/* Score gauge block */}
                <div style={{
                  background: TOKENS.colors.bgBase,
                  borderRadius: 16,
                  padding: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 32,
                  marginBottom: 24
                }}>
                  {/* Gauge component */}
                  <FhsGauge score={creditScore.finalFhsScore} size="sm" />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: TOKENS.colors.textMuted, textTransform: "uppercase" }}>
                      Financial Health Score
                    </p>
                    <p style={{ margin: 0, fontSize: 36, fontWeight: 900, color: TOKENS.colors.darkAccent, fontFamily: TOKENS.fonts.heading }}>
                      {creditScore.finalFhsScore}
                    </p>
                    <p style={{ margin: "2px 0 10px", fontSize: 11, color: TOKENS.colors.textMuted }}>out of 900</p>
                    <CoverageTierIndicator tier={creditScore.coverageTier} />
                  </div>
                </div>

                {/* Explanation rational card */}
                {creditScore.explanationText && (
                  <div style={{
                    border: `1px solid ${TOKENS.colors.border}`,
                    borderRadius: 14,
                    padding: 16,
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: TOKENS.colors.textPrimary,
                    background: "#FDFDFD",
                    marginBottom: 20
                  }}>
                    <span style={{ fontWeight: 700, color: TOKENS.colors.darkAccent }}>Rational: </span>
                    {creditScore.explanationText}
                  </div>
                )}

                {/* Score Ranges and Remarks Legend */}
                <div style={{
                  background: "#F9F9FB",
                  border: `1.5px solid ${TOKENS.colors.border}`,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 24
                }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, fontFamily: TOKENS.fonts.heading, color: TOKENS.colors.darkAccent, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Score Interpretation Ranges
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { range: "750 – 900", band: "Excellent", color: "#10B981", remark: "High auto-approval rate. Extremely consistent cash flow & low default risk." },
                      { range: "650 – 749", band: "Good", color: "#3B82F6", remark: "Favorable rate terms. Standard underwriting review with fast processing." },
                      { range: "550 – 649", band: "Fair", color: "#F59E0B", remark: "Manual review recommended. Moderate activity with minor anomalies." },
                      { range: "300 – 549", band: "Poor", color: "#EF4444", remark: "High risk profile. Requires manual override, collateral, or co-signers." }
                    ].map(r => {
                      const minScore = parseInt(r.range.split(" – ")[0]);
                      const maxScore = parseInt(r.range.split(" – ")[1]);
                      const active = creditScore.finalFhsScore >= minScore && creditScore.finalFhsScore <= maxScore;
                      return (
                        <div key={r.band} style={{
                          display: "flex", alignItems: "start", gap: 10, padding: "8px 10px", borderRadius: 8,
                          background: active ? `${r.color}08` : "transparent",
                          border: active ? `1px solid ${r.color}30` : "1px solid transparent"
                        }}>
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 80 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: r.color }}>{r.band}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: TOKENS.colors.textMuted }}>{r.range}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 11.5, color: TOKENS.colors.textMuted, lineHeight: 1.4, flex: 1 }}>
                            {r.remark} {active && <strong style={{ color: r.color, marginLeft: 4 }}>(Your Band)</strong>}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Home link */}
                <div style={{ display: "flex", gap: 12 }}>
                  <motion.button
                    onClick={() => navigate("/")}
                    style={{
                      flex: 1, padding: "14px 0", borderRadius: 999, border: "none",
                      background: TOKENS.colors.darkAccent, color: "#FFFFFF",
                      fontSize: 14, fontWeight: 700, cursor: "pointer", textAlign: "center"
                    }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  >
                    Finish & Exit
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
