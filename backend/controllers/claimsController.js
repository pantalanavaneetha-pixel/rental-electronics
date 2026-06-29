// Claims Controller
// File: controllers/claimsController.js

import pool from '../config/db.js';
import { calculateSettlement, calculateLateFee, getDynamicDamageCost } from '../utils/claimProcessor.js';
import { AppError } from '../middlewares/errorHandler.js';
import { generateAiNotes } from '../utils/aiNotesGenerator.js';
import { sendEmail, sendWhatsApp } from '../utils/notifier.js';
import crypto from 'crypto';

/**
 * Evaluates, captures and settles a damage claim contract.
 * If flaggedForUrgentTriage is true, the device bypasses normal maintenance
 * queues and is immediately isolated (status: ISOLATED_REPAIR) for Priority Repair.
 */
export const processClaim = async (req, res, next) => {
  const rentalId = req.params.rentalId || req.body.rentalId;
  // Intercept incoming fields for sanitization and validation
  const customer_email = req.body.customer_email || req.body.customerEmail;
  const days_overdue = req.body.days_overdue !== undefined ? req.body.days_overdue : req.body.daysOverdue;
  const security_deposit_held = req.body.security_deposit_held !== undefined ? req.body.security_deposit_held : req.body.securityDepositHeld;

  // Server-Side Sanitation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (customer_email !== undefined && customer_email !== null && customer_email !== '') {
    if (!emailRegex.test(customer_email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid customer email format.'
      });
    }
  }

  // Financial Boundaries
  if (security_deposit_held !== undefined && Number(security_deposit_held) < 0) {
    return res.status(400).json({
      success: false,
      error: 'Security deposit held cannot be negative.'
    });
  }
  if (days_overdue !== undefined && Number(days_overdue) < 0) {
    return res.status(400).json({
      success: false,
      error: 'Days overdue cannot be negative.'
    });
  }

  const { damages, triageFlag, flaggedForUrgentTriage } = req.body;

  // Double-guard: check if physical damage is assessed but no photos/description provided
  const hasPhysicalDamage = damages && damages.some(d => {
    const typeLower = (d.type || '').toLowerCase();
    return !typeLower.includes('late return penalty') && !typeLower.includes('none');
  });

  if (hasPhysicalDamage) {
    const photoUrl = req.body.photoEvidenceUrl || req.body.photoEvidenceUrls || '';
    if (!photoUrl.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: A damage report requires at least one valid photo evidence image.'
      });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch the existing active rental record by ID with device joins
    const rentalRes = await client.query(
      `SELECT r.*, d.category AS device_category, d.base_cost AS device_base_cost 
       FROM rentals r 
       INNER JOIN devices d ON r.device_id = d.id 
       WHERE r.id = $1`, 
      [rentalId]
    );
    if (rentalRes.rows.length === 0) {
      throw new AppError(404, `Rental transaction record not found for ID: ${rentalId}`);
    }

    const rental = rentalRes.rows[0];
    if (rental.status === 'Settled') {
      throw new AppError(400, `Rental transaction is already settled and closed.`);
    }

    // 2. Feed security deposit and damage assessments payload to calculation engine
    const depositAmount = parseFloat(rental.security_deposit);
    const physicalDamages = (damages || []).filter(d => {
      const typeLower = (d.type || '').toLowerCase();
      return !typeLower.includes('late return penalty') && !typeLower.includes('late fee');
    }).map(d => {
      const computedCost = getDynamicDamageCost(d.type, rental.device_category, rental.security_deposit);
      return {
        ...d,
        cost: computedCost > 0 ? computedCost : (parseFloat(d.cost) || 0)
      };
    });
    const settlement = calculateSettlement(depositAmount, physicalDamages);

    // 2b. ─── LATE FEE: Server-side re-calculation ──────────────────────────
    const lateFee = calculateLateFee(days_overdue);

    //     Merge the server-verified late fee into the total deductions
    const totalDeductionsWithLateFee = settlement.totalDeductions + lateFee.lateFeeCharged;
    const finalRefundAfterLateFee = Math.max(0, depositAmount - totalDeductionsWithLateFee);
    const balanceDueAfterLateFee = totalDeductionsWithLateFee > depositAmount
      ? totalDeductionsWithLateFee - depositAmount : 0;

    // 3. Compile damage descriptions
    const descText = (req.body.description || req.body.notes || '').trim();
    const damageDescription = (damages && damages.length > 0)
      ? damages.map(d => {
          const typeLower = (d.type || '').toLowerCase();
          const isCustomDesc = !['cracked screen', 'body dents', 'water damage / fluid intrusion', 'none'].includes(typeLower) && !typeLower.includes('late return penalty');
          if (descText && !isCustomDesc && !typeLower.includes('late return penalty')) {
            return `${d.type} (${descText}) (Severity: ${d.multiplier || 1.0}x)`;
          }
          return `${d.type} (Severity: ${d.multiplier || 1.0}x)`;
        }).join(', ')
      : 'Standard Check-in Inspection - Wear & Tear';

    const maxMultiplier = (damages && damages.length > 0)
      ? Math.max(...damages.map(d => parseFloat(d.multiplier || 1.0)))
      : 1.00;

    // 4. ─── EMERGENCY TRIAGE CHECK & ROUTING LOGIC ──────────────────────
    const hasWaterDamage = damages && damages.some(d => 
      typeof d.type === 'string' && 
      (d.type.toLowerCase().includes('water') || d.type === 'Water Damage')
    );
    const isIsolatedRepair = triageFlag === true || flaggedForUrgentTriage === true || hasWaterDamage;
    const hasDamages = totalDeductionsWithLateFee > 0;

    let nextRentalStatus;
    let nextDeviceStatus;

    if (isIsolatedRepair) {
      // Execute immediate update query changing device status directly to 'ISOLATED_REPAIR'
      await client.query("UPDATE devices SET status = 'ISOLATED_REPAIR' WHERE id = $1", [rental.device_id]);
      nextRentalStatus = 'Priority_Repair';
      nextDeviceStatus = 'ISOLATED_REPAIR';
    } else {
      // Standard path
      nextRentalStatus = hasDamages ? 'Pending_Claim' : 'Settled';
      nextDeviceStatus = hasDamages ? 'Maintenance' : 'Available';
    }

    // 5. Update the rental contract status and customer_email
    const customerEmailToUpdate = customer_email || rental.customer_email;
    await client.query(
      "UPDATE rentals SET status = $1, customer_email = $2 WHERE id = $3",
      [nextRentalStatus, customerEmailToUpdate, rentalId]
    );

    // 6. Update the device operational status
    await client.query(
      "UPDATE devices SET status = $1 WHERE id = $2",
      [nextDeviceStatus, rental.device_id]
    );

    // Query User / Customer details for notifier
    const userRes = await client.query('SELECT * FROM users WHERE id = $1', [rental.user_id]);
    const userObj = userRes.rows[0] || {};

    // Generate AI explanation and customer-friendly settlement notes
    const physicalDamageDeduction = Math.max(0, totalDeductionsWithLateFee - lateFee.lateFeeCharged);
    const damageTypeParam = hasDamages ? damageDescription : 'None';
    const { explanation: aiExplanation, customerNotes: aiCustomerFriendlyNotes, aiPrompt } = generateAiNotes(
      damageTypeParam,
      physicalDamageDeduction,
      lateFee.daysOverdue,
      lateFee.lateFeeCharged,
      depositAmount
    );

    // 7. Insert the claims ledger record
    const triageAuditNote = isIsolatedRepair
      ? `[EMERGENCY TRIAGE] Water/fluid damage detected. Device immediately routed to ISOLATED_REPAIR queue at ${new Date().toISOString()}. Battery isolation required before handling.`
      : null;

    const claimId = `claim-${crypto.randomUUID()}`;

    const claimRes = await client.query(
      `INSERT INTO claims (
        id, rental_id, damage_description, severity_multiplier,
        deduction_amount, final_refund,
        days_overdue, late_fee_charged,
        settlement_notes, photo_evidence_urls,
        ai_explanation, customer_friendly_notes, ai_prompt
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        claimId,
        rentalId,
        damageDescription,
        maxMultiplier,
        totalDeductionsWithLateFee,
        finalRefundAfterLateFee,
        lateFee.daysOverdue,
        lateFee.lateFeeCharged,
        triageAuditNote,
        req.body.photoEvidenceUrl || req.body.photoEvidenceUrls || '',
        aiExplanation,
        aiCustomerFriendlyNotes,
        aiPrompt
      ]
    );

    await client.query('COMMIT');

    // Trigger mock messaging/notifications confirmations and reminders
    const userEmail = customerEmailToUpdate || userObj.email || 'customer@onepointsolutions.com';
    const userPhone = userObj.phone || '+1-555-0199';

    if (hasDamages) {
      await sendEmail({
        to: userEmail,
        subject: `🛡️ One Point Solutions Return Alert - Damage Assessed [Ref: ${rentalId}]`,
        body: `Dear ${userObj.name || 'Customer'},\n\nWe have received your returned electronic equipment (Ref: ${rentalId}). During check-in, physical damage was assessed.\n\nAI Assessed Claim Notes:\n${aiCustomerFriendlyNotes}\n\nOur administrator will finalize the settlement invoice shortly. Thank you.`,
        rentalId
      });

      await sendWhatsApp({
        to: userPhone,
        message: `One Point Solutions Alert: Return received with damage. Assessed Repair Deduction: ₹${physicalDamageDeduction.toLocaleString()}. Notes: ${aiCustomerFriendlyNotes}`,
        rentalId
      });
    } else {
      await sendEmail({
        to: userEmail,
        subject: `🛡️ One Point Solutions Return Cleared [Ref: ${rentalId}]`,
        body: `Dear ${userObj.name || 'Customer'},\n\nYour returned device has been checked in on time in perfect condition. Your security deposit of ₹${depositAmount.toLocaleString()} has been cleared for full refund.\n\nThank you for choosing One Point Solutions!`,
        rentalId
      });

      await sendWhatsApp({
        to: userPhone,
        message: `One Point Solutions: Device returned in perfect condition on time. Full refund of ₹${depositAmount.toLocaleString()} approved.`,
        rentalId
      });
    }

    res.status(200).json({
      success: true,
      message: isIsolatedRepair
        ? '🚨 URGENT TRIAGE: Device immediately isolated. Routed to Priority Repair Queue — battery isolation required.'
        : (hasDamages
          ? 'Damage claim successfully processed and awaiting settlement review.'
          : 'Return successfully processed and transaction settled.'),
      triage: {
        flagged: isIsolatedRepair,
        deviceStatus: nextDeviceStatus,
        rentalStatus: nextRentalStatus,
        auditNote: triageAuditNote
      },
      lateFee: {
        daysOverdue: lateFee.daysOverdue,
        lateFeeCharged: lateFee.lateFeeCharged,
        perDayRate: 1250
      },
      data: {
        rentalId,
        claim: claimRes.rows[0],
        breakdown: {
          ...settlement,
          totalDeductionsWithLateFee,
          finalRefundAfterLateFee,
          balanceDueAfterLateFee
        }
      }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * Finalizes the payment settlement and closes out the claim queue
 */
export const settleClaim = async (req, res, next) => {
  const { rentalId, notes, paymentMethod } = req.body;

  if (!rentalId) {
    return next(new AppError(400, 'Missing rentalId in settlement request.'));
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch the existing active rental record by ID
    const rentalRes = await client.query('SELECT * FROM rentals WHERE id = $1', [rentalId]);
    if (rentalRes.rows.length === 0) {
      throw new AppError(404, `Rental transaction record not found for ID: ${rentalId}`);
    }

    const rental = rentalRes.rows[0];
    if (rental.status === 'Settled') {
      throw new AppError(400, `Rental transaction is already settled and closed.`);
    }

    // 2. Update the rental contract status to 'Settled'
    await client.query(
      "UPDATE rentals SET status = 'Settled' WHERE id = $1",
      [rentalId]
    );

    // 3. Update the device operational status back to 'Available'
    await client.query(
      "UPDATE devices SET status = 'Available' WHERE id = $1",
      [rental.device_id]
    );

    // 4. Update the claim ledger record with payment_method and settlement_notes
    //    IMPORTANT: Use COALESCE + concatenation to APPEND operator remarks
    //    instead of overwriting — this preserves the [EMERGENCY TRIAGE] audit
    //    trail that processClaim may have already written to settlement_notes.
    await client.query(
      `UPDATE claims 
       SET payment_method = $1, 
           settlement_notes = CASE 
             WHEN settlement_notes IS NOT NULL AND settlement_notes != '' 
             THEN settlement_notes || ' | ' || $2
             ELSE $2
           END,
           settled_on = $3 
       WHERE rental_id = $4`,
      [paymentMethod || 'Default', notes || '', new Date().toISOString(), rentalId]
    );

    await client.query('COMMIT');

    // 5. Query and return the updated rental record in the UI-compliant structure
    const updatedRes = await client.query(`
      SELECT 
        r.id AS "rentalId",
        CASE r.status 
          WHEN 'Active' THEN 'Held' 
          WHEN 'Pending_Claim' THEN 'Under Review'
          WHEN 'Priority_Repair' THEN 'Isolated Repair'
          ELSE r.status 
        END AS "settlementStatus",
        r.start_date AS "startDate",
        r.end_date AS "endDate",
        r.security_deposit AS "securityDepositHeld",
        r.base_tariff AS "baseTariff",
        COALESCE(c.settlement_notes, r.initial_condition_notes) AS "notes",
        u.name AS "customerName",
        u.email AS "customerEmail",
        u.phone AS "customerPhone",
        u.id AS "customerId",
        u.kyc_status AS "kycStatus",
        d.serial_number AS "deviceSerial",
        d.category AS "deviceCategory",
        d.category AS "deviceModel",
        d.base_cost AS "deviceBaseCost",
        COALESCE(c.damage_description, 'None') AS "damageType",
        COALESCE(c.photo_evidence_urls, '') AS "photoEvidenceUrl",
        COALESCE(c.deduction_amount, 0) AS "damageDeduction",
        COALESCE(c.days_overdue, 0) AS "daysOverdue",
        COALESCE(c.late_fee_charged, 0) AS "lateFeeCharged",
        c.payment_method AS "paymentMethod",
        COALESCE(c.ai_explanation, '') AS "aiExplanation",
        COALESCE(c.customer_friendly_notes, '') AS "customerFriendlyNotes",
        c.settled_on AS "settlementAt"
      FROM rentals r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN devices d ON r.device_id = d.id
      LEFT JOIN claims c ON r.id = c.rental_id
      WHERE r.id = $1
    `, [rentalId]);

    if (updatedRes.rows.length === 0) {
      throw new AppError(404, `Updated rental record not found.`);
    }

    res.status(200).json(updatedRes.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * GET /api/settlements/:rentalId
 * Returns a pre-calculated cascading financial receipt object with
 * clean, separate key-value pairs for each line item.
 */
export const getSettlementBreakdown = async (req, res, next) => {
  const rentalId = req.params.id || req.params.rentalId;

  try {
    const result = await pool.query(`
      SELECT 
        r.id AS "rentalId",
        CASE r.status 
          WHEN 'Active' THEN 'Held' 
          WHEN 'Pending_Claim' THEN 'Under Review'
          WHEN 'Priority_Repair' THEN 'Isolated Repair'
          ELSE r.status 
        END AS "settlementStatus",
        r.security_deposit AS "securityDepositHeld",
        u.name AS "customerName",
        u.email AS "customerEmail",
        u.phone AS "customerPhone",
        u.id AS "customerId",
        u.kyc_status AS "kycStatus",
        d.category AS "deviceModel",
        d.base_cost AS "deviceBaseCost",
        d.serial_number AS "deviceSerial",
        COALESCE(c.damage_description, 'None') AS "damageType",
        COALESCE(c.photo_evidence_urls, '') AS "photoEvidenceUrl",
        COALESCE(c.deduction_amount, 0) AS "totalDeduction",
        COALESCE(c.days_overdue, 0) AS "daysOverdue",
        COALESCE(c.late_fee_charged, 0) AS "lateFeeCharged",
        c.payment_method AS "paymentMethod",
        c.settlement_notes AS "notes",
        COALESCE(c.ai_explanation, '') AS "aiExplanation",
        COALESCE(c.customer_friendly_notes, '') AS "customerFriendlyNotes",
        COALESCE(c.ai_prompt, '') AS "aiPrompt",
        c.settled_on AS "settlementAt"
      FROM rentals r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN devices d ON r.device_id = d.id
      LEFT JOIN claims c ON r.id = c.rental_id
      WHERE r.id = $1
    `, [rentalId]);

    if (result.rows.length === 0) {
      throw new AppError(404, `Settlement record not found for ID: ${rentalId}`);
    }

    const row = result.rows[0];
    const base_deposit = parseFloat(row.securityDepositHeld) || 0;
    const days_overdue = parseInt(row.daysOverdue) || 0;

    // Run the late fee multiplication logic safely on the server using static standard constant
    const late_fees = days_overdue * 1250;

    // Calculate actual damage deduction from the total deduction stored in database and late fee charged
    const totalDeductionVal = parseFloat(row.totalDeduction) || 0;
    const dbLateFeeVal = parseFloat(row.lateFeeCharged) || 0;
    const damage_deduction = Math.max(0, totalDeductionVal - dbLateFeeVal);

    const final_net_refund = base_deposit - damage_deduction - late_fees;

    res.status(200).json({
      rentalId: row.rentalId,
      settlementStatus: row.settlementStatus,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerId: row.customerId,
      kycStatus: row.kycStatus,
      deviceModel: row.deviceModel,
      deviceBaseCost: parseFloat(row.deviceBaseCost) || 0,
      deviceSerial: row.deviceSerial,
      damageType: row.damageType,
      photoEvidenceUrl: row.photoEvidenceUrl,
      paymentMethod: row.paymentMethod,
      notes: row.notes,
      settlementAt: row.settlementAt,
      aiExplanation: row.aiExplanation,
      customerFriendlyNotes: row.customerFriendlyNotes,
      aiPrompt: row.aiPrompt,
      // Four explicit top-level keys
      base_deposit,
      damage_deduction,
      late_fees,
      final_net_refund,
      // Cascading Financial Receipt Fields (backward compatibility)
      receipt: {
        base_deposit,
        damage_deduction,
        late_fees,
        total_deductions: damage_deduction + late_fees,
        final_net_refund,
        is_deficit: final_net_refund < 0,
        deficit_amount: final_net_refund < 0 ? Math.abs(final_net_refund) : 0,
        days_overdue: days_overdue
      }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/settlements/:rentalId
 * Closes out the settlement by flipping the database status
 * from 'Under Review' / 'Isolated Repair' → 'Settled' and
 * timestamping the exact second the funds were approved.
 */
export const patchSettlement = async (req, res, next) => {
  const rentalId = req.params.id || req.params.rentalId;
  const { notes, paymentMethod, status, trackingStatus, tracking_status, deductionAmount, adjustedFinalDeduction } = req.body;

  const targetStatus = (status || trackingStatus || tracking_status || 'SETTLED').toUpperCase();
  if (targetStatus !== 'CLOSED' && targetStatus !== 'SETTLED') {
    return res.status(400).json({
      success: false,
      error: "Tracking status payload must be 'CLOSED' or 'SETTLED'."
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch and validate
    const rentalRes = await client.query('SELECT * FROM rentals WHERE id = $1', [rentalId]);
    if (rentalRes.rows.length === 0) {
      throw new AppError(404, `Rental not found for ID: ${rentalId}`);
    }
    const rental = rentalRes.rows[0];
    if (rental.status === 'Settled') {
      throw new AppError(400, `Rental is already settled and closed.`);
    }

    const settledAt = new Date().toISOString();

    // 2. Flip rental status → Settled
    await client.query(
      "UPDATE rentals SET status = 'Settled' WHERE id = $1",
      [rentalId]
    );

    // 3. Release device back to Available
    await client.query(
      "UPDATE devices SET status = 'Available' WHERE id = $1",
      [rental.device_id]
    );

    // 4. Update claim with payment method, flip settlement_status to 'SETTLED', record server-side timestamp settled_at, and optionally update deduction amount
    const finalDeductionVal = deductionAmount !== undefined ? deductionAmount : adjustedFinalDeduction;
    if (finalDeductionVal !== undefined) {
      const depHeld = parseFloat(rental.security_deposit) || 0;
      const finalRefundVal = Math.max(0, depHeld - parseFloat(finalDeductionVal));
      await client.query(
        `UPDATE claims 
         SET payment_method = $1, 
             settlement_status = 'SETTLED',
             settlement_notes = CASE 
               WHEN settlement_notes IS NOT NULL AND settlement_notes != '' 
               THEN settlement_notes || ' | ' || $2
               ELSE $2
             END,
             settled_on = $3,
             settled_at = $3,
             deduction_amount = $4,
             final_refund = $5
         WHERE rental_id = $6`,
        [paymentMethod || 'Default', notes || '', settledAt, finalDeductionVal, finalRefundVal, rentalId]
      );
    } else {
      await client.query(
        `UPDATE claims 
         SET payment_method = $1, 
             settlement_status = 'SETTLED',
             settlement_notes = CASE 
               WHEN settlement_notes IS NOT NULL AND settlement_notes != '' 
               THEN settlement_notes || ' | ' || $2
               ELSE $2
             END,
             settled_on = $3,
             settled_at = $3
         WHERE rental_id = $4`,
        [paymentMethod || 'Default', notes || '', settledAt, rentalId]
      );
    }

    await client.query('COMMIT');

    // 5. Return the updated record in the UI-compliant structure
    const updatedRes = await client.query(`
      SELECT 
        r.id AS "rentalId",
        CASE r.status 
          WHEN 'Active' THEN 'Held' 
          WHEN 'Pending_Claim' THEN 'Under Review'
          WHEN 'Priority_Repair' THEN 'Isolated Repair'
          ELSE r.status 
        END AS "settlementStatus",
        r.start_date AS "startDate",
        r.end_date AS "endDate",
        r.security_deposit AS "securityDepositHeld",
        r.base_tariff AS "baseTariff",
        COALESCE(c.settlement_notes, r.initial_condition_notes) AS "notes",
        u.name AS "customerName",
        u.email AS "customerEmail",
        u.phone AS "customerPhone",
        u.id AS "customerId",
        u.kyc_status AS "kycStatus",
        d.serial_number AS "deviceSerial",
        d.category AS "deviceCategory",
        d.category AS "deviceModel",
        d.base_cost AS "deviceBaseCost",
        COALESCE(c.damage_description, 'None') AS "damageType",
        COALESCE(c.photo_evidence_urls, '') AS "photoEvidenceUrl",
        COALESCE(c.deduction_amount, 0) AS "damageDeduction",
        COALESCE(c.days_overdue, 0) AS "daysOverdue",
        COALESCE(c.late_fee_charged, 0) AS "lateFeeCharged",
        c.payment_method AS "paymentMethod",
        COALESCE(c.ai_explanation, '') AS "aiExplanation",
        COALESCE(c.customer_friendly_notes, '') AS "customerFriendlyNotes",
        c.settled_on AS "settlementAt"
      FROM rentals r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN devices d ON r.device_id = d.id
      LEFT JOIN claims c ON r.id = c.rental_id
      WHERE r.id = $1
    `, [rentalId]);

    if (updatedRes.rows.length === 0) {
      throw new AppError(404, `Updated record not found.`);
    }

    const record = updatedRes.rows[0];

    // Trigger simulated invoice / receipt email and WhatsApp alerts upon approval
    const userEmail = record.customerEmail || 'customer@onepointsolutions.com';
    const userPhone = record.customerPhone || '+1-555-0199';
    const userName = record.customerName || 'Customer';
    
    const netValue = parseFloat(record.securityDepositHeld) - parseFloat(record.damageDeduction);
    const isDeficit = netValue < 0;
    const absRefund = Math.abs(netValue);

    const invoiceSubject = isDeficit 
      ? `🛡️ One Point Solutions Settlement Invoice - Liability Due [Ref: ${rentalId}]` 
      : `🛡️ One Point Solutions Refund Receipt - Disbursed [Ref: ${rentalId}]`;

    const invoiceBody = isDeficit
      ? `Dear ${userName},\n\nYour equipment rental has been reconciled. Total charges exceeded your security deposit. \n\nOutstanding Deficit Due: ₹${absRefund.toLocaleString()}\nReconciliation Remarks: ${notes || 'Reconciliation Complete'}\nPayment Mode: ${paymentMethod}\n\nPlease settle this invoice within 7 business days. Thank you.`
      : `Dear ${userName},\n\nYour equipment rental has been reconciled. Remaining refund has been disbursed.\n\nNet Payout Disbursed: ₹${netValue.toLocaleString()}\nReconciliation Remarks: ${notes || 'Reconciliation Complete'}\nPayment Mode: ${paymentMethod}\n\nThe funds should reflect in your account shortly. Thank you for choosing One Point Solutions!`;

    await sendEmail({
      to: userEmail,
      subject: invoiceSubject,
      body: invoiceBody,
      rentalId
    });

    await sendWhatsApp({
      to: userPhone,
      message: isDeficit
        ? `One Point Solutions Invoice: Outstanding liability of ₹${absRefund.toLocaleString()} is due under reconciliation mode ${paymentMethod}.`
        : `One Point Solutions Receipt: Payout refund of ₹${netValue.toLocaleString()} has been cleared via ${paymentMethod}.`,
      rentalId
    });

    res.status(200).json({
      ...record,
      sentEmail: true,
      sentWhatsApp: true
    });

  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * PATCH /api/claims/:rentalId/photo
 * Updates the photo evidence URL for a damage claim.
 */
export const updateClaimPhoto = async (req, res, next) => {
  const rentalId = req.params.rentalId || req.params.id;
  const { photoEvidenceUrl } = req.body;

  if (!photoEvidenceUrl || typeof photoEvidenceUrl !== 'string' || !photoEvidenceUrl.trim()) {
    return res.status(400).json({
      success: false,
      error: 'photoEvidenceUrl is required and must be a non-empty string.'
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the claim exists
    const claimCheck = await client.query(
      'SELECT * FROM claims WHERE rental_id = $1',
      [rentalId]
    );

    if (claimCheck.rows.length === 0) {
      throw new AppError(404, `Claim not found for rental ID: ${rentalId}`);
    }

    // Update the photo
    await client.query(
      'UPDATE claims SET photo_evidence_urls = $1 WHERE rental_id = $2',
      [photoEvidenceUrl, rentalId]
    );

    await client.query('COMMIT');

    // Fetch the updated rental/claim record in the UI-compliant structure
    const updatedRes = await client.query(`
      SELECT 
        r.id AS "rentalId",
        CASE r.status 
          WHEN 'Active' THEN 'Held' 
          WHEN 'Pending_Claim' THEN 'Under Review'
          WHEN 'Priority_Repair' THEN 'Isolated Repair'
          ELSE r.status 
        END AS "settlementStatus",
        r.start_date AS "startDate",
        r.end_date AS "endDate",
        r.security_deposit AS "securityDepositHeld",
        r.base_tariff AS "baseTariff",
        COALESCE(c.settlement_notes, r.initial_condition_notes) AS "notes",
        u.name AS "customerName",
        u.email AS "customerEmail",
        u.phone AS "customerPhone",
        u.id AS "customerId",
        u.kyc_status AS "kycStatus",
        d.serial_number AS "deviceSerial",
        d.category AS "deviceCategory",
        d.category AS "deviceModel",
        d.base_cost AS "deviceBaseCost",
        COALESCE(c.damage_description, 'None') AS "damageType",
        COALESCE(c.photo_evidence_urls, '') AS "photoEvidenceUrl",
        COALESCE(c.deduction_amount, 0) AS "damageDeduction",
        COALESCE(c.days_overdue, 0) AS "daysOverdue",
        COALESCE(c.late_fee_charged, 0) AS "lateFeeCharged",
        c.payment_method AS "paymentMethod",
        COALESCE(c.ai_explanation, '') AS "aiExplanation",
        COALESCE(c.customer_friendly_notes, '') AS "customerFriendlyNotes",
        c.settled_on AS "settlementAt"
      FROM rentals r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN devices d ON r.device_id = d.id
      LEFT JOIN claims c ON r.id = c.rental_id
      WHERE r.id = $1
    `, [rentalId]);

    if (updatedRes.rows.length === 0) {
      throw new AppError(404, `Updated rental record not found.`);
    }

    res.status(200).json({
      success: true,
      message: 'Damage photo evidence updated successfully.',
      data: updatedRes.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

