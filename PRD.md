# Product Requirement Document (PRD) — v2
## Project Name: Kred-Link (Track 03)
**Subtitle:** Alternate Data Credit Underwriting Engine for NTB MSMEs
**Target Event:** IDBI Bank Hackathon 2026
**Tech Stack:** MERN (MongoDB, Express.js, React.js, Node.js) + Python (data engineering & scoring reference implementation)

**Changelog from v1:** Formula rewritten to guarantee the 300–900 bound, adds a third scoring pillar (serviceability buffer) instead of folding it into an unbounded penalty, adds missing-data handling for MSMEs without full GST/AA/UPI coverage, adds a fraud-flag layer separate from the score itself, and expands the schema with an explainability audit trail. Mock data generation is already built and validated — see Section 6.

---

## 1. Executive Summary & Objective

Traditional credit underwriting frameworks rely heavily on historical credit bureau scores (e.g., CIBIL), which systematically exclude New-to-Bank (NTB) micro, small, and medium enterprises. **Kred-Link** solves this by aggregating three alternate data streams into a single, explainable, bounded **Financial Health Score (FHS)** ranging from 300 to 900:

1. **Account Aggregator (AA) Consent Streams** — historical banking balance/transaction footprints
2. **GSTN Logs** — GSTR-1 (sales invoices) and GSTR-3B (monthly tax returns) verifying top-line revenue
3. **UPI Live Transaction Logs** — micro-retail inflow consistency and payment density

The score must be **deterministic and auditable** — every component that fed a given FHS has to be reconstructable by a credit officer, not just a final number.

---

## 2. Refined Scoring Formula

```
FHS = 300 + 600 × [ (ω₁·U_vel + ω₂·GST_auth + ω₃·DSB) / (ω₁ + ω₂ + ω₃) ]
```

Each component is normalized to `[0, 1]` *before* weighting, so the formula is mathematically guaranteed to land in `[300, 900]` — no post-hoc clamping needed, no validation errors against the Mongoose schema.

| Weight | Value | Rationale |
|---|---|---|
| ω₂ (GST_auth) | 0.40 | Cross-checks a government filing against bank-verified cash — hardest to fake |
| ω₁ (U_vel) | 0.30 | Real signal, but more gameable in isolation |
| ω₃ (DSB) | 0.30 | Directly predicts repayment capacity |

### 2.1 U_vel — UPI Velocity Stability
```
CV_amount = std(daily_inflow, 90d) / mean(daily_inflow, 90d)
CV_count  = std(daily_txn_count, 90d) / mean(daily_txn_count, 90d)
U_vel = clamp(1 - 0.5 × (CV_amount + CV_count), 0, 1)
```

### 2.2 GST_auth — Tax-to-Turnover Match
```
r_m = GSTR3B_turnover_m / AA_verified_cash_deposits_m
alignment_m = 1 - min(1, |ln(r_m)| / ln(2))
GST_auth = mean(alignment_m) over trailing 4 filing periods
```

### 2.3 DSB — Debt Serviceability Buffer (now absorbs the v1 bounce penalty, bounded)
```
buffer_ratio_m = lowest_balance_before_payout_m / monthly_obligation_estimate
buffer_component = clamp(buffer_ratio / 1.5, 0, 1)
stability_component = clamp(1 - CV(lowest_balance_series), 0, 1)
DSB_raw = 0.7 × buffer_component + 0.3 × stability_component

# v1's failed-NACH/bounce penalty, kept but bounded instead of open-ended:
DSB = clamp(DSB_raw - 0.05 × failed_debit_count, 0, 1)
```
Each failed automated debit knocks 5 percentage points off the serviceability score, capped at 0 — so it degrades the score without ever breaking the formula's bounds. If `failed_debit_count` in the trailing 90 days exceeds 3, additionally set `status = "REVIEW_REQUIRED"` regardless of the numeric score — a high-bounce account shouldn't get an automatic approval just because other components are strong.

### 2.4 Missing-Data / Coverage Handling
Most NTB MSMEs won't have all three streams (many are below the GST registration threshold). Reweight rather than exclude:

| Coverage Tier | Condition | Behavior |
|---|---|---|
| `FULL` | All 3 streams, ≥90 days history | Standard formula above |
| `PARTIAL` | 2 of 3 streams, ≥60 days | Reweight remaining ω's proportionally; flag `coverageTier: "PARTIAL"` |
| `MINIMAL` | 1 stream or <60 days | `status: "INSUFFICIENT_DATA"` — route to manual review, not outright rejection |

### 2.5 Fraud/Anomaly Flags (kept separate from the score, not folded into it)
- **Counterparty concentration**: flag if UPI inflows cluster among very few distinct payer VPAs
- **Circular transaction detection**: flag near-equal offsetting payer↔payee pairs in a short window
- **Invoice–payment reconciliation**: flag GST invoices with no corresponding AA-verified credit

Keeping these as discrete flags (not score deductions) lets a credit officer see *why* a profile was penalized instead of reverse-engineering it from a lower number — this is the difference between "explainable" and "just less of a black box."

---

## 3. Technical Architecture & Data Flow

```
[ React Frontend Portal ]
        │ ▲
 (REST) │ │ (JSON payloads / analytics)
        ▼ │
[ Node.js / Express.js Backend ] ◄── (Auth) ──► [ JWT / Passport ]
        │ ▲
        │ │ (proxied scoring call)
        ▼ │
[ Python Scoring Microservice ]   ◄── reference implementation, avoids re-deriving
        │                              log-ratio / CV math in JS under time pressure
        ▼
[ MongoDB Atlas ]
```

**Recommendation:** don't port the scoring math into JavaScript during the hackathon. A working, tested Python reference implementation already exists (Section 6) — have Node.js call it as a lightweight internal microservice (`POST http://localhost:5001/score`) rather than reimplementing log-ratio normalization and coefficient-of-variation logic in JS under time pressure. This is lower-risk than a rewrite and still satisfies "MERN + Python" — Python does the math, Node does the API/auth/orchestration layer, same as originally scoped for "Python (Data Engineering)."

### Data Flow Steps
1. **Ingestion**: React portal pushes merchant identity + AA/GST/UPI JSON to the Node API
2. **Scoring**: Node forwards the compiled payload to the Python scoring microservice, which returns the FHS, component breakdown, coverage tier, and fraud flags
3. **Persistence**: Node writes the full response — including the explanation text and audit fields — to MongoDB, transitioning the merchant to an evaluable state

---

## 4. Database Schema (MongoDB / Mongoose)

### 4.1 Merchant Profile (`merchants`)
```javascript
const MerchantSchema = new mongoose.Schema({
    businessName: { type: String, required: true },
    gstin: { type: String, unique: true, sparse: true }, // sparse: not all MSMEs are GST-registered
    pan: { type: String, required: true },
    vpa: { type: String, required: true },
    registrationStatus: {
        type: String,
        enum: ['GST_REGISTERED', 'COMPOSITE_SCHEME', 'UNREGISTERED'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED_FOR_MICRO_CREDIT', 'REVIEW_REQUIRED', 'INSUFFICIENT_DATA'],
        default: 'PENDING'
    },
    createdAt: { type: Date, default: Date.now }
});
```

### 4.2 Consent Records (`consentRecords`) — new
```javascript
const ConsentSchema = new mongoose.Schema({
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    fiuHandle: String,
    fipHandle: String,
    purposeCode: String,
    consentStatus: { type: String, enum: ['ACTIVE', 'EXPIRED', 'REVOKED'] },
    validFrom: Date,
    validUntil: Date
});
```

### 4.3 Credit Score with Full Audit Trail (`creditScores`)
```javascript
const CreditScoreSchema = new mongoose.Schema({
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    finalFhsScore: { type: Number, required: true, min: 300, max: 900 },
    components: {
        uVel: { type: Number, min: 0, max: 1 },
        gstAuth: { type: Number, min: 0, max: 1 },
        dsb: { type: Number, min: 0, max: 1 }
    },
    weightsUsed: {
        w1UVel: Number,
        w2GstAuth: Number,
        w3Dsb: Number
    },
    coverageTier: { type: String, enum: ['FULL', 'PARTIAL', 'MINIMAL'] },
    fraudFlags: [{
        flagType: { type: String, enum: ['COUNTERPARTY_CONCENTRATION', 'CIRCULAR_TXN', 'INVOICE_MISMATCH'] },
        severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
        evidenceRef: String
    }],
    explanationText: { type: String, required: true }, // human-readable rationale for the credit officer
    computedAt: { type: Date, default: Date.now }
});
```

### 4.4 Raw Time-Series Collections — new
Needed for the dashboard's time-series overlay chart and for recomputing `U_vel`/`GST_auth`/`DSB` on demand, rather than only storing a final snapshot:

```javascript
const UpiDailyTxnSchema = new mongoose.Schema({
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    txnDate: { type: Date, required: true },
    inflowAmount: Number,
    txnCount: Number,
    distinctPayerCount: Number
});

const GstReturnSchema = new mongoose.Schema({
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    period: Date,
    gstr1Sales: Number,
    gstr3bTurnover: Number,
    filedOn: Date
});

const AaBalanceDailySchema = new mongoose.Schema({
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    snapshotDate: { type: Date, required: true },
    closingBalance: Number,
    isPrePayoutLow: Boolean,
    failedDebit: Boolean // feeds the DSB bounce adjustment
});
```

---

## 5. REST API Design

### 5.1 Onboard Merchant
`POST /api/v1/merchants/onboard`
```json
{
  "businessName": "Mishra Retail Enterprises Private Limited",
  "gstin": "27AAAAA1234A1Z0",
  "pan": "ABCDE1234F",
  "vpa": "merchant_999@oksbi",
  "registrationStatus": "GST_REGISTERED"
}
```
Response: `201 Created`

### 5.2 Compute Score
`POST /api/v1/credit/calculate-score`
```json
{
  "merchantId": "65e6b4f2c5e5c71123456789",
  "upiDailyTxn": [ /* ... */ ],
  "gstReturns": [ /* ... */ ],
  "aaBalanceDaily": [ /* ... */ ]
}
```

**Response (200 OK)** — this shape matches what the working Python reference implementation already outputs (Section 6), so the frontend can be built against real numbers today rather than a guessed schema:
```json
{
  "success": true,
  "merchantId": "65e6b4f2c5e5c71123456789",
  "finalFhsScore": 769,
  "components": {
    "uVel": 0.8722,
    "gstAuth": 0.5851,
    "dsb": 0.9535
  },
  "weightsUsed": { "w1UVel": 0.30, "w2GstAuth": 0.40, "w3Dsb": 0.30 },
  "coverageTier": "FULL",
  "fraudFlags": [],
  "explanationText": "FHS of 769 reflects stable UPI inflow patterns (U_vel=0.87), a moderate match between GST-reported turnover and bank-verified cash deposits (GST_auth=0.59), and a sufficient debt serviceability buffer ahead of monthly obligations (DSB=0.95).",
  "status": "APPROVED_FOR_MICRO_CREDIT"
}
```

---

## 6. Data Simulation & Reference Scoring (already built and validated)

This section previously described a task to build — it's done. A working Python script generates realistic 90-day UPI streams, 4 trailing GST filing periods, and 180 days of AA balance snapshots (with pre-payout low-balance flags matching a modeled EMI cycle), then runs the exact formula from Section 2 against it end-to-end. Sample run against a mock "Sharma General Store" profile: **FHS = 769, coverage = FULL, zero fraud flags.**

Use this directly as:
- The Python scoring microservice's core logic (Section 3) — wrap the calculation functions in a small Flask/FastAPI endpoint
- The seed data for `upiDailyTxn` / `gstReturns` / `aaBalanceDaily` collections during sandbox testing
- The reference output the frontend gauge/chart components should be built against

---

## 7. Credit Officer Dashboard (React / Tailwind / Chart.js)

Same core requirements as v1, with two additions that follow directly from the audit-trail schema:

- **Macro health gauge** (300–900) — unchanged
- **Time-series overlay**: monthly GST turnover vs. AA-verified cash deposits — unchanged
- **Approval recommendation card** — now renders `explanationText` directly from the API response rather than being separately authored copy, so the officer-facing rationale can never drift out of sync with the actual computed components
- **New: Fraud flag badges** — if `fraudFlags` is non-empty, surface each flag with its severity, rather than only reflecting fraud risk as a lower number
- **New: Coverage tier indicator** — visually distinguish `FULL` / `PARTIAL` / `MINIMAL` so an officer knows whether a score is based on complete data or should carry more scrutiny

---

## 8. Step-by-Step Roadmap

**Phase 1 (Day 1, morning) — Data infrastructure:** Already complete — mock generator + scoring reference script produce validated JSON output today. Time saved here should be reallocated to Phase 3.

**Phase 2 (Day 1, afternoon) — Backend:** Stand up Express server + Mongoose schemas (Section 4). Wrap the Python scoring logic in a minimal Flask/FastAPI service; Node proxies to it rather than reimplementing the math.

**Phase 3 (Day 2, morning) — Dashboard:** Build the React portal against the real response shape in Section 5.2 — gauge, time-series overlay, explanation card, fraud flag badges, coverage indicator.

**Phase 4 (Day 2, afternoon) — Integration & demo:** Wire Axios calls end-to-end. Run at least three profiles live: one clean approval, one `PARTIAL` coverage case (no GST registration), and one with fraud flags triggered — this demonstrates the explainability differentiator, not just a working pipeline.

---

## 9. Success Criteria

- **Bounded correctness**: FHS mathematically guaranteed within 300–900 for any input (fixed from v1)
- **Explainability**: every score ships with a component breakdown and human-readable rationale, not just a number
- **Coverage-aware**: MSMEs without full GST/AA/UPI history get a `PARTIAL`/`MINIMAL` path instead of being silently excluded — this is the actual target segment of the challenge statement
- **Latency**: scoring round-trip (Node → Python microservice → Node) under 150ms on typical transaction array sizes
