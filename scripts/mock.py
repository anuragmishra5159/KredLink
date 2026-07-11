import json
import random
import math
import os
from datetime import date, timedelta

# Output directory for mock data
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "../server/data"))
os.makedirs(DATA_DIR, exist_ok=True)

random.seed(42)

PROFILE_ID = "MSME-KL-000123"
GSTIN = "23AAAAA0000A1Z5"
COMPANY = "Sharma General Store"
TODAY = date(2026, 7, 6)

# ---------------------------------------------------------------
# 1. UPI daily transaction stream (last 90 days)
# ---------------------------------------------------------------
upi_days = []
base_amount = 31500
base_count = 45
for i in range(90):
    d = TODAY - timedelta(days=90 - i)
    weekday_boost = 1.15 if d.weekday() in (5, 6) else 1.0
    amount = max(2000, round(random.gauss(base_amount, 3200) * weekday_boost, 2))
    txn_count = max(5, round(random.gauss(base_count, 7) * weekday_boost))
    distinct_payers = max(4, round(txn_count * random.uniform(0.55, 0.8)))
    upi_days.append({
        "profile_id": PROFILE_ID,
        "txn_date": d.isoformat(),
        "inflow_amount": amount,
        "txn_count": txn_count,
        "distinct_payer_count": distinct_payers
    })

# ---------------------------------------------------------------
# 2. GST returns (trailing 4 filing periods)
# ---------------------------------------------------------------
gst_returns = []
months = [(2026, 3), (2026, 4), (2026, 5), (2026, 6)]
gstr3b_base = 950000
for (y, m) in months:
    turnover = round(gstr3b_base * random.uniform(0.92, 1.08), 2)
    sales = round(turnover * random.uniform(0.97, 1.02), 2)
    gst_returns.append({
        "profile_id": PROFILE_ID,
        "period": f"{y}-{m:02d}-01",
        "gstr1_sales": sales,
        "gstr3b_turnover": turnover,
        "filed_on": f"{y}-{m:02d}-18"
    })

# ---------------------------------------------------------------
# 3. AA-sourced balance snapshots (last 180 days), obligation due on the 5th
# ---------------------------------------------------------------
aa_balances = []
running_balance = 55000
monthly_obligation_estimate = 42000
for i in range(180):
    d = TODAY - timedelta(days=180 - i)
    running_balance += random.gauss(1800, 2500)
    running_balance = max(8000, running_balance)
    is_pre_payout = d.day == 4  # day before the 5th obligation date
    aa_balances.append({
        "profile_id": PROFILE_ID,
        "snapshot_date": d.isoformat(),
        "closing_balance": round(running_balance, 2),
        "is_pre_payout_low": is_pre_payout
    })
    if d.day == 5:
        running_balance -= monthly_obligation_estimate * random.uniform(0.9, 1.0)
        running_balance = max(8000, running_balance)

# ---------------------------------------------------------------
# Save raw mock inputs (what each API/stream would return)
# ---------------------------------------------------------------
with open(os.path.join(DATA_DIR, "upi_daily_transactions.json"), "w") as f:
    json.dump(upi_days, f, indent=2)

with open(os.path.join(DATA_DIR, "gst_returns_monthly.json"), "w") as f:
    json.dump(gst_returns, f, indent=2)

with open(os.path.join(DATA_DIR, "aa_balance_daily.json"), "w") as f:
    json.dump(aa_balances, f, indent=2)

# ---------------------------------------------------------------
# Scoring logic (matches the framework doc)
# ---------------------------------------------------------------
def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))

def mean(xs):
    return sum(xs) / len(xs)

def stdev(xs):
    m = mean(xs)
    return math.sqrt(sum((x - m) ** 2 for x in xs) / len(xs))

# U_vel
amounts = [d["inflow_amount"] for d in upi_days]
counts = [d["txn_count"] for d in upi_days]
cv_amount = stdev(amounts) / mean(amounts)
cv_count = stdev(counts) / mean(counts)
u_vel = clamp(1 - 0.5 * (cv_amount + cv_count))

# GST_auth : match each GST period's turnover against AA cash deposits for that same month
alignments = []
for g in gst_returns:
    period_month = g["period"][:7]  # "YYYY-MM"
    monthly_deposits = sum(
        d["inflow_amount"] for d in upi_days if d["txn_date"][:7] == period_month
    )
    aa_month_days = [a for a in aa_balances if a["snapshot_date"][:7] == period_month]
    aa_cash_proxy = monthly_deposits + (
        sum(max(0, aa_month_days[i]["closing_balance"] - aa_month_days[i - 1]["closing_balance"])
            for i in range(1, len(aa_month_days))) if len(aa_month_days) > 1 else 0
    )
    if aa_cash_proxy <= 0:
        continue
    r = g["gstr3b_turnover"] / aa_cash_proxy
    alignment = 1 - min(1, abs(math.log(r)) / math.log(2))
    alignments.append(alignment)
gst_auth = clamp(mean(alignments)) if alignments else 0.5

# DSB
pre_payout_balances = [a["closing_balance"] for a in aa_balances if a["is_pre_payout_low"]]
buffer_ratios = [b / monthly_obligation_estimate for b in pre_payout_balances]
buffer_component = clamp(mean(buffer_ratios) / 1.5)
stability_component = clamp(1 - (stdev(pre_payout_balances) / mean(pre_payout_balances)))
dsb = clamp(0.7 * buffer_component + 0.3 * stability_component)

# Weights (expert-prior, documented in framework doc)
w1, w2, w3 = 0.30, 0.40, 0.30
composite = (w1 * u_vel + w2 * gst_auth + w3 * dsb) / (w1 + w2 + w3)
fhs = round(300 + 600 * composite)

# Simple fraud-flag check: counterparty concentration proxy
avg_payer_share = mean([d["distinct_payer_count"] / d["txn_count"] for d in upi_days])
fraud_flags = []
if avg_payer_share < 0.35:
    fraud_flags.append({
        "flag_type": "COUNTERPARTY_CONCENTRATION",
        "severity": "MEDIUM",
        "evidence_ref": f"avg distinct-payer ratio {avg_payer_share:.2f} below 0.35 threshold"
    })

coverage_tier = "FULL" if alignments and pre_payout_balances and len(upi_days) >= 60 else "PARTIAL"

api_response = {
    "profile_id": PROFILE_ID,
    "gstin": GSTIN,
    "company_name": COMPANY,
    "computed_at": TODAY.isoformat(),
    "components": {
        "u_vel": round(u_vel, 4),
        "gst_auth": round(gst_auth, 4),
        "dsb": round(dsb, 4)
    },
    "weights_used": {"w1_u_vel": w1, "w2_gst_auth": w2, "w3_dsb": w3},
    "coverage_tier": coverage_tier,
    "calculated_fhs": fhs,
    "fraud_flags": fraud_flags,
    "explanation_text": (
        f"FHS of {fhs} reflects {'stable' if u_vel > 0.6 else 'variable'} UPI inflow patterns "
        f"(U_vel={round(u_vel,2)}), a "
        f"{'strong' if gst_auth > 0.7 else 'moderate'} match between GST-reported turnover and "
        f"bank-verified cash deposits (GST_auth={round(gst_auth,2)}), and a "
        f"{'sufficient' if dsb > 0.6 else 'thin'} debt serviceability buffer ahead of monthly "
        f"obligations (DSB={round(dsb,2)}). Weights: 40% GST authenticity, 30% UPI velocity, "
        f"30% serviceability buffer."
    )
}

with open(os.path.join(DATA_DIR, "api_response_sample.json"), "w") as f:
    json.dump(api_response, f, indent=2)

print(json.dumps(api_response, indent=2))