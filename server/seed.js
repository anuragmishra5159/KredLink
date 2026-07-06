/**
 * KredLink seed script — populates MongoDB with:
 *   1 demo officer account
 *   3 merchant profiles (clean approval, partial coverage, fraud-flagged)
 *
 * Run: node seed.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const User = require("./models/User");
const Merchant = require("./models/Merchant");
const ConsentRecord = require("./models/ConsentRecord");
const CreditScore = require("./models/CreditScore");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/kredlink";
const DATA_DIR = path.join(__dirname, "../");

const readJson = (file) =>
  JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));

const normUpi = (raw) => raw.map((d) => ({
  txn_date: d.txn_date, inflow_amount: d.inflow_amount,
  txn_count: d.txn_count, distinct_payer_count: d.distinct_payer_count,
}));
const normGst = (raw) => raw.map((d) => ({
  period: d.period, gstr1_sales: d.gstr1_sales,
  gstr3b_turnover: d.gstr3b_turnover, filed_on: d.filed_on,
}));
const normAa = (raw) => raw.map((d) => ({
  snapshot_date: d.snapshot_date, closing_balance: d.closing_balance,
  is_pre_payout_low: d.is_pre_payout_low, failed_debit: false,
}));

async function callScoring(upi, gst, aa) {
  try {
    const { data } = await axios.post("http://localhost:5001/score", {
      upiDailyTxn: upi, gstReturns: gst, aaBalanceDaily: aa,
    });
    return data;
  } catch {
    // If scoring service isn't running, return a hardcoded mock response
    return {
      success: true,
      finalFhsScore: 769,
      components: { uVel: 0.8722, gstAuth: 0.5851, dsb: 0.9535 },
      weightsUsed: { w1UVel: 0.30, w2GstAuth: 0.40, w3Dsb: 0.30 },
      coverageTier: "FULL",
      fraudFlags: [],
      explanationText: "FHS of 769 reflects stable UPI inflow patterns (U_vel=0.87), a moderate match between GST-reported turnover and bank-verified cash deposits (GST_auth=0.59), and a sufficient debt serviceability buffer (DSB=0.95).",
      status: "APPROVED_FOR_MICRO_CREDIT",
    };
  }
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected to MongoDB");

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Merchant.deleteMany({}),
    ConsentRecord.deleteMany({}),
    CreditScore.deleteMany({}),
  ]);
  console.log("🗑️   Cleared existing data");

  // ── Officer account ──────────────────────────────────────────────────────
  const officer = await User.create({
    name: "Priya Sharma",
    email: "officer@idbibank.com",
    password: "Demo@1234",
    role: "OFFICER",
    employeeId: "IDBI-KL-001",
    branch: "Mumbai HQ",
  });
  console.log("👤  Officer created:", officer.email);

  // ── Load mock data ───────────────────────────────────────────────────────
  const upiData = normUpi(readJson("upi_daily_transactions.json"));
  const gstData = normGst(readJson("gst_returns_monthly.json"));
  const aaData  = normAa(readJson("aa_balance_daily.json"));

  // ── Profile 1: Clean approval ────────────────────────────────────────────
  const m1 = await Merchant.create({
    businessName: "Sharma General Store",
    gstin: "27AAAAA1234A1Z0",
    pan: "ABCDE1234F",
    vpa: "sharma_store@oksbi",
    registrationStatus: "GST_REGISTERED",
  });
  await ConsentRecord.create({
    merchantId: m1._id, aaConsent: true, gstnConsent: true, upiConsent: true,
  });
  const score1 = await callScoring(upiData, gstData, aaData);
  await CreditScore.create({
    merchantId: m1._id,
    finalFhsScore: score1.finalFhsScore,
    components: score1.components,
    weightsUsed: score1.weightsUsed,
    coverageTier: score1.coverageTier,
    fraudFlags: [],
    explanationText: score1.explanationText,
  });
  await Merchant.findByIdAndUpdate(m1._id, { status: score1.status });
  console.log(`📊  Profile 1 scored: FHS=${score1.finalFhsScore}, status=${score1.status}`);

  // ── Profile 2: Partial coverage — no GST ────────────────────────────────
  const m2 = await Merchant.create({
    businessName: "Patel Kirana Hub",
    gstin: null,
    pan: "PQRST5678G",
    vpa: "patel_kirana@ybl",
    registrationStatus: "UNREGISTERED",
  });
  await ConsentRecord.create({
    merchantId: m2._id, aaConsent: true, gstnConsent: false, upiConsent: true,
  });
  // Score without GST data → PARTIAL coverage
  const score2 = await callScoring(upiData, [], aaData);
  const fhs2 = score2.finalFhsScore ? Math.max(300, score2.finalFhsScore - 80) : 541;
  await CreditScore.create({
    merchantId: m2._id,
    finalFhsScore: fhs2,
    components: { uVel: 0.7845, gstAuth: null, dsb: 0.8231 },
    weightsUsed: { w1UVel: 0.50, w2GstAuth: 0, w3Dsb: 0.50 },
    coverageTier: "PARTIAL",
    fraudFlags: [],
    explanationText: `FHS of ${fhs2} is based on UPI velocity and serviceability buffer only (GST data unavailable — unregistered entity). Coverage is PARTIAL. Requires additional scrutiny before approval.`,
  });
  await Merchant.findByIdAndUpdate(m2._id, { status: "REVIEW_REQUIRED" });
  console.log(`📊  Profile 2 scored: FHS=${fhs2}, status=REVIEW_REQUIRED (PARTIAL)`);

  // ── Profile 3: Full coverage but fraud-flagged ───────────────────────────
  const m3 = await Merchant.create({
    businessName: "Kumar Trading Co.",
    gstin: "09BBBBB5678B2Z1",
    pan: "XYZAB9012C",
    vpa: "kumar_trading@paytm",
    registrationStatus: "GST_REGISTERED",
  });
  await ConsentRecord.create({
    merchantId: m3._id, aaConsent: true, gstnConsent: true, upiConsent: true,
  });
  // Simulated fraud-flagged score
  await CreditScore.create({
    merchantId: m3._id,
    finalFhsScore: 612,
    components: { uVel: 0.6240, gstAuth: 0.7120, dsb: 0.5880 },
    weightsUsed: { w1UVel: 0.30, w2GstAuth: 0.40, w3Dsb: 0.30 },
    coverageTier: "FULL",
    fraudFlags: [
      {
        flagType: "COUNTERPARTY_CONCENTRATION",
        severity: "MEDIUM",
        evidenceRef: "avg distinct-payer ratio 0.28 below 0.35 threshold",
      },
      {
        flagType: "INVOICE_MISMATCH",
        severity: "LOW",
        evidenceRef: "GSTR-1 invoice #KT-2026-041 lacks corresponding AA credit entry",
      },
    ],
    explanationText:
      "FHS of 612 reflects moderate UPI inflow patterns (U_vel=0.62) and strong GST authentication (GST_auth=0.71), but a thin serviceability buffer (DSB=0.59). Two fraud flags were triggered: counterparty concentration and an invoice-payment mismatch. Manual review is required before any credit decision.",
  });
  await Merchant.findByIdAndUpdate(m3._id, { status: "REVIEW_REQUIRED" });
  console.log("📊  Profile 3 scored: FHS=612, status=REVIEW_REQUIRED (fraud flags)");

  console.log("\n✅  Seeding complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Officer login: officer@idbibank.com / Demo@1234");
  console.log("  API base: http://localhost:5000/api/v1");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
