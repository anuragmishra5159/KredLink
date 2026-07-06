const mongoose = require("mongoose");

const ConsentRecordSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },
    aaConsent: { type: Boolean, default: false },
    gstnConsent: { type: Boolean, default: false },
    upiConsent: { type: Boolean, default: false },
    fiuHandle: { type: String },
    fipHandle: { type: String },
    purposeCode: { type: String, default: "CREDIT_SCORING" },
    consentStatus: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "REVOKED"],
      default: "ACTIVE",
    },
    validFrom: { type: Date, default: Date.now },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ConsentRecord", ConsentRecordSchema);
