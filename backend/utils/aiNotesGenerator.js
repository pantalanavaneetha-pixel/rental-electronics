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
    explanation = `[AUDIT] Damage: ${damageType} (-₹${damage.toLocaleString()})${days > 0 ? ` | Overdue: ${days}d (-₹${lateFee.toLocaleString()})` : ''} | Refund: ₹${netRefund.toLocaleString()}`;
    customerNotes = `Damage: ${damageType} (-₹${damage.toLocaleString()})${days > 0 ? ` | Overdue: ${days}d (-₹${lateFee.toLocaleString()})` : ''} | Net Refund: ₹${netRefund.toLocaleString()}`;
  } else {
    if (days > 0) {
      explanation = `[AUDIT] Clean Return | Overdue: ${days}d (-₹${lateFee.toLocaleString()}) | Refund: ₹${netRefund.toLocaleString()}`;
      customerNotes = `Clean Return | Overdue: ${days}d (-₹${lateFee.toLocaleString()}) | Net Refund: ₹${netRefund.toLocaleString()}`;
    } else {
      explanation = `[AUDIT] Clean & On-Time | Full Deposit Release: ₹${deposit.toLocaleString()}`;
      customerNotes = `Clean & On-Time Return | Full Refund Released: ₹${deposit.toLocaleString()}`;
    }
  }

  const aiPrompt = `You are a Senior Customer Relations Manager at One Point Solutions. Please write a very short, simple, and direct one-line reconciliation summary (under 20 words) for the customer:
- Deposit: ₹${deposit.toLocaleString()}
- Damage: ${damageType && damageType !== 'None' ? `"${damageType}" (-₹${damage.toLocaleString()})` : "None"}
- Overdue: ${days > 0 ? `${days} days (-₹${lateFee.toLocaleString()})` : "No"}
- Resolution: ${isDeficit ? `Deficit of ₹${absRefund.toLocaleString()} due from customer` : `Refund of ₹${netRefund.toLocaleString()} due to customer`}

Instructions:
1. Write ONLY one concise sentence.
2. Do NOT include greeting or email signature. Keep it under 20 words.`;

  return { explanation, customerNotes, aiPrompt };
}
