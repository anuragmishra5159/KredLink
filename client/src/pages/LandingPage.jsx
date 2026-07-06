/**
 * KredLink — Marketing Landing Page
 * Rebuilt entirely with the new warm off-white, lime green, and forest dark design system.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Play, ArrowRight, ShieldCheck, Zap,
  CheckCircle, Database, HelpCircle, UserCheck, Menu, X, Plus, BarChart3, Loader2, AlertTriangle
} from "lucide-react";
import { TOKENS } from "../theme/tokens";
import api from "../api/axios";

// Stagger child animation helper
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }
  }
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredLogo, setHoveredLogo] = useState(null);

  // Tracking states
  const [trackPan, setTrackPan] = useState("");
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState("");
  const [tracking, setTracking] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackPan.trim()) return;
    setTracking(true);
    setTrackError("");
    setTrackResult(null);
    try {
      const { data } = await api.post("/merchants/track", { pan: trackPan });
      if (data.success) {
        setTrackResult(data);
      } else {
        setTrackError(data.message || "Application not found.");
      }
    } catch (err) {
      setTrackError(err.response?.data?.message || "No application found for this PAN.");
    } finally {
      setTracking(false);
    }
  };

  // Parallax tilt effect for hero cards
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-300, 300], [8, -8]);
  const rotateY = useTransform(mouseX, [-300, 300], [-8, 8]);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const centerX = e.clientX - rect.left - width / 2;
    const centerY = e.clientY - rect.top - height / 2;
    mouseX.set(centerX);
    mouseY.set(centerY);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div style={{
      background: TOKENS.colors.bgBase,
      color: TOKENS.colors.textPrimary,
      fontFamily: TOKENS.colors.body,
      minHeight: "100vh",
      overflowX: "hidden"
    }}>
      
      {/* ─── 1. PILL NAVBAR ─── */}
      <div style={{ padding: "20px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <header style={{
          background: "#FFFFFF",
          border: `1px solid ${TOKENS.colors.border}`,
          borderRadius: 999,
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 20px rgba(22, 50, 31, 0.03)"
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
            <div style={{
              width: 32, height: 32, borderRadius: 999,
              background: TOKENS.colors.bgAccent,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: TOKENS.colors.darkAccent, fontWeight: 900, fontSize: 13, fontFamily: TOKENS.fonts.heading }}>K</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: TOKENS.colors.darkAccent, fontFamily: TOKENS.fonts.heading, letterSpacing: "-0.03em" }}>
              Kred-Link
            </span>
          </div>

          {/* Nav Links - Desktop */}
          <nav className="desktop-nav" style={{ display: "flex", gap: 28 }}>
            {["Features", "How it works", "For banks", "About"].map(link => (
              <a
                key={link} href={`#${link.toLowerCase().replace(/ /g, "-")}`}
                style={{
                  textDecoration: "none", color: TOKENS.colors.textPrimary,
                  fontSize: 14, fontWeight: 600, transition: "color 0.2s"
                }}
                onMouseOver={e => e.currentTarget.style.color = TOKENS.colors.primaryAccent}
                onMouseOut={e => e.currentTarget.style.color = TOKENS.colors.textPrimary}
              >
                {link}
              </a>
            ))}
          </nav>

          {/* CTAs - Desktop */}
          <div className="desktop-ctas" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => navigate("/officer/login")}
              style={{
                background: "none", border: "none", color: TOKENS.colors.textPrimary,
                fontSize: 14, fontWeight: 700, cursor: "pointer"
              }}
            >
              Log in
            </button>
            <motion.button
              onClick={() => navigate("/apply/onboard")}
              style={{
                background: TOKENS.colors.darkAccent,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "10px 22px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
              whileHover={{ scale: 1.03, background: "#1F4D2F" }}
              whileTap={{ scale: 0.98 }}
            >
              Get started <ArrowRight size={14} />
            </motion.button>
          </div>

          {/* Hamburger Menu - Mobile */}
          <button
            className="mobile-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: TOKENS.colors.darkAccent, display: "none"
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>
      </div>

      {/* Mobile Drawer menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "#FFFFFF", borderBottom: `1px solid ${TOKENS.colors.border}`,
              padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16,
              position: "absolute", width: "100%", zIndex: 100
            }}
          >
            {["Features", "How it works", "For banks", "About"].map(link => (
              <a
                key={link} href={`#${link.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  textDecoration: "none", color: TOKENS.colors.textPrimary,
                  fontSize: 16, fontWeight: 600
                }}
              >
                {link}
              </a>
            ))}
            <hr style={{ border: `0.5px solid ${TOKENS.colors.border}`, margin: "8px 0" }} />
            <button
              onClick={() => { navigate("/officer/login"); setMobileMenuOpen(false); }}
              style={{
                background: "none", border: "none", color: TOKENS.colors.textPrimary,
                fontSize: 16, fontWeight: 700, textAlign: "left", padding: 0
              }}
            >
              Log in
            </button>
            <button
              onClick={() => { navigate("/apply/onboard"); setMobileMenuOpen(false); }}
              style={{
                background: TOKENS.colors.darkAccent, color: "#FFFFFF",
                border: "none", borderRadius: 999, padding: "12px 24px",
                fontSize: 16, fontWeight: 700, cursor: "pointer"
              }}
            >
              Get started
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 2. HERO SECTION ─── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px 80px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 48,
          alignItems: "center"
        }}>
          {/* Left Column */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Section Eyebrow */}
            <motion.div variants={fadeUp} style={{ marginBottom: 16 }}>
              <span style={{
                background: "rgba(141, 198, 63, 0.15)",
                color: TOKENS.colors.darkAccent,
                border: `1px solid ${TOKENS.colors.primaryAccent}40`,
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em"
              }}>
                Track 03 · IDBI Hackathon
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontFamily: TOKENS.fonts.heading,
              fontWeight: 800,
              color: TOKENS.colors.textPrimary,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: 20
            }}>
              Your partner in <span style={{ color: TOKENS.colors.primaryAccent }}>inclusive credit</span> decisions
            </motion.h1>

            <motion.p variants={fadeUp} style={{
              fontSize: 16,
              color: TOKENS.colors.textMuted,
              lineHeight: 1.6,
              marginBottom: 36,
              maxWidth: 480
            }}>
              Score credit-invisible MSMEs using GST filings, UPI activity, and bank data — no CIBIL history required.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
              <motion.button
                onClick={() => navigate("/apply/onboard")}
                style={{
                  background: TOKENS.colors.darkAccent,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 999,
                  padding: "14px 28px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
                whileHover={{ scale: 1.02, background: "#1F4D2F" }}
                whileTap={{ scale: 0.98 }}
              >
                Start your application
              </motion.button>
              <motion.button
                style={{
                  background: "transparent",
                  color: TOKENS.colors.darkAccent,
                  border: `1.5px solid ${TOKENS.colors.border}`,
                  borderRadius: 999,
                  padding: "14px 28px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
                whileHover={{ scale: 1.02, borderColor: TOKENS.colors.darkAccent }}
                whileTap={{ scale: 0.98 }}
              >
                <Play size={16} fill={TOKENS.colors.darkAccent} /> Watch how it works
              </motion.button>
            </motion.div>

            <motion.hr variants={fadeUp} style={{ border: "none", borderTop: `1px solid ${TOKENS.colors.border}`, marginBottom: 20 }} />

            {/* Below CTA Tags */}
            <motion.div variants={fadeUp} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["GST verified", "UPI velocity", "AA consent", "Explainable score", "300–900 range"].map(tag => (
                <span key={tag} style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: TOKENS.colors.textMuted,
                  border: `1.5px solid ${TOKENS.colors.border}`,
                  borderRadius: 999,
                  padding: "4px 12px",
                  background: "#FFFFFF",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em"
                }}>
                  {tag}
                </span>
              ))}
            </motion.div>

            {/* Track Application Widget Card */}
            <motion.div
              variants={fadeUp}
              style={{
                marginTop: 32,
                background: "#FFFFFF",
                border: `1px solid ${TOKENS.colors.border}`,
                borderRadius: 20,
                padding: 20,
                boxShadow: "0 8px 24px rgba(22, 50, 31, 0.02)"
              }}
            >
              <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 800, fontFamily: TOKENS.fonts.heading, color: TOKENS.colors.darkAccent, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Track Application
              </h4>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: TOKENS.colors.textMuted }}>
                Check the live credit decision status of your MSME profile.
              </p>

              <form onSubmit={handleTrack} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Enter business PAN (e.g. ABCDE1234F)"
                  value={trackPan}
                  onChange={(e) => setTrackPan(e.target.value)}
                  maxLength={10}
                  style={{
                    flex: 1,
                    minWidth: 200,
                    background: TOKENS.colors.bgBase,
                    border: `1.5px solid ${TOKENS.colors.border}`,
                    borderRadius: 999,
                    padding: "10px 18px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: TOKENS.colors.textPrimary,
                    outline: "none",
                    textTransform: "uppercase"
                  }}
                />
                <motion.button
                  type="submit"
                  disabled={tracking}
                  style={{
                    background: TOKENS.colors.darkAccent,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 999,
                    padding: "10px 22px",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {tracking ? <Loader2 size={13} className="animate-spin" /> : "Track"}
                </motion.button>
              </form>

              {/* Error block */}
              {trackError && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#EF4444", fontSize: 12, marginTop: 12 }}>
                  <AlertTriangle size={14} />
                  <span>{trackError}</span>
                </div>
              )}

              {/* Result block */}
              <AnimatePresence>
                {trackResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    style={{
                      borderTop: `1.5px solid ${TOKENS.colors.border}`,
                      paddingTop: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      overflow: "hidden"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: TOKENS.colors.darkAccent }}>
                        {trackResult.merchant.businessName}
                      </span>
                      <button
                        onClick={() => setTrackResult(null)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.colors.textMuted }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      {/* Status */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: TOKENS.colors.textMuted }}>Status:</span>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 99,
                          textTransform: "uppercase",
                          background:
                            trackResult.merchant.status === "APPROVED_FOR_MICRO_CREDIT" ? "rgba(16, 185, 129, 0.12)" :
                            trackResult.merchant.status === "REVIEW_REQUIRED" ? "rgba(245, 158, 11, 0.12)" : "rgba(59, 130, 246, 0.12)",
                          color:
                            trackResult.merchant.status === "APPROVED_FOR_MICRO_CREDIT" ? "#10B981" :
                            trackResult.merchant.status === "REVIEW_REQUIRED" ? "#F59E0B" : "#3B82F6",
                          border: `1px solid ${
                            trackResult.merchant.status === "APPROVED_FOR_MICRO_CREDIT" ? "rgba(16, 185, 129, 0.25)" :
                            trackResult.merchant.status === "REVIEW_REQUIRED" ? "rgba(245, 158, 11, 0.25)" : "rgba(59, 130, 246, 0.25)"
                          }`
                        }}>
                          {trackResult.merchant.status === "APPROVED_FOR_MICRO_CREDIT" ? "Approved" :
                           trackResult.merchant.status === "REVIEW_REQUIRED" ? "Review Required" : "Pending Review"}
                        </span>
                      </div>

                      {/* FHS score indicator */}
                      {trackResult.creditScore && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, color: TOKENS.colors.textMuted }}>FHS Score:</span>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color:
                              trackResult.creditScore.finalFhsScore >= 750 ? "#10B981" :
                              trackResult.creditScore.finalFhsScore >= 650 ? "#3B82F6" : "#F59E0B"
                          }}>
                            {trackResult.creditScore.finalFhsScore}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Officer notes */}
                    {trackResult.merchant.decisionNote && (
                      <div style={{
                        background: TOKENS.colors.bgBase,
                        borderRadius: 10,
                        padding: 10,
                        fontSize: 11.5,
                        lineHeight: 1.4,
                        color: TOKENS.colors.textPrimary,
                        borderLeft: `3.5px solid ${TOKENS.colors.primaryAccent}`
                      }}>
                        <strong>Officer Notes: </strong>
                        {trackResult.merchant.decisionNote}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Right Column - Signature Floating Cards */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            position: "relative",
            height: 420
          }}>
            {/* Faint Ring outline behind */}
            <div style={{
              position: "absolute",
              width: 380,
              height: 380,
              borderRadius: "50%",
              border: `2px dashed ${TOKENS.colors.border}`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none"
            }} />

            {/* Interactive Parallax/Floating Container */}
            <motion.div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                position: "relative",
                width: 320,
                height: 240,
                marginTop: 60,
                rotateX,
                rotateY,
                transformStyle: "preserve-3d"
              }}
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              {/* Back Card: Credit Profile (Charcoal-green surface) */}
              <div style={{
                position: "absolute",
                inset: 0,
                background: TOKENS.colors.darkCard,
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.06)",
                padding: 24,
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transform: "translateZ(0)"
              }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: TOKENS.colors.bgAccent, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      CREDIT PROFILE
                    </span>
                    <ShieldCheck size={16} className="text-lime-500" style={{ color: TOKENS.colors.primaryAccent }} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#FFFFFF", fontFamily: TOKENS.fonts.heading }}>
                    Sharma General Store
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: TOKENS.colors.textMuted, fontFamily: "monospace" }}>
                    GSTIN: 27AAAAA1234A1Z0
                  </p>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
                  <p style={{ margin: 0, fontSize: 10, color: TOKENS.colors.textMuted, textTransform: "uppercase" }}>UPI VPA</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>sharmastore@oksbi</p>
                </div>
              </div>

              {/* Overlapping Front Card: Statistics (Light card) */}
              <motion.div style={{
                position: "absolute",
                width: 170,
                background: "#FFFFFF",
                border: `1.5px solid ${TOKENS.colors.border}`,
                borderRadius: 18,
                padding: 16,
                top: -40,
                left: -30,
                boxShadow: "0 12px 24px rgba(22, 50, 31, 0.08)",
                transform: "translateZ(40px)" // push out in 3D
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: TOKENS.colors.textMuted, textTransform: "uppercase" }}>
                  Financial Health Score
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "4px 0 10px" }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: TOKENS.colors.darkAccent, fontFamily: TOKENS.fonts.heading }}>
                    769
                  </span>
                  <span style={{ fontSize: 12, color: TOKENS.colors.textMuted }}>/ 900</span>
                </div>

                {/* Mini bar chart */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 32, paddingBottom: 4 }}>
                  {[12, 18, 14, 24, 28, 20, 22].map((h, idx) => (
                    <div key={idx} style={{
                      flex: 1,
                      height: `${(h / 28) * 100}%`,
                      background: idx === 4 ? TOKENS.colors.primaryAccent : TOKENS.colors.border,
                      borderRadius: 99
                    }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: TOKENS.colors.textMuted, marginTop: 4 }}>
                  <span>Mon</span>
                  <span>Sun</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 3. INFRASTRUCTURE PARTNERS ROW ─── */}
      <section style={{ background: "#FFFFFF", borderTop: `1px solid ${TOKENS.colors.border}`, borderBottom: `1px solid ${TOKENS.colors.border}`, padding: "30px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: TOKENS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Built on India's public digital lending infrastructure
          </p>
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "center", gap: 48, flexWrap: "wrap"
          }}>
            {[
              { id: "sa", label: "Sahamati AA Network" },
              { id: "gs", label: "GSTN Registry" },
              { id: "np", label: "NPCI / UPI" },
              { id: "rb", label: "RBI Digital Lending" }
            ].map(l => (
              <span
                key={l.id}
                onMouseEnter={() => setHoveredLogo(l.id)}
                onMouseLeave={() => setHoveredLogo(null)}
                style={{
                  fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em",
                  color: hoveredLogo === l.id ? TOKENS.colors.primaryAccent : TOKENS.colors.border,
                  transition: "color 0.25s", cursor: "default"
                }}
              >
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. FEATURES SECTION ─── */}
      <section id="features" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
        {/* Eyebrow and Headline */}
        <div style={{ textAlign: "center", marginBottom: 54 }}>
          <span style={{
            background: "rgba(141, 198, 63, 0.15)",
            color: TOKENS.colors.darkAccent,
            border: `1px solid ${TOKENS.colors.primaryAccent}40`,
            borderRadius: 999,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            display: "inline-block",
            marginBottom: 16
          }}>
            Features
          </span>
          <h2 style={{
            fontSize: "clamp(26px, 4vw, 38px)",
            fontFamily: TOKENS.fonts.heading,
            fontWeight: 800,
            color: TOKENS.colors.textPrimary,
            lineHeight: 1.25,
            maxWidth: 800,
            margin: "0 auto",
            letterSpacing: "-0.02em"
          }}>
            Achieve <span style={{ color: TOKENS.colors.primaryAccent }}>financial visibility</span> for businesses banks currently can't see — verified, explainable, and built for approval, not rejection.
          </h2>
        </div>

        {/* Feature Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20
        }}>
          {/* Card 1: Photographic Placeholder Style */}
          <div style={{
            background: TOKENS.colors.darkCard,
            borderRadius: 24,
            border: `1px solid ${TOKENS.colors.border}`,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: 300,
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Graphic trace */}
            <div style={{
              width: 140, height: 140, borderRadius: "50%",
              background: `radial-gradient(circle, ${TOKENS.colors.bgAccent}20 0%, transparent 70%)`,
              position: "absolute", top: -20, right: -20
            }} />
            <TrendingUp size={36} style={{ color: TOKENS.colors.bgAccent }} />
            <div>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#FFFFFF", fontFamily: TOKENS.fonts.heading }}>
                Designed for the QR-first merchant
              </h4>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: TOKENS.colors.textMuted, lineHeight: 1.5 }}>
                Underwriting built to capture and parse high-velocity transaction streams instantly.
              </p>
            </div>
          </div>

          {/* Card 2: Three-pillar scoring */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: 24,
            border: `1px solid ${TOKENS.colors.border}`,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: 300
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 999,
              background: "rgba(141, 198, 63, 0.1)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Zap size={18} style={{ color: TOKENS.colors.primaryAccent }} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TOKENS.colors.textPrimary, fontFamily: TOKENS.fonts.heading }}>
                Three-pillar scoring
              </h4>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: TOKENS.colors.textMuted, lineHeight: 1.5 }}>
                Synthesises tax logs, daily cashflows, and banking liquidity to build a balanced, modern credit score.
              </p>
            </div>
          </div>

          {/* Card 3: Explainable audit trail */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: 24,
            border: `1px solid ${TOKENS.colors.border}`,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: 300
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 999,
              background: "rgba(141, 198, 63, 0.1)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Database size={18} style={{ color: TOKENS.colors.primaryAccent }} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TOKENS.colors.textPrimary, fontFamily: TOKENS.fonts.heading }}>
                Explainable audit trail
              </h4>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: TOKENS.colors.textMuted, lineHeight: 1.5 }}>
                Every decision includes plain-language, audit-ready rationale detailing precise risk weights.
              </p>
            </div>
          </div>

          {/* Card 4: Coverage-aware */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: 24,
            border: `1px solid ${TOKENS.colors.border}`,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: 300
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 999,
              background: "rgba(141, 198, 63, 0.1)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <UserCheck size={18} style={{ color: TOKENS.colors.primaryAccent }} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TOKENS.colors.textPrimary, fontFamily: TOKENS.fonts.heading }}>
                Coverage-aware
              </h4>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: TOKENS.colors.textMuted, lineHeight: 1.5 }}>
                Doesn't reject for lack of documents. Dynamic reweighting scores fairly using whatever data is linked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. LIME GREEN Full-bleed band CTA ─── */}
      <section id="how-it-works" style={{
        background: TOKENS.colors.bgAccent,
        padding: "80px 24px",
        position: "relative"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 48,
            alignItems: "center"
          }}>
            {/* Left: balance-style score card */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{
                background: TOKENS.colors.darkCard,
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.08)",
                padding: 28,
                width: 320,
                boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
                color: "#FFFFFF"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: TOKENS.colors.bgAccent, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    YOUR FINANCIAL HEALTH SCORE
                  </span>
                  <motion.button
                    style={{
                      width: 28, height: 28, borderRadius: 999, background: "rgba(255,255,255,0.06)",
                      border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF"
                    }}
                    whileHover={{ scale: 1.1, background: "rgba(255,255,255,0.12)" }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Plus size={14} />
                  </motion.button>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 20 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, fontFamily: TOKENS.fonts.heading, color: "#FFFFFF" }}>
                    769
                  </span>
                  <span style={{ fontSize: 13, color: TOKENS.colors.textMuted }}>/ 900</span>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button style={{
                    flex: 1, background: "rgba(255,255,255,0.06)", border: "none",
                    borderRadius: 999, padding: "8px 0", fontSize: 11, fontWeight: 700, color: "#FFFFFF",
                    cursor: "pointer"
                  }}>
                    View breakdown
                  </button>
                  <button style={{
                    flex: 1, background: "rgba(255,255,255,0.06)", border: "none",
                    borderRadius: 999, padding: "8px 0", fontSize: 11, fontWeight: 700, color: "#FFFFFF",
                    cursor: "pointer"
                  }}>
                    Download report
                  </button>
                </div>
              </div>
            </div>

            {/* Right: 3 steps */}
            <div style={{ color: TOKENS.colors.darkAccent }}>
              <span style={{
                background: "rgba(22, 50, 31, 0.1)",
                color: TOKENS.colors.darkAccent,
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "inline-block",
                marginBottom: 16
              }}>
                How it works
              </span>
              
              <h2 style={{
                fontSize: "clamp(24px, 4vw, 34px)",
                fontFamily: TOKENS.fonts.heading,
                fontWeight: 800,
                lineHeight: 1.2,
                marginBottom: 32,
                letterSpacing: "-0.02em"
              }}>
                Get scored in 3 easy steps
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {[
                  { num: "1", title: "Connect your accounts", desc: "Linked securely via Account Aggregator framework with bank-level encryption. Revoke anytime." },
                  { num: "2", title: "Automated analysis", desc: "Our engine reviews monthly GSTR returns and UPI transaction frequency patterns instantly." },
                  { num: "3", title: "Explainable score", desc: "Receive your FHS along with the clear mathematical weights used to construct it." }
                ].map(s => (
                  <div key={s.num} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 999,
                      background: TOKENS.colors.darkAccent,
                      color: "#FFFFFF",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: 13, flexShrink: 0
                    }}>
                      {s.num}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{s.title}</h4>
                      <p style={{ margin: "2px 0 0", fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. FOOTER / PARTNER INTAKE ─── */}
      <section id="for-banks" style={{ borderTop: `1px solid ${TOKENS.colors.border}`, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 40 }}>
          <div>
            <span style={{
              background: "rgba(141, 198, 63, 0.15)",
              color: TOKENS.colors.darkAccent,
              border: `1px solid ${TOKENS.colors.primaryAccent}40`,
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              display: "inline-block",
              marginBottom: 16
            }}>
              For Banks
            </span>
            <h3 style={{
              fontSize: 24, fontFamily: TOKENS.fonts.heading, fontWeight: 800,
              color: TOKENS.colors.darkAccent, marginBottom: 12
            }}>
              Underwrite with precision
            </h3>
            <p style={{ fontSize: 14, color: TOKENS.colors.textMuted, lineHeight: 1.6, maxWidth: 360 }}>
              Integrate Kred-Link's scoring engine into your loan origination system to tap into the massive unbanked MSME market.
            </p>
          </div>

          <div>
            <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: TOKENS.colors.textPrimary }}>
              Get in touch for API sandboxes
            </h4>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                type="email"
                placeholder="name@bank.com"
                style={{
                  flex: 1, minWidth: 180,
                  background: "#FFFFFF",
                  border: `1px solid ${TOKENS.colors.border}`,
                  borderRadius: 999,
                  padding: "12px 20px",
                  fontSize: 13,
                  outline: "none"
                }}
              />
              <motion.button
                style={{
                  background: TOKENS.colors.darkAccent,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 999,
                  padding: "12px 24px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Request sandbox
              </motion.button>
            </div>
          </div>
        </div>

        {/* Small print */}
        <div style={{ maxWidth: 1200, margin: "40px auto 0", borderTop: `1px solid ${TOKENS.colors.border}`, paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, fontSize: 11, color: TOKENS.colors.textMuted }}>
          <span>© 2026 Kred-Link. Built for IDBI Bank Hackathon.</span>
          <span>Security: RBI Fair Practice Compliant & Sahamati Aligned</span>
        </div>
      </section>
    </div>
  );
}
