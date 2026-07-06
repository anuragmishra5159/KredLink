const express = require("express");
const router = express.Router();
const Merchant = require("../models/Merchant");
const ConsentRecord = require("../models/ConsentRecord");
const CreditScore = require("../models/CreditScore");
const { protect } = require("../middleware/auth");

// POST /api/v1/merchants/onboard
router.post("/onboard", async (req, res) => {
  try {
    const { businessName, gstin, pan, vpa, registrationStatus } = req.body;
    const merchant = await Merchant.create({
      businessName,
      gstin,
      pan,
      vpa,
      registrationStatus,
    });
    res.status(201).json({ success: true, merchant });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "GSTIN already registered" });
    }
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/v1/merchants/:id/consent
router.post("/:id/consent", async (req, res) => {
  try {
    const { aaConsent, gstnConsent, upiConsent } = req.body;
    const merchant = await Merchant.findById(req.params.id);
    if (!merchant) return res.status(404).json({ success: false, message: "Merchant not found" });

    const consent = await ConsentRecord.create({
      merchantId: req.params.id,
      aaConsent: !!aaConsent,
      gstnConsent: !!gstnConsent,
      upiConsent: !!upiConsent,
    });
    res.status(201).json({ success: true, consent });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/v1/merchants — officer only, sorted by FHS desc
router.get("/", protect, async (req, res) => {
  try {
    const enriched = await Merchant.aggregate([
      {
        $lookup: {
          from: "creditscores",
          let: { merchantId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$merchantId", "$$merchantId"] } } },
            { $sort: { computedAt: -1 } },
            { $limit: 1 }
          ],
          as: "creditScore"
        }
      },
      {
        $addFields: {
          creditScore: { $arrayElemAt: ["$creditScore", 0] }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    // Sort by FHS descending (nulls last)
    enriched.sort((a, b) => {
      const aScore = a.creditScore?.finalFhsScore ?? -1;
      const bScore = b.creditScore?.finalFhsScore ?? -1;
      return bScore - aScore;
    });

    res.json({ success: true, count: enriched.length, merchants: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/merchants/:id
router.get("/:id", async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.params.id).lean();
    if (!merchant) return res.status(404).json({ success: false, message: "Merchant not found" });

    const creditScore = await CreditScore.findOne({ merchantId: req.params.id })
      .sort({ computedAt: -1 })
      .lean();

    const consent = await ConsentRecord.findOne({ merchantId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, merchant, creditScore: creditScore || null, consent: consent || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
