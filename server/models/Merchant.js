const mongoose = require("mongoose");

const MerchantSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },
    gstin: { type: String, unique: true, sparse: true, trim: true },
    pan: { type: String, required: true, trim: true },
    vpa: { type: String, required: true, trim: true },
    registrationStatus: {
      type: String,
      enum: ["GST_REGISTERED", "COMPOSITE_SCHEME", "UNREGISTERED"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "APPROVED_FOR_MICRO_CREDIT",
        "REVIEW_REQUIRED",
        "INSUFFICIENT_DATA",
      ],
      default: "PENDING",
    },
    decisionNote: { type: String }, // Officer's note on decision
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Merchant", MerchantSchema);
