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

/**
 * Calculates dynamic repair/damage deductions based on device category and base cost.
 * Laptop Cracked Screen: 15%
 * Camera Cracked Screen: 16%
 * Phone Cracked Screen: 10%
 * Tablet Cracked Screen: 12%
 */
export function getDynamicDamageCost(damageName, category, baseCost) {
  const base = parseFloat(baseCost) || 0;
  const cat = (category || '').toLowerCase();
  const dmg = (damageName || '').toLowerCase();

  if (base <= 0) {
    if (dmg.includes('screen')) return 10000;
    if (dmg.includes('dent') || dmg.includes('scratch')) return 3750;
    if (dmg.includes('water') || dmg.includes('fluid')) return 20833;
    if (dmg.includes('port') || dmg.includes('charging')) return 5000;
    if (dmg.includes('accessories') || dmg.includes('charger')) return 2500;
    if (dmg.includes('power') || dmg.includes('defect') || dmg.includes('hardware')) return 12000;
    return 0;
  }

  let group = 'general';
  if (cat.includes('laptop') || cat.includes('macbook') || cat.includes('notebook')) {
    group = 'laptop';
  } else if (cat.includes('camera') || cat.includes('lens') || cat.includes('dslr')) {
    group = 'camera';
  } else if (cat.includes('phone') || cat.includes('iphone') || cat.includes('samsung')) {
    group = 'phone';
  } else if (cat.includes('ipad') || cat.includes('tablet') || cat.includes('galaxy tab')) {
    group = 'tablet';
  }

  if (dmg.includes('screen')) {
    if (group === 'laptop') return Math.round(base * 0.15);
    if (group === 'camera') return Math.round(base * 0.16);
    if (group === 'tablet') return Math.round(base * 0.12);
    if (group === 'phone') return Math.round(base * 0.10);
    return Math.round(base * 0.12);
  }

  if (dmg.includes('dent') || dmg.includes('scratch')) {
    if (group === 'laptop') return Math.round(base * 0.05);
    if (group === 'camera') return Math.round(base * 0.05);
    if (group === 'tablet') return Math.round(base * 0.04);
    if (group === 'phone') return Math.round(base * 0.03);
    return Math.round(base * 0.04);
  }

  if (dmg.includes('water') || dmg.includes('fluid')) {
    if (group === 'laptop') return Math.round(base * 0.30);
    if (group === 'camera') return Math.round(base * 0.35);
    if (group === 'tablet') return Math.round(base * 0.25);
    if (group === 'phone') return Math.round(base * 0.20);
    return Math.round(base * 0.25);
  }

  if (dmg.includes('port') || dmg.includes('charging')) {
    if (group === 'laptop') return Math.round(base * 0.08);
    if (group === 'camera') return Math.round(base * 0.08);
    if (group === 'tablet') return Math.round(base * 0.06);
    if (group === 'phone') return Math.round(base * 0.05);
    return Math.round(base * 0.06);
  }

  if (dmg.includes('power') || dmg.includes('defect') || dmg.includes('hardware')) {
    if (group === 'laptop') return Math.round(base * 0.20);
    if (group === 'camera') return Math.round(base * 0.20);
    if (group === 'tablet') return Math.round(base * 0.15);
    if (group === 'phone') return Math.round(base * 0.12);
    return Math.round(base * 0.15);
  }

  if (dmg.includes('accessories') || dmg.includes('charger') || dmg.includes('cable')) {
    if (group === 'laptop') return Math.round(base * 0.04);
    if (group === 'camera') return Math.round(base * 0.04);
    if (group === 'tablet') return Math.round(base * 0.03);
    if (group === 'phone') return Math.round(base * 0.02);
    return Math.round(base * 0.03);
  }

  return 0;
}
