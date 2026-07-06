const mongoose = require("mongoose");

const CreditScoreSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },
    finalFhsScore: { type: Number, min: 300, max: 900 }, // null if MINIMAL
    components: {
      uVel:    { type: Number, min: 0, max: 1 },
      gstAuth: { type: Number, min: 0, max: 1 },
      dsb:     { type: Number, min: 0, max: 1 },
    },
    weightsUsed: {
      w1UVel:    Number,
      w2GstAuth: Number,
      w3Dsb:     Number,
    },
    coverageTier: {
      type: String,
      enum: ["FULL", "PARTIAL", "MINIMAL"],
    },
    fraudFlags: [
      {
        flagType: {
          type: String,
          enum: [
            "COUNTERPARTY_CONCENTRATION",
            "CIRCULAR_TXN",
            "INVOICE_MISMATCH",
          ],
        },
        severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH"] },
        evidenceRef: String,
      },
    ],
    explanationText: { type: String, required: true },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CreditScore", CreditScoreSchema);
