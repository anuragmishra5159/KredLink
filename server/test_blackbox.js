/**
 * test_blackbox.js
 * Exhaustive Integration and Black-Box validation suite for KredLink.
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5000/api/v1";
let authHeader = {};
let merchantId = "";
const uniquePan = `PAN${Math.floor(10000 + Math.random() * 90000)}K`;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBlackBoxTests() {
  console.log("\n=======================================================");
  console.log("    KREDLINK BLACK-BOX INTEGRATION TEST SUITE          ");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (name, condition, details = "") => {
    if (condition) {
      console.log(`[PASS] ${name} ${details ? `(${details})` : ""}`);
      passed++;
    } else {
      console.log(`[FAIL] ${name} ${details ? `(${details})` : ""}`);
      failed++;
    }
  };

  // 1. Health Probe
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    assert(
      "1. Health Check Response",
      res.status === 200 && res.data.status === "ok",
      `Status: ${res.data.status}`
    );
  } catch (err) {
    assert("1. Health Check Response", false, err.message);
  }

  // 2. Auth Guard Validation (Unauthorized request block)
  try {
    await axios.get(`${BASE_URL}/merchants`);
    assert("2. Auth Guard Protection", false, "Allowed unauthorized access!");
  } catch (err) {
    assert(
      "2. Auth Guard Protection",
      err.response?.status === 401,
      `Correctly blocked with status ${err.response?.status}`
    );
  }

  // 3. Officer Authentication
  try {
    const email = `officer_test_${Date.now()}@idbi.com`;
    // Register
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: "Verification Officer",
      email,
      password: "Password@123",
      employeeId: "EMP-VERIFY-99",
      branch: "Mumbai Central"
    });
    
    // Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password: "Password@123"
    });

    if (loginRes.data.success && loginRes.data.token) {
      authHeader = { headers: { Authorization: `Bearer ${loginRes.data.token}` } };
      assert("3. Officer Registration & Login Pipeline", true, `Officer email: ${email}`);
    } else {
      assert("3. Officer Registration & Login Pipeline", false, "Login token missing");
    }
  } catch (err) {
    assert("3. Officer Registration & Login Pipeline", false, err.response?.data?.message || err.message);
  }

  // 4. Merchant Onboarding Input Validation
  try {
    const onboardRes = await axios.post(`${BASE_URL}/merchants/onboard`, {
      businessName: "Future Foods Corp",
      gstin: `27${uniquePan}1Z0`,
      pan: uniquePan,
      vpa: "futurefoods@okaxis",
      registrationStatus: "GST_REGISTERED"
    });

    if (onboardRes.data.success && onboardRes.data.merchant._id) {
      merchantId = onboardRes.data.merchant._id;
      assert(
        "4. Merchant Onboarding",
        onboardRes.data.merchant.status === "PENDING",
        `Merchant ID: ${merchantId}, Initial Status: ${onboardRes.data.merchant.status}`
      );
    } else {
      assert("4. Merchant Onboarding", false, "Response structure mismatch");
    }
  } catch (err) {
    assert("4. Merchant Onboarding", false, err.response?.data?.message || err.message);
  }

  // 5. Consent Linking
  try {
    const consentRes = await axios.post(`${BASE_URL}/merchants/${merchantId}/consent`, {
      aaConsent: true,
      gstnConsent: true,
      upiConsent: true
    });
    assert(
      "5. AA / UPI / GST Consent Record",
      consentRes.data.success && consentRes.data.consent.aaConsent === true,
      "Consent link logged"
    );
  } catch (err) {
    assert("5. AA / UPI / GST Consent Record", false, err.response?.data?.message || err.message);
  }

  // 6. Real-time Risk Scoring (Integration with Python Scoring Microservice)
  try {
    const scoreRes = await axios.post(`${BASE_URL}/credit/calculate-score`, {
      merchantId
    });

    if (scoreRes.data.success) {
      assert(
        "6. Scoring Engine Integration",
        scoreRes.data.finalFhsScore > 300 && scoreRes.data.finalFhsScore <= 900,
        `Calculated FHS: ${scoreRes.data.finalFhsScore}, status: ${scoreRes.data.status}`
      );
    } else {
      assert("6. Scoring Engine Integration", false, "Scoring calculation failed");
    }
  } catch (err) {
    assert("6. Scoring Engine Integration", false, err.response?.data?.message || err.message);
  }

  // 7. Aggregate Review Queue Retrieval
  try {
    const queueRes = await axios.get(`${BASE_URL}/merchants`, authHeader);
    const found = queueRes.data.merchants.find(m => m._id === merchantId);
    assert(
      "7. Optimized Review Queue Fetch",
      queueRes.data.success && found && found.creditScore !== null,
      `Queue size: ${queueRes.data.merchants.length}, Newly added merchant score matched: ${found?.creditScore?.finalFhsScore}`
    );
  } catch (err) {
    assert("7. Optimized Review Queue Fetch", false, err.response?.data?.message || err.message);
  }

  // 8. Public Status Tracking by PAN
  try {
    const trackRes = await axios.post(`${BASE_URL}/merchants/track`, {
      pan: uniquePan
    });
    assert(
      "8. Public Status Tracking (By PAN)",
      trackRes.data.success && trackRes.data.merchant.businessName === "Future Foods Corp",
      `Tracked Name: ${trackRes.data.merchant.businessName}, Live Status: ${trackRes.data.merchant.status}`
    );
  } catch (err) {
    assert("8. Public Status Tracking (By PAN)", false, err.response?.data?.message || err.message);
  }

  // 9. Officer Override Decisioning
  try {
    const decisionRes = await axios.post(
      `${BASE_URL}/decisions/${merchantId}`,
      { decision: "APPROVED_FOR_MICRO_CREDIT", note: "Auto-assessment confirmed healthy credit indicators." },
      authHeader
    );
    
    // Check tracking status reflects approval
    const trackVerify = await axios.post(`${BASE_URL}/merchants/track`, { pan: uniquePan });

    assert(
      "9. Officer Decision Override & Realtime Update",
      decisionRes.data.success && trackVerify.data.merchant.status === "APPROVED_FOR_MICRO_CREDIT",
      `Updated Status: ${trackVerify.data.merchant.status}, Note: ${trackVerify.data.merchant.decisionNote}`
    );
  } catch (err) {
    assert("9. Officer Decision Override & Realtime Update", false, err.response?.data?.message || err.message);
  }

  console.log("\n=======================================================");
  console.log(`    TEST REPORT: ${passed} PASSED, ${failed} FAILED     `);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runBlackBoxTests();
