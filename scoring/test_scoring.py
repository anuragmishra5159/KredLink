import unittest
import math
from app import (
    compute_u_vel,
    compute_gst_auth,
    compute_dsb,
    detect_fraud_flags,
    determine_coverage,
    clamp
)

class TestScoringEngine(unittest.TestCase):

    def setUp(self):
        # 90 days of normal UPI transactions
        self.upi_normal = [
            {"txn_date": f"2026-06-{i:02d}", "inflow_amount": 10000, "txn_count": 5, "distinct_payer_count": 4}
            for i in range(1, 91)
        ]
        
        # 4 months of GST filings (June matches June total deposits: 90 days * 10000 = 900000)
        self.gst_normal = [
            {"period": "2026-06", "gstr3b_turnover": 900000, "gstr1_sales": 900000, "filed_on": "2026-07-10"},
            {"period": "2026-05", "gstr3b_turnover": 300000, "gstr1_sales": 300000, "filed_on": "2026-06-10"},
            {"period": "2026-04", "gstr3b_turnover": 300000, "gstr1_sales": 300000, "filed_on": "2026-05-10"},
            {"period": "2026-03", "gstr3b_turnover": 300000, "gstr1_sales": 300000, "filed_on": "2026-04-10"}
        ]
        
        # 90 days of AA balance daily data
        self.aa_normal = [
            {"snapshot_date": f"2026-06-{i:02d}", "closing_balance": 150000, "is_pre_payout_low": False}
            for i in range(1, 91)
        ]

    def test_clamp_function(self):
        self.assertEqual(clamp(1.5), 1.0)
        self.assertEqual(clamp(-0.5), 0.0)
        self.assertEqual(clamp(0.5), 0.5)

    def test_compute_u_vel_normal(self):
        score = compute_u_vel(self.upi_normal)
        self.assertIsNotNone(score)
        self.assertTrue(0.0 <= score <= 1.0)
        # Coefficient of variation for constant lists is 0, clamp(1 - 0.5 * 0) = 1.0
        self.assertAlmostEqual(score, 1.0)

    def test_compute_u_vel_empty(self):
        self.assertIsNone(compute_u_vel([]))
        self.assertIsNone(compute_u_vel(self.upi_normal[:3])) # less than 7 days

    def test_compute_gst_auth_perfect_match(self):
        # Inflow cash matching exactly the GST turnover
        # For June: 30 days * 10000 = 300000. June GST = 300000.
        score = compute_gst_auth(self.gst_normal[:1], self.upi_normal, self.aa_normal)
        self.assertIsNotNone(score)
        self.assertAlmostEqual(score, 1.0)

    def test_compute_gst_auth_no_gst(self):
        self.assertIsNone(compute_gst_auth([], self.upi_normal, self.aa_normal))

    def test_compute_dsb_normal(self):
        res = compute_dsb(self.aa_normal)
        self.assertIsNotNone(res)
        score, failed_debits = res
        self.assertEqual(failed_debits, 0)
        self.assertTrue(0.0 <= score <= 1.0)

    def test_failed_debits_penalty(self):
        aa_with_failures = self.aa_normal.copy()
        aa_with_failures[0] = {**aa_with_failures[0], "failed_debit": True}
        aa_with_failures[1] = {**aa_with_failures[1], "failed_debit": True}
        
        score_normal, _ = compute_dsb(self.aa_normal)
        score_failed, failed = compute_dsb(aa_with_failures)
        
        self.assertEqual(failed, 2)
        # score should be penalized by 0.05 * 2 = 0.1
        self.assertAlmostEqual(score_normal - score_failed, 0.1)

    def test_detect_fraud_flags_clean(self):
        flags = detect_fraud_flags(self.upi_normal)
        self.assertEqual(len(flags), 0)

    def test_detect_fraud_flags_high_concentration(self):
        # 1 payer for 10 txns (distinct payer count ratio = 0.10)
        upi_fraud = [
            {"txn_date": "2026-06-01", "inflow_amount": 10000, "txn_count": 10, "distinct_payer_count": 1}
        ]
        flags = detect_fraud_flags(upi_fraud)
        self.assertEqual(len(flags), 1)
        self.assertEqual(flags[0]["flag_type"], "COUNTERPARTY_CONCENTRATION")
        self.assertEqual(flags[0]["severity"], "HIGH")

    def test_determine_coverage_full(self):
        u_vel = 1.0
        gst_auth = 1.0
        dsb = 1.0
        coverage = determine_coverage(u_vel, gst_auth, dsb, self.upi_normal)
        self.assertEqual(coverage, "FULL")

    def test_determine_coverage_partial(self):
        u_vel = 1.0
        gst_auth = None # GST linked is missing
        dsb = 1.0
        coverage = determine_coverage(u_vel, gst_auth, dsb, self.upi_normal[:65])
        self.assertEqual(coverage, "PARTIAL")

    def test_determine_coverage_minimal(self):
        # Less than 60 days
        coverage = determine_coverage(1.0, 1.0, 1.0, self.upi_normal[:30])
        self.assertEqual(coverage, "MINIMAL")

if __name__ == "__main__":
    unittest.main()
