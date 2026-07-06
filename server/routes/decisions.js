const express = require("express");
const router = express.Router();
const Merchant = require("../models/Merchant");
const { protect } = require("../middleware/auth");

// POST /api/v1/decisions/:merchantId  — officer decision
router.post("/:merchantId", protect, async (req, res) => {
  try {
    const { decision, note } = req.body;

    const allowed = ["APPROVED_FOR_MICRO_CREDIT", "REVIEW_REQUIRED"];
    if (!allowed.includes(decision)) {
      return res.status(400).json({
        success: false,
        message: `decision must be one of: ${allowed.join(", ")}`,
      });
    }

    const merchant = await Merchant.findByIdAndUpdate(
      req.params.merchantId,
      {
        status: decision,
        decisionNote: note || "",
        decidedBy: req.user._id,
        decidedAt: new Date(),
      },
      { new: true }
    );

    if (!merchant) {
      return res.status(404).json({ success: false, message: "Merchant not found" });
    }

    res.json({
      success: true,
      message: `Merchant status updated to ${decision}`,
      merchant,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
