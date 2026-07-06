const express = require("express");
const router = express.Router();
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const Merchant = require("../models/Merchant");
const CreditScore = require("../models/CreditScore");
const { protect } = require("../middleware/auth");

const SCORING_URL = process.env.SCORING_SERVICE_URL || "http://localhost:5001";

// Load mock data files (used as the "retrieved" alternate data streams)
const DATA_DIR = path.join(__dirname, "../../");
const loadMockData = (filename) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), "utf8"));
  } catch {
    return [];
  }
};

// Normalise keys from snake_case (Python mock) to camelCase
const normUpi = (raw) =>
  raw.map((d) => ({
    txn_date: d.txn_date || d.txnDate,
    inflow_amount: d.inflow_amount ?? d.inflowAmount ?? 0,
    txn_count: d.txn_count ?? d.txnCount ?? 0,
    distinct_payer_count: d.distinct_payer_count ?? d.distinctPayerCount ?? 0,
  }));

const normGst = (raw) =>
  raw.map((d) => ({
    period: d.period,
    gstr1_sales: d.gstr1_sales ?? d.gstr1Sales ?? 0,
    gstr3b_turnover: d.gstr3b_turnover ?? d.gstr3bTurnover ?? 0,
    filed_on: d.filed_on ?? d.filedOn,
  }));

const normAa = (raw) =>
  raw.map((d) => ({
    snapshot_date: d.snapshot_date ?? d.snapshotDate,
    closing_balance: d.closing_balance ?? d.closingBalance ?? 0,
    is_pre_payout_low: d.is_pre_payout_low ?? d.isPrePayoutLow ?? false,
    failed_debit: d.failed_debit ?? d.failedDebit ?? false,
  }));

// POST /api/v1/credit/calculate-score
router.post("/calculate-score", async (req, res) => {
  try {
    const { merchantId, upiDailyTxn, gstReturns, aaBalanceDaily, customWeights } = req.body;

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) return res.status(404).json({ success: false, message: "Merchant not found" });

    // Use provided data or fall back to mock files
    const upi = normUpi(upiDailyTxn?.length ? upiDailyTxn : loadMockData("upi_daily_transactions.json"));
    const gst = normGst(gstReturns?.length    ? gstReturns    : loadMockData("gst_returns_monthly.json"));
    const aa  = normAa(aaBalanceDaily?.length  ? aaBalanceDaily : loadMockData("aa_balance_daily.json"));

    // Mark merchant as processing
    await Merchant.findByIdAndUpdate(merchantId, { status: "PROCESSING" });

    // Call Python scoring microservice
    const { data: scoreData } = await axios.post(`${SCORING_URL}/score`, {
      upiDailyTxn: upi,
      gstReturns: gst,
      aaBalanceDaily: aa,
      customWeights
    });

    // Persist credit score
    const creditScore = await CreditScore.create({
      merchantId,
      finalFhsScore: scoreData.finalFhsScore,
      components: scoreData.components,
      weightsUsed: scoreData.weightsUsed,
      coverageTier: scoreData.coverageTier,
      fraudFlags: (scoreData.fraudFlags || []).map((f) => ({
        flagType: f.flag_type || f.flagType,
        severity: f.severity,
        evidenceRef: f.evidence_ref || f.evidenceRef,
      })),
      explanationText: scoreData.explanationText,
    });

    // Update merchant status
    await Merchant.findByIdAndUpdate(merchantId, { status: scoreData.status });

    res.json({
      success: true,
      merchantId,
      finalFhsScore: scoreData.finalFhsScore,
      components: scoreData.components,
      weightsUsed: scoreData.weightsUsed,
      coverageTier: scoreData.coverageTier,
      fraudFlags: creditScore.fraudFlags,
      explanationText: scoreData.explanationText,
      status: scoreData.status,
      creditScoreId: creditScore._id,
    });
  } catch (err) {
    console.error("Scoring error:", err.message);
    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        message: "Scoring microservice unavailable — ensure Python service is running on port 5001",
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/credit/:merchantId — get latest score for a merchant
router.get("/:merchantId", async (req, res) => {
  try {
    const score = await CreditScore.findOne({ merchantId: req.params.merchantId })
      .sort({ computedAt: -1 })
      .lean();

    if (!score) return res.status(404).json({ success: false, message: "No score found" });
    res.json({ success: true, creditScore: score });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
