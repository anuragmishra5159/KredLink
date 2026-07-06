<div align="center">

# KredLink 🔗
### Alternate Data Credit Underwriting Engine for NTB MSMEs

[![IDBI Bank Hackathon 2026](https://img.shields.io/badge/IDBI%20Bank-Hackathon%202026-1a73e8?style=for-the-badge)](https://github.com/anuragmishra5159/KredLink)
[![Track](https://img.shields.io/badge/Track%2003-NTB%20MSME%20Credit-FF6F7D?style=for-the-badge)](https://github.com/anuragmishra5159/KredLink)
[![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Python-2FC7A1?style=for-the-badge)](https://github.com/anuragmishra5159/KredLink)

> **Building credit scores for businesses with no credit history** — using UPI transactions, GST filings, and Account Aggregator data instead of CIBIL scores.

</div>

---

## 📌 Problem Statement

Over **63 million MSMEs in India** (New-To-Bank or thin-file merchants) are denied formal credit because they have no credit bureau history. Traditional underwriting requires salary slips, ITRs, and a CIBIL score — data that informal merchants simply don't have.

KredLink solves this by building a **Financial Health Score (FHS)** — a verified, explainable credit score derived entirely from alternate data:

| Data Source | What it measures |
|---|---|
| **UPI Transactions** | Revenue velocity, transaction consistency, payer diversity |
| **GST Filings** | Turnover authenticity (GSTR-1 vs GSTR-3B match vs actual bank deposits) |
| **Account Aggregator** | Debt serviceability buffer, bounce penalties, balance stability |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICANT SIDE                           │
│  Landing → Onboarding → Consent (AA/GST/UPI) → Processing → Status │
└────────────────────────────┬────────────────────────────────────┘
                             │ POST /api/v1/credit/calculate-score
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              MERN BACKEND  (Node.js / Express)  :5000           │
│  Mongoose Models: Merchant, ConsentRecord, CreditScore, User    │
│  Routes: /auth  /merchants  /credit  /decisions                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ POST /score
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         PYTHON SCORING MICROSERVICE  (Flask)  :5001             │
│  Implements PRD §2 formulas:                                    │
│    U_vel   — UPI Velocity Stability (CV of inflows)            │
│    GST_auth — Tax-to-Turnover log-ratio alignment              │
│    DSB     — Debt Serviceability Buffer (pre-payout balances)  │
│    FHS     = 300 + 600 × weighted_composite                     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MONGODB ATLAS                               │
│  Database: KredLink  Collections: users, merchants,             │
│            consentrecords, creditscores                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        OFFICER SIDE                             │
│  Login → Dashboard (light-theme analytics portal)              │
│    - Score rings (overall FHS + 3 components)                  │
│    - GST vs Deposits area chart                                 │
│    - Weekly UPI trend chart                                     │
│    - Fraud signal toggles                                       │
│    - Data coverage tiles                                        │
│    - Approve / Flag for review                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Financial Health Score Formula

```
FHS = 300 + 600 × [w₁·U_vel + w₂·GST_auth + w₃·DSB]

Default weights (FULL coverage):
  w₁ = 0.30  (UPI Velocity Stability)
  w₂ = 0.40  (GST Authenticity)        ← highest weight — most fraud-resistant
  w₃ = 0.30  (Debt Serviceability Buffer)

Coverage-adjusted weights (PARTIAL — e.g. unregistered entity, no GSTN):
  w₁ = 0.50  (UPI Velocity)
  w₂ = 0.00  (excluded)
  w₃ = 0.50  (DSB)

Output range: 300 – 900  (matches CIBIL scale for comparability)
```

### Score Bands

| Band | Range | Decision |
|---|---|---|
| 🟢 Excellent | 750–900 | Auto-approve micro-credit |
| 🔵 Good      | 650–749 | Approve with standard terms |
| 🟣 Fair      | 550–649 | Officer review recommended |
| 🔴 Poor      | 300–549 | Decline or escalate |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion, Lucide React, Recharts, Chart.js |
| **Backend** | Node.js, Express.js, Mongoose (MongoDB Atlas) |
| **Scoring Engine** | Python 3, Flask, Flask-CORS |
| **Database** | MongoDB Atlas |
| **Auth** | JWT (7-day tokens), bcrypt password hashing |

---

## 🗂️ Project Structure

```
KredLink/
│
├── scoring/                   # Python Flask scoring microservice
│   ├── app.py                 # All FHS formula implementations
│   └── requirements.txt       # Flask, flask-cors
│
├── server/                    # Node.js / Express backend
│   ├── index.js               # App entry point
│   ├── seed.js                # Seed 3 demo profiles + officer account
│   ├── .env.example           # Environment variable template
│   ├── models/
│   │   ├── User.js            # Officer accounts (bcrypt)
│   │   ├── Merchant.js        # Applicant profiles
│   │   ├── ConsentRecord.js   # AA/GST/UPI consents
│   │   └── CreditScore.js     # FHS results + fraud flags
│   ├── routes/
│   │   ├── auth.js            # POST /auth/login
│   │   ├── merchants.js       # Onboarding, consent, status
│   │   ├── credit.js          # calculate-score → calls Python
│   │   └── decisions.js       # Approve / flag decisions
│   └── middleware/
│       └── auth.js            # JWT guard
│
├── client/                    # React + Vite frontend
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.jsx          # Role selection
│       │   ├── OnboardingPage.jsx       # Business details form
│       │   ├── ConsentPage.jsx          # AA/GST/UPI toggles
│       │   ├── ProcessingPage.jsx       # Animated scoring pipeline
│       │   ├── StatusPage.jsx           # Application status + score reveal
│       │   ├── OfficerLoginPage.jsx     # Bank staff authentication
│       │   ├── OfficerDashboard.jsx     # Full analytics dashboard ★
│       │   ├── ReviewQueuePage.jsx      # Merchant table + filters
│       │   └── MerchantDetailPage.jsx   # Deep-dive + decision modal
│       └── components/
│           ├── FhsGauge.jsx             # Animated donut gauge
│           ├── TurnoverChart.jsx        # Monthly GST vs deposits
│           ├── ScoreBreakdownCard.jsx   # Animated progress bars
│           ├── FraudFlagBadge.jsx       # Severity-coded alert cards
│           └── CoverageTierIndicator.jsx
│
├── upi_daily_transactions.json  # Mock UPI data (90 days)
├── gst_returns_monthly.json     # Mock GST returns (4 periods)
├── aa_balance_daily.json        # Mock Account Aggregator data
└── PRD.md                       # Full product requirements document
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.9
- **MongoDB Atlas** account (or local `mongod`)

### 1 — Clone & Install

```bash
git clone https://github.com/anuragmishra5159/KredLink.git
cd KredLink
```

**Server dependencies:**
```bash
cd server
npm install
```

**Python scoring engine:**
```bash
cd ../scoring
pip install flask flask-cors
```

**React frontend:**
```bash
cd ../client
npm install
```

### 2 — Configure Environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/KredLink?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
SCORING_SERVICE_URL=http://localhost:5001
PORT=5000
NODE_ENV=development
```

### 3 — Seed the Database

```bash
cd server
node seed.js
```

Expected output:
```
✅  Connected to MongoDB
🗑️   Cleared existing data
👤  Officer created: officer@idbibank.com
📊  Profile 1 scored: FHS=769, status=APPROVED_FOR_MICRO_CREDIT
📊  Profile 2 scored: FHS=541, status=REVIEW_REQUIRED (PARTIAL)
📊  Profile 3 scored: FHS=612, status=REVIEW_REQUIRED (fraud flags)
✅  Seeding complete!
```

### 4 — Start All Three Services

Open **3 terminals**:

```bash
# Terminal 1 — Python Scoring Engine (port 5001)
cd scoring
python app.py

# Terminal 2 — Node.js Backend (port 5000)
cd server
node index.js

# Terminal 3 — React Frontend (port 5173)
cd client
npm run dev
```

Open **http://localhost:5173** 🚀

---

## 🎭 Demo Flows

### Applicant Journey

```
http://localhost:5173
  → Click "I'm a Business Owner"
  → Fill: Business Name, PAN, UPI VPA, registration status
  → Grant consent (AA + UPI required, GST optional)
  → Watch animated scoring pipeline (6 steps)
  → See Financial Health Score reveal
```

### Officer Journey

```
http://localhost:5173
  → Click "I'm a Credit Officer"
  → Login: officer@idbibank.com  /  Demo@1234
  → Lands on Analytics Dashboard with 3 seeded profiles
  → Click any merchant in sidebar to load their data
  → Review: score rings, GST chart, UPI trend, fraud signals
  → Click "Approve for micro-credit" or "Flag for review"
  → Applicant status screen updates in real time
```

---

## 📊 Seeded Demo Profiles

| Merchant | FHS | Coverage | Flags | Status |
|---|---|---|---|---|
| **Sharma General Store** | 769 | FULL | None | ✅ Approved |
| **Patel Kirana Hub** | 541 | PARTIAL | None | 🔍 Review (no GST) |
| **Kumar Trading Co.** | 612 | FULL | Counterparty + Invoice | 🔍 Review (fraud) |

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Officer authentication → returns JWT |

### Merchants
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/merchants/onboard` | Register new merchant |
| `POST` | `/api/v1/merchants/:id/consent` | Record AA/GST/UPI consent |
| `GET`  | `/api/v1/merchants` | List all merchants (auth required) |
| `GET`  | `/api/v1/merchants/:id` | Get merchant + credit score |

### Credit Scoring
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/credit/calculate-score` | Trigger Python scoring engine |

### Python Microservice
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `localhost:5001/score` | Compute FHS from UPI/GST/AA arrays |
| `GET`  | `localhost:5001/health` | Liveness probe |

### Decisions
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/decisions/:merchantId` | Officer approve or flag |

---

## 🛡️ Fraud Detection

Three automated checks run on every application:

| Check | Trigger | Severity |
|---|---|---|
| **Counterparty Concentration** | avg distinct-payer ratio < 0.35 | HIGH / MEDIUM |
| **Circular Transaction** | self-referential UPI patterns | HIGH |
| **Invoice–Payment Mismatch** | GSTR-1 invoice with no matching AA credit | LOW |

Any fraud flag automatically routes the application to `REVIEW_REQUIRED`.

---

## 🖼️ Screenshots

### Landing Page
Dark glassmorphism hero with animated ambient glows, role selection cards with hover lift effects.

### Officer Dashboard
Light-theme analytics portal with:
- **Score composition**: 4 Recharts donut rings (coral=UPI, blue=GST, teal=DSB, magenta=overall)
- **Area charts**: GST reported vs AA-verified deposits (monthly) + UPI weekly trend
- **Fraud toggles**: 3 checks shown as on/off pill switches
- **Merchant queue**: sidebar with live status badges, clickable to swap data

---

## 🔒 Security Notes

- Passwords hashed with **bcrypt** (10 rounds)
- All officer-facing routes protected by **JWT middleware**
- Merchant status endpoint is public (applicants poll their own status)
- `.env` excluded from version control — never commit credentials

---

## 📄 License

This project was built for the **IDBI Bank Hackathon 2026 — Track 03: NTB MSME Credit Underwriting**.

---

<div align="center">

Built with ❤️ for financial inclusion · IDBI Bank Hackathon 2026

</div>
