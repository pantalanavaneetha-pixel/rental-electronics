// Business Logic - Claims Deduction Engine
// File: utils/claimProcessor.js

/**
 * Server-side late fee penalty constant.
 * ₹1,250 per day (≈ $15 USD).
 * This is the SINGLE SOURCE OF TRUTH — the backend NEVER trusts
 * the frontend's late fee calculation for security reasons.
 */
export const LATE_FEE_PER_DAY_INR = 1250;

/**
 * Safely calculates security deposit refund splits.
 * Avoids JavaScript floating-point errors by converting currencies to integer cents.
 * 
 * @param {number} initialDeposit - Security deposit held in escrow.
 * @param {Array} damageItems - Array of damage records containing cost and multiplier.
 * @returns {Object} Settlement breakdown details.
 */
export function calculateSettlement(initialDeposit, damageItems = []) {
  const depositCents = Math.round((parseFloat(initialDeposit) || 0) * 100);
  
  let totalDeductionsCents = 0;

  damageItems.forEach(item => {
    const cost = parseFloat(item.cost || item.fixedRepairCost || 0);
    const multiplier = parseFloat(item.multiplier || item.severityMultiplier || 1.00);
    
    // Convert to cents to maintain precision
    const itemDeductionCents = Math.round(cost * multiplier * 100);
    totalDeductionsCents += itemDeductionCents;
  });

  const netRefundCents = depositCents - totalDeductionsCents;
  
  const finalRefundCents = netRefundCents < 0 ? 0 : netRefundCents;
  const balanceDueCents = netRefundCents < 0 ? Math.abs(netRefundCents) : 0;

  return {
    initialDeposit: parseFloat((depositCents / 100).toFixed(2)),
    totalDeductions: parseFloat((totalDeductionsCents / 100).toFixed(2)),
    finalRefund: parseFloat((finalRefundCents / 100).toFixed(2)),
    balanceDue: parseFloat((balanceDueCents / 100).toFixed(2)),
    isBalanceDue: netRefundCents < 0
  };
}

/**
 * Server-side late fee calculator.
 * Re-computes the late penalty from the raw daysOverdue integer,
 * ignoring any fee amount the client may have sent.
 *
 * @param {number} daysOverdue - Number of days past the contract deadline (integer, >= 0).
 * @returns {{ daysOverdue: number, lateFeeCharged: number }} Verified late fee breakdown.
 */
export function calculateLateFee(daysOverdue) {
  const sanitizedDays = Math.max(0, Math.floor(parseInt(daysOverdue) || 0));
  const lateFeeCharged = sanitizedDays * LATE_FEE_PER_DAY_INR;
  return { daysOverdue: sanitizedDays, lateFeeCharged };
}
