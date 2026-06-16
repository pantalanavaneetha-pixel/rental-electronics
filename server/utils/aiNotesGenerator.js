// AI / Rule-Based Logic Module
// File: utils/aiNotesGenerator.js

/**
 * Generates technical claim audit logs and customer-friendly settlement messages
 * based on assessed damages, security deposit details, and late return parameters.
 * 
 * @param {string} damageType - Selected damage category description.
 * @param {number} damageDeduction - Suggested physical repair deduction.
 * @param {number} daysOverdue - Days past deadline.
 * @param {number} lateFeeCharged - Calculated overdue penalty.
 * @param {number} securityDepositHeld - Escrow deposit size.
 * @returns {{ explanation: string, customerNotes: string }} Generated texts.
 */
export function generateAiNotes(damageType, damageDeduction, daysOverdue, lateFeeCharged, securityDepositHeld) {
  const deposit = parseFloat(securityDepositHeld) || 0;
  const damage = parseFloat(damageDeduction) || 0;
  const lateFee = parseFloat(lateFeeCharged) || 0;
  const days = parseInt(daysOverdue) || 0;

  const totalDeductions = damage + lateFee;
  const netRefund = deposit - totalDeductions;
  const isDeficit = netRefund < 0;
  const absRefund = Math.abs(netRefund);

  let explanation = '';
  let customerNotes = '';

  if (damageType && damageType !== 'None') {
    // Physical damage is present
    explanation = `[AI Analysis Module] Physical damage detected: "${damageType}". Assessed repair cost: ₹${damage.toLocaleString()}. `;
    if (days > 0) {
      explanation += `Device returned overdue by ${days} days, incurring ₹${lateFee.toLocaleString()} late penalty (₹1,250/day). `;
    }
    explanation += `Total deductions: ₹${totalDeductions.toLocaleString()} against upfront security deposit of ₹${deposit.toLocaleString()}. Net outcome: ${
      isDeficit 
        ? `Deficit of ₹${absRefund.toLocaleString()} due from client.` 
        : `Clear refund of ₹${netRefund.toLocaleString()} due to client.`
    }`;

    customerNotes = `Dear Customer, during our post-rental check-in inspection, physical damage was identified on the returned device: "${damageType}". `;
    if (days > 0) {
      customerNotes += `Additionally, the equipment was returned ${days} days past the scheduled deadline. `;
    }
    customerNotes += `As per the rental contract terms, a repair fee of ₹${damage.toLocaleString()}${
      days > 0 ? ` and a late fee of ₹${lateFee.toLocaleString()}` : ''
    } has been applied against your security deposit of ₹${deposit.toLocaleString()}. `;

    if (isDeficit) {
      customerNotes += `Since total charges exceed the deposit, there is an outstanding liability of ₹${absRefund.toLocaleString()}. A detailed corporate invoice will be sent shortly to clear this balance. Thank you for your cooperation.`;
    } else {
      customerNotes += `The remaining refund balance of ₹${netRefund.toLocaleString()} has been approved and will be credited to your account shortly. Thank you for renting with us!`;
    }
  } else {
    // Device returned in perfect condition
    if (days > 0) {
      // Overdue returns but no damage
      explanation = `[AI Analysis Module] Device returned in perfect condition. Return is delayed by ${days} days, incurring late fee of ₹${lateFee.toLocaleString()} (₹1,250/day). Net outcome: ${
        isDeficit 
          ? `Deficit of ₹${absRefund.toLocaleString()} due from client.` 
          : `Clear refund of ₹${netRefund.toLocaleString()} due to client.`
      }`;

      customerNotes = `Dear Customer, we have received the returned equipment in perfect condition. Thank you! However, as the return was delayed by ${days} days, a late return fee of ₹${lateFee.toLocaleString()} has been applied against your security deposit of ₹${deposit.toLocaleString()}. `;
      if (isDeficit) {
        customerNotes += `The outstanding balance of ₹${absRefund.toLocaleString()} will be invoiced to your account.`;
      } else {
        customerNotes += `The remaining balance of ₹${netRefund.toLocaleString()} has been cleared for transfer and will be credited shortly.`;
      }
    } else {
      // Perfect condition and on time
      explanation = `[AI Analysis Module] Equipment check-in verification complete. Device returned on time in perfect condition. Recommend 100% deposit release of ₹${deposit.toLocaleString()} with no penalties.`;

      customerNotes = `Dear Customer, we have received the returned equipment on time and in perfect physical condition. We have cleared your full security deposit of ₹${deposit.toLocaleString()} for immediate refund. Thank you for your business, and we look forward to renting to you again!`;
    }
  }

  return { explanation, customerNotes };
}
