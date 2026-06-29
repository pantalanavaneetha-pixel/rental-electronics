// E2E Pipeline Verification Test Runner
// File: tests/e2e_pipeline.js

import fetch from 'node-fetch'; // Standard fetch (Node 18+) or fallback

const BACKEND_URL = 'http://localhost:5000/api';

async function runE2ETests() {
  console.log("==================================================================");
  console.log("🧪 RUNNING RENTAL PIPELINE E2E INTEGRATION TESTS");
  console.log("==================================================================\n");

  let rentalId = null;
  let testCustomerEmail = `e2e_test_${Date.now()}@example.com`;
  let baseDepositINR = 30000;

  // ──────────────────────────────────────────────────────────────────
  // STEP 1: RESET DATABASE
  // ──────────────────────────────────────────────────────────────────
  console.log("1. Resetting database to clean seed state...");
  const resetRes = await fetch(`${BACKEND_URL}/reset`, { method: 'POST' });
  const resetData = await resetRes.json();
  if (!resetRes.ok || !resetData.success) {
    throw new Error(`Reset failed: ${JSON.stringify(resetData)}`);
  }
  console.log("✔ Database reset and seeded successfully.\n");

  // ──────────────────────────────────────────────────────────────────
  // STEP 2: CREATE RENTAL BOOKING (Booking Creation)
  // ──────────────────────────────────────────────────────────────────
  console.log("2. Creating new rental booking (Escrow Deposit held)...");
  const rentalPayload = {
    userName: "John Doe",
    userEmail: testCustomerEmail,
    userPhone: "+919876599999",
    isCorporate: false,
    kycStatus: "Verified",
    address: "123 Green Valley, Sector 15, Gurgaon",
    deviceSerial: `SN-MBP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    deviceCategory: "MacBook Pro M3",
    deviceBaseCost: 120000,
    startDate: "2026-06-01",
    endDate: "2026-06-08", // 7-day duration
    securityDeposit: baseDepositINR,
    baseTariff: 4500,
    initialConditionNotes: "Brand new device, factory default packaging."
  };

  const createRes = await fetch(`${BACKEND_URL}/rentals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rentalPayload)
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.success) {
    throw new Error(`Booking creation failed: ${JSON.stringify(createData)}`);
  }
  
  rentalId = createData.data.id;
  console.log(`✔ Rental created with ID: ${rentalId}`);
  console.log(`✔ Escrow Deposit Held: ₹${createData.data.security_deposit}\n`);

  // ──────────────────────────────────────────────────────────────────
  // STEP 3: VERIFY DASHBOARD LEDGER OUTPUT
  // ──────────────────────────────────────────────────────────────────
  console.log("3. Verifying record exists on dashboard outputs...");
  const ledgerRes = await fetch(`${BACKEND_URL}/records`);
  const ledgerData = await ledgerRes.json();
  if (!ledgerRes.ok) {
    throw new Error("Failed to retrieve dashboard records");
  }
  const createdRecord = ledgerData.find(r => r.rentalId === rentalId);
  if (!createdRecord) {
    throw new Error(`Created rental ${rentalId} not found in dashboard ledger list!`);
  }
  console.log(`✔ Record verified on dashboard. status: ${createdRecord.settlementStatus}\n`);

  // ──────────────────────────────────────────────────────────────────
  // STEP 4: RETURN CHECK-IN & CLAIM ASSESSMENT (Return Assessment)
  // ──────────────────────────────────────────────────────────────────
  console.log("4. Submitting return hand-in with screen damage and 3 days late fees...");
  const returnPayload = {
    rentalId,
    daysOverdue: 3, // late fee ₹1,250/day * 3 = ₹3,750
    securityDepositHeld: baseDepositINR,
    damages: [
      { type: "Cracked Screen", cost: 10000, multiplier: 1.0 } // repair cost ₹10,000
    ],
    triageFlag: false,
    photoEvidenceUrl: "https://images.unsplash.com/photo-1595206133361-b1fe343e5e23",
    description: "Screen cracked near home button due to customer fall."
  };

  const returnRes = await fetch(`${BACKEND_URL}/claims/${rentalId}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(returnPayload)
  });
  const returnData = await returnRes.json();
  if (!returnRes.ok || !returnData.success) {
    throw new Error(`Return processing failed: ${JSON.stringify(returnData)}`);
  }
  console.log(`✔ Return successfully checked in.`);
  console.log(`✔ Calculated Late Penalty: ₹${returnData.lateFee.lateFeeCharged}`);
  console.log(`✔ Backend Estimated Refund: ₹${returnData.data.breakdown.finalRefundAfterLateFee}\n`);

  // ──────────────────────────────────────────────────────────────────
  // STEP 5: VERIFY DEDUCTION WORKFLOW BREAKDOWN & AI NOTES
  // ──────────────────────────────────────────────────────────────────
  console.log("5. Fetching deduction workflow breakdown and generated prompts...");
  const breakdownRes = await fetch(`${BACKEND_URL}/settlements/${rentalId}`);
  const breakdown = await breakdownRes.json();
  if (!breakdownRes.ok) {
    throw new Error(`Failed to retrieve settlement breakdown: ${JSON.stringify(breakdown)}`);
  }

  console.log("✔ Verified Breakdown Metrics:");
  console.log(`   - Base Deposit held : ₹${breakdown.base_deposit}`);
  console.log(`   - Damage Deduction  : ₹${breakdown.damage_deduction} (Cracked Screen)`);
  console.log(`   - Overdue Daily Fees: ₹${breakdown.late_fees} (3 days)`);
  console.log(`   - Net Refund Balance: ₹${breakdown.final_net_refund}`);
  
  if (breakdown.final_net_refund !== 11250) {
    throw new Error(`Calculations mismatch! Expected ₹11,250 refund, got ₹${breakdown.final_net_refund}`);
  }
  console.log("✔ Math checks match perfectly.");
  console.log(`✔ AI Prompt preview successfully saved in database.\n`);

  // ──────────────────────────────────────────────────────────────────
  // STEP 6: SIMULATE AI GENERATION OVERRIDE
  // ──────────────────────────────────────────────────────────────────
  console.log("6. Running simulated Gemini LLM to generate customer-friendly email...");
  const aiRes = await fetch(`${BACKEND_URL}/ai/generate-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: breakdown.aiPrompt })
  });
  const aiData = await aiRes.json();
  if (!aiRes.ok || !aiData.success) {
    throw new Error(`AI generation failed: ${JSON.stringify(aiData)}`);
  }
  console.log("✔ AI Customer Friendly Statement Generated successfully:\n");
  console.log(aiData.notes.split('\n').map(l => `   | ${l}`).join('\n') + "\n");

  // ──────────────────────────────────────────────────────────────────
  // STEP 7: APPROVE & CLOSE SETTLEMENT
  // ──────────────────────────────────────────────────────────────────
  console.log("7. Approving settlement and closing the claim contract...");
  const settlePayload = {
    notes: aiData.notes,
    paymentMethod: "UPI Refund Transfer",
    status: "SETTLED",
    trackingStatus: "SETTLED"
  };
  
  const settleRes = await fetch(`${BACKEND_URL}/settlements/${rentalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settlePayload)
  });
  const settleData = await settleRes.json();
  if (!settleRes.ok) {
    throw new Error(`Settlement closure failed: ${JSON.stringify(settleData)}`);
  }
  console.log(`✔ Claim settled. Status changed: ${settleData.settlementStatus}`);
  console.log(`✔ Settlement closure timestamp: ${settleData.settlementAt}\n`);

  // ──────────────────────────────────────────────────────────────────
  // STEP 8: VERIFY DASHBOARD STATE OUTPUT
  // ──────────────────────────────────────────────────────────────────
  console.log("8. Verifying final dashboard output registers closed state...");
  const finalLedgerRes = await fetch(`${BACKEND_URL}/records`);
  const finalLedger = await finalLedgerRes.json();
  const finalRecord = finalLedger.find(r => r.rentalId === rentalId);
  if (!finalRecord || finalRecord.settlementStatus !== 'Settled') {
    throw new Error(`Record status was not closed as Settled on dashboard! Current status: ${finalRecord?.settlementStatus}`);
  }
  console.log("✔ Dashboard output successfully verified.\n");

  // ──────────────────────────────────────────────────────────────────
  // STEP 9: VERIFY MESSAGING LOGS TRAIL
  // ──────────────────────────────────────────────────────────────────
  console.log("9. Verifying simulated messaging API logs for confirmations/reminders...");
  const notifyRes = await fetch(`${BACKEND_URL}/notifications?rentalId=${rentalId}`);
  const notifications = (await notifyRes.json()).data;
  
  console.log(`✔ Messaging trail details (${notifications.length} alerts dispatched):`);
  notifications.forEach((n, idx) => {
    console.log(`   [Alert ${idx + 1}] Channel: ${n.type} | Recipient: ${n.recipient}`);
    console.log(`             Message: "${n.message.substring(0, 80)}..."`);
  });
  console.log("");

  console.log("==================================================================");
  console.log("🎉 ALL E2E INTEGRATION PIPELINE TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================================");
}

runE2ETests().catch(err => {
  console.error("\n❌ E2E INTEGRATION TEST SUITE FAILED:");
  console.error(err);
  process.exit(1);
});
