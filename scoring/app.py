"""
KredLink — Python Scoring Microservice (Flask)
Wraps the validated scoring logic from mock.py into a REST API.
POST /score  — computes FHS from UPI / GST / AA data
GET  /health — liveness probe
"""

import math
import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import date

app = Flask(__name__)
CORS(app)

# ─── helpers ─────────────────────────────────────────────────────────────────

def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))

def _mean(xs):
    return sum(xs) / len(xs) if xs else 0.0

def _stdev(xs):
    if len(xs) < 2:
        return 0.0
    m = _mean(xs)
    return math.sqrt(sum((x - m) ** 2 for x in xs) / len(xs))

# ─── scoring components ───────────────────────────────────────────────────────

def compute_u_vel(upi_daily_txn):
    """UPI Velocity Stability — PRD §2.1"""
    if not upi_daily_txn or len(upi_daily_txn) < 7:
        return None

    amounts = [d["inflow_amount"] for d in upi_daily_txn]
    counts  = [d["txn_count"]     for d in upi_daily_txn]

    mean_a = _mean(amounts)
    mean_c = _mean(counts)

    cv_amount = (_stdev(amounts) / mean_a) if mean_a > 0 else 1.0
    cv_count  = (_stdev(counts)  / mean_c) if mean_c > 0 else 1.0

    return clamp(1 - 0.5 * (cv_amount + cv_count))


def compute_gst_auth(gst_returns, upi_daily_txn, aa_balance_daily):
    """Tax-to-Turnover Match — PRD §2.2"""
    if not gst_returns:
        return None

    alignments = []
    for g in gst_returns:
        period_month = g["period"][:7]  # "YYYY-MM"

        # Use UPI inflows as AA cash proxy for the same month
        monthly_deposits = sum(
            d["inflow_amount"]
            for d in upi_daily_txn
            if d["txn_date"][:7] == period_month
        )

        aa_month_days = [
            a for a in aa_balance_daily
            if a["snapshot_date"][:7] == period_month
        ]
        aa_cash_proxy = monthly_deposits + (
            sum(
                max(0, aa_month_days[i]["closing_balance"] - aa_month_days[i-1]["closing_balance"])
                for i in range(1, len(aa_month_days))
            ) if len(aa_month_days) > 1 else 0
        )

        if aa_cash_proxy <= 0:
            continue

        r = g["gstr3b_turnover"] / aa_cash_proxy
        alignment = 1 - min(1, abs(math.log(r)) / math.log(2))
        alignments.append(alignment)

    return clamp(_mean(alignments)) if alignments else None


def compute_dsb(aa_balance_daily, monthly_obligation_estimate=42000):
    """Debt Serviceability Buffer — PRD §2.3"""
    pre_payout = [
        a["closing_balance"]
        for a in aa_balance_daily
        if a.get("is_pre_payout_low", False)
    ]

    if not pre_payout:
        # Fall back to all balances if no explicit flag
        pre_payout = [a["closing_balance"] for a in aa_balance_daily]

    if not pre_payout:
        return None

    mean_balance = _mean(pre_payout)
    buffer_ratios = [b / monthly_obligation_estimate for b in pre_payout]
    buffer_component    = clamp(_mean(buffer_ratios) / 1.5)
    stability_component = clamp(1 - (_stdev(pre_payout) / mean_balance if mean_balance > 0 else 1))

    dsb_raw = 0.7 * buffer_component + 0.3 * stability_component

    # Bounce penalty
    failed_debits = sum(1 for a in aa_balance_daily if a.get("failed_debit", False))
    dsb = clamp(dsb_raw - 0.05 * failed_debits)

    return dsb, failed_debits


def detect_fraud_flags(upi_daily_txn):
    """Counterparty concentration check — PRD §2.5"""
    flags = []
    if not upi_daily_txn:
        return flags

    ratios = [
        d["distinct_payer_count"] / d["txn_count"]
        for d in upi_daily_txn
        if d.get("txn_count", 0) > 0 and d.get("distinct_payer_count") is not None
    ]
    if not ratios:
        return flags

    avg_ratio = _mean(ratios)
    if avg_ratio < 0.35:
        flags.append({
            "flag_type": "COUNTERPARTY_CONCENTRATION",
            "severity": "HIGH" if avg_ratio < 0.20 else "MEDIUM",
            "evidence_ref": f"avg distinct-payer ratio {avg_ratio:.2f} below 0.35 threshold"
        })

    return flags


def determine_coverage(u_vel, gst_auth, dsb, upi_daily_txn):
    """Coverage tier — PRD §2.4"""
    streams = sum([u_vel is not None, gst_auth is not None, dsb is not None])
    days = len(upi_daily_txn) if upi_daily_txn else 0

    if streams == 3 and days >= 90:
        return "FULL"
    elif streams >= 2 and days >= 60:
        return "PARTIAL"
    else:
        return "MINIMAL"


def build_explanation(fhs, u_vel, gst_auth, dsb):
    u_desc  = "stable"   if (u_vel  or 0) > 0.6 else "variable"
    g_desc  = "strong"   if (gst_auth or 0) > 0.7 else "moderate"
    d_desc  = "sufficient" if (dsb or 0) > 0.6 else "thin"
    return (
        f"FHS of {fhs} reflects {u_desc} UPI inflow patterns "
        f"(U_vel={round(u_vel or 0, 2)}), a {g_desc} match between GST-reported "
        f"turnover and bank-verified cash deposits (GST_auth={round(gst_auth or 0, 2)}), "
        f"and a {d_desc} debt serviceability buffer ahead of monthly obligations "
        f"(DSB={round(dsb or 0, 2)}). Weights: 40% GST authenticity, 30% UPI velocity, "
        f"30% serviceability buffer."
    )

# ─── routes ───────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "kredlink-scoring"}), 200


@app.route("/score", methods=["POST"])
def score():
    body = request.get_json(force=True)

    upi  = body.get("upiDailyTxn", [])
    gst  = body.get("gstReturns", [])
    aa   = body.get("aaBalanceDaily", [])

    # Compute components
    u_vel    = compute_u_vel(upi)
    gst_auth = compute_gst_auth(gst, upi, aa)
    dsb_result = compute_dsb(aa)

    if dsb_result is None:
        dsb = None
        failed_debits = 0
    else:
        dsb, failed_debits = dsb_result

    coverage = determine_coverage(u_vel, gst_auth, dsb, upi)

    # Insufficient data path
    if coverage == "MINIMAL":
        return jsonify({
            "success": True,
            "finalFhsScore": None,
            "components": {"uVel": u_vel, "gstAuth": gst_auth, "dsb": dsb},
            "weightsUsed": {"w1UVel": None, "w2GstAuth": None, "w3Dsb": None},
            "coverageTier": "MINIMAL",
            "fraudFlags": [],
            "explanationText": "Insufficient data for a reliable score. Routing to manual review.",
            "status": "INSUFFICIENT_DATA"
        }), 200

    # Reweight for PARTIAL coverage
    weights = {"uVel": 0.30, "gstAuth": 0.40, "dsb": 0.30}
    available = {k: v for k, v in [("uVel", u_vel), ("gstAuth", gst_auth), ("dsb", dsb)] if v is not None}
    weight_map = {"uVel": 0.30, "gstAuth": 0.40, "dsb": 0.30}
    total_w = sum(weight_map[k] for k in available)
    composite = sum(weight_map[k] * available[k] for k in available) / total_w

    fhs = round(300 + 600 * composite)
    fhs = max(300, min(900, fhs))  # safety clamp

    fraud_flags = detect_fraud_flags(upi)

    # Bounce override
    bounce_override = failed_debits > 3

    status = "APPROVED_FOR_MICRO_CREDIT"
    if fraud_flags or bounce_override or coverage == "PARTIAL":
        status = "REVIEW_REQUIRED"

    explanation = build_explanation(fhs, u_vel, gst_auth, dsb)

    return jsonify({
        "success": True,
        "finalFhsScore": fhs,
        "components": {
            "uVel":    round(u_vel    or 0, 4),
            "gstAuth": round(gst_auth or 0, 4),
            "dsb":     round(dsb      or 0, 4)
        },
        "weightsUsed": {
            "w1UVel":    weight_map["uVel"]    / total_w,
            "w2GstAuth": weight_map["gstAuth"] / total_w,
            "w3Dsb":     weight_map["dsb"]     / total_w
        },
        "coverageTier": coverage,
        "fraudFlags": fraud_flags,
        "explanationText": explanation,
        "status": status
    }), 200


if __name__ == "__main__":
    port = int(os.environ.get("SCORING_PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
