/**
 * test_backend.js
 * Integration test suite for KredLink backend.
 * Checks endpoints, auth guards, response structures, and scoring correctness.
 */

const axios = require("axios");

const API_BASE = "http://localhost:5000/api/v1";
let token = "";
let testMerchantId = "";
let testOfficerId = "";

const log = (step, success, details = "") => {
  console.log(`[${success ? "SUCCESS" : "FAILED"}] Step: ${step} ${details ? `(${details})` : ""}`);
};

async function runTests() {
  console.log("=== STARTING KREDLINK BACKEND TESTS ===");

  // 1. Health check
  try {
    const res = await axios.get(`${API_BASE}/health`);
    if (res.data.status === "ok") {
      log("1. Health Check", true);
    } else {
      log("1. Health Check", false, "status not ok");
    }
  } catch (err) {
    log("1. Health Check", false, err.message);
  }

  // 2. Register/Login Test Officer
  const testEmail = `test_officer_${Date.now()}@idbi.com`;
  const registerPayload = {
    name: "Test Officer",
    email: testEmail,
    password: "Password@123",
    employeeId: "EMP-TEST-001",
    branch: "Test Branch"
  };

  try {
    const res = await axios.post(`${API_BASE}/auth/register`, registerPayload);
    if (res.data.success && res.data.token) {
      token = res.data.token;
      testOfficerId = res.data.user.id;
      log("2. Auth Register & Token Sign", true, `Email: ${testEmail}`);
    } else {
      log("2. Auth Register & Token Sign", false, "Response missing success or token");
    }
  } catch (err) {
    log("2. Auth Register & Token Sign", false, err.response?.data?.message || err.message);
  }

  // 3. Login
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: "Password@123"
    });
    if (res.data.success && res.data.token) {
      log("3. Auth Login", true);
    } else {
      log("3. Auth Login", false, "Login response missing token");
    }
  } catch (err) {
    log("3. Auth Login", false, err.response?.data?.message || err.message);
  }

  // 4. Onboard Merchant
  const onboardingPayload = {
    businessName: `Test General Store ${Date.now()}`,
    gstin: `27TESTA${Math.floor(1000 + Math.random() * 9000)}A1Z0`,
    pan: `TESTP${Math.floor(1000 + Math.random() * 9000)}F`,
    vpa: `teststore${Math.floor(100 + Math.random() * 900)}@okaxis`,
    registrationStatus: "GST_REGISTERED"
  };

  try {
    const res = await axios.post(`${API_BASE}/merchants/onboard`, onboardingPayload);
    if (res.data.success && res.data.merchant._id) {
      testMerchantId = res.data.merchant._id;
      log("4. Onboard Merchant", true, `Name: ${onboardingPayload.businessName}, ID: ${testMerchantId}`);
    } else {
      log("4. Onboard Merchant", false, "Response structure invalid");
    }
  } catch (err) {
    log("4. Onboard Merchant", false, err.response?.data?.message || err.message);
  }

  // 5. Grant Consent
  try {
    const res = await axios.post(`${API_BASE}/merchants/${testMerchantId}/consent`, {
      aaConsent: true,
      gstnConsent: true,
      upiConsent: true
    });
    if (res.data.success) {
      log("5. Grant Consent", true);
    } else {
      log("5. Grant Consent", false);
    }
  } catch (err) {
    log("5. Grant Consent", false, err.response?.data?.message || err.message);
  }

  // 6. Calculate Score (calling python microservice)
  try {
    const res = await axios.post(`${API_BASE}/credit/calculate-score`, {
      merchantId: testMerchantId
    });
    if (res.data.success && res.data.finalFhsScore) {
      log("6. Calculate Score (Python + Node integration)", true, `FHS: ${res.data.finalFhsScore}, status: ${res.data.status}`);
    } else {
      log("6. Calculate Score (Python + Node integration)", false, "Response structure invalid or missing score");
    }
  } catch (err) {
    log("6. Calculate Score (Python + Node integration)", false, err.response?.data?.message || err.message);
  }

  // 7. Get Merchant details
  try {
    const res = await axios.get(`${API_BASE}/merchants/${testMerchantId}`);
    if (res.data.success && res.data.creditScore) {
      log("7. Get Merchant Profile & Score", true);
    } else {
      log("7. Get Merchant Profile & Score", false);
    }
  } catch (err) {
    log("7. Get Merchant Profile & Score", false, err.response?.data?.message || err.message);
  }

  // 8. Get Review Queue (authorized)
  try {
    const res = await axios.get(`${API_BASE}/merchants`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.success && res.data.merchants.length > 0) {
      log("8. Get Review Queue (Protected)", true, `Count: ${res.data.merchants.length}`);
    } else {
      log("8. Get Review Queue (Protected)", false);
    }
  } catch (err) {
    log("8. Get Review Queue (Protected)", false, err.response?.data?.message || err.message);
  }

  // 8b. Get Review Queue (unauthorized - expected failure)
  try {
    await axios.get(`${API_BASE}/merchants`);
    log("8b. Get Review Queue Auth Guard", false, "Allowed unauthorized access!");
  } catch (err) {
    if (err.response?.status === 401) {
      log("8b. Get Review Queue Auth Guard", true, "Unauthorized access correctly blocked (401)");
    } else {
      log("8b. Get Review Queue Auth Guard", false, `Expected 401, got ${err.response?.status}`);
    }
  }

  // 9. Officer Decision (authorized)
  try {
    const res = await axios.post(
      `${API_BASE}/decisions/${testMerchantId}`,
      { decision: "APPROVED_FOR_MICRO_CREDIT", note: "Test approval decision" },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.data.success && res.data.merchant.status === "APPROVED_FOR_MICRO_CREDIT") {
      log("9. Officer Decision (Approved)", true);
    } else {
      log("9. Officer Decision (Approved)", false);
    }
  } catch (err) {
    log("9. Officer Decision (Approved)", false, err.response?.data?.message || err.message);
  }

  console.log("=== TESTS COMPLETE ===");
}

runTests();
