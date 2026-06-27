// Rentals Controller
// File: controllers/rentalsController.js

import bcrypt from 'bcrypt';
import pool, { query } from '../config/db.js';
import { AppError } from '../middlewares/errorHandler.js';
import { sendEmail, sendWhatsApp } from '../utils/notifier.js';

/**
 * Helper to execute queries inside a client transaction block
 */
const executeTransaction = async (queriesList) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results = [];
    for (let q of queriesList) {
      const res = await client.query(q.text, q.values);
      results.push(res);
    }
    await client.query('COMMIT');
    return results;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Create a new rental transaction
 */
export const createRental = async (req, res, next) => {
  const {
    userName, userEmail, userPhone, isCorporate, kycStatus, address,
    deviceSerial, deviceCategory, deviceBaseCost,
    startDate, endDate, securityDeposit, baseTariff, initialConditionNotes
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Resolve or Create User
    let userRes = await client.query('SELECT id, kyc_status FROM users WHERE email = $1', [userEmail.trim()]);
    let userId;
    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      if (user.kyc_status === 'Pending' || user.kyc_status === 'Rejected') {
        throw new AppError(403, `Verification Blocked: Assignment to unverified customer accounts is restricted by safety compliance guidelines (KYC Status: ${user.kyc_status}).`);
      }
      userId = user.id;
      await client.query(
        `UPDATE users SET name = $1, phone = $2, is_corporate = $3, kyc_status = $4, address = $5 WHERE id = $6`,
        [userName.trim(), userPhone.trim(), isCorporate ? 1 : 0, kycStatus, address.trim(), userId]
      );
    } else {
      const userKyc = kycStatus || 'Verified';
      if (userKyc === 'Pending' || userKyc === 'Rejected') {
        throw new AppError(403, `Verification Blocked: Assignment to unverified customer accounts is restricted by safety compliance guidelines (KYC Status: ${userKyc}).`);
      }

      // Generate a unique Customer ID (e.g. CUST-8F3K9A)
      let nextUserId;
      let userExists = true;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      while (userExists) {
        let randStr = '';
        for (let i = 0; i < 6; i++) {
          randStr += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        nextUserId = `CUST-${randStr}`;
        const checkRes = await client.query('SELECT id FROM users WHERE id = $1', [nextUserId]);
        if (checkRes.rows.length === 0) {
          userExists = false;
        }
      }
      userId = nextUserId;

      await client.query(
        `INSERT INTO users (id, name, email, phone, is_corporate, kyc_status, address) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, userName.trim(), userEmail.trim(), userPhone.trim(), isCorporate ? 1 : 0, userKyc, address.trim()]
      );
    }

    // 2. Resolve or Create Device
    let deviceRes = await client.query('SELECT id, status FROM devices WHERE serial_number = $1', [deviceSerial.trim()]);
    let deviceId;
    if (deviceRes.rows.length > 0) {
      const device = deviceRes.rows[0];
      if (device.status !== 'Available') {
        throw new AppError(400, `Device serial ${deviceSerial} is currently not available (Status: ${device.status}).`);
      }
      deviceId = device.id;
    } else {
      // Calculate next sequential device ID (e.g. d4, d5...)
      const allDevices = await client.query('SELECT id FROM devices');
      let maxDeviceNum = 3; // base default from d3
      for (const d of allDevices.rows) {
        const match = d.id && d.id.match(/^d(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxDeviceNum) {
            maxDeviceNum = num;
          }
        }
      }
      const nextDeviceId = `d${maxDeviceNum + 1}`;

      const insertDeviceRes = await client.query(
        "INSERT INTO devices (id, serial_number, category, base_cost, status) VALUES ($1, $2, $3, $4, 'Available') RETURNING *",
        [nextDeviceId, deviceSerial.trim(), deviceCategory.trim(), deviceBaseCost]
      );
      deviceId = insertDeviceRes.rows[0].id;
    }

    // 3. Update Device status to 'Rented'
    await client.query("UPDATE devices SET status = 'Rented' WHERE id = $1", [deviceId]);

    // Generate a unique Rental ID (e.g. RENT-8F3K9A)
    let nextRentalId;
    let rentalExists = true;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    while (rentalExists) {
      let randStr = '';
      for (let i = 0; i < 6; i++) {
        randStr += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      nextRentalId = `RENT-${randStr}`;
      const checkRes = await client.query('SELECT id FROM rentals WHERE id = $1', [nextRentalId]);
      if (checkRes.rows.length === 0) {
        rentalExists = false;
      }
    }

    // 4. Create Rental contract (default status: 'Active')
    const rentalRes = await client.query(
      `INSERT INTO rentals (
        id, user_id, device_id, start_date, end_date, 
        security_deposit, base_tariff, initial_condition_notes, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Active', $9) RETURNING *`,
      [nextRentalId, userId, deviceId, new Date(startDate).toISOString(), new Date(endDate).toISOString(), securityDeposit, baseTariff, initialConditionNotes || '', new Date().toISOString()]
    );

    await client.query('COMMIT');

    // Trigger mock notification logs for intake booking confirmation
    try {
      await sendEmail({
        to: userEmail.trim(),
        subject: `Rental Booking Confirmed: ${nextRentalId}`,
        body: `Dear ${userName.trim()},\n\nYour electronic equipment rental (Booking ID: ${nextRentalId}) is confirmed.\n\nEscrow deposit held: ₹${securityDeposit}.\nStart date: ${startDate}\nExpected return date: ${endDate}\n\nThank you for choosing One Point Solutions.\n\nSincerely,\nOperations Team`,
        rentalId: nextRentalId
      });
      await sendWhatsApp({
        to: userPhone.trim(),
        message: `One Point Solutions Booking Confirmed: Your rental (Ref: ${nextRentalId}) is active. Escrow deposit of ₹${securityDeposit} has been secured.`,
        rentalId: nextRentalId
      });
    } catch (e) {
      console.warn("Failed to dispatch confirmation alert:", e.message);
    }

    res.status(201).json({
      success: true,
      message: 'Rental transaction initiated successfully.',
      data: rentalRes.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * List rentals with dynamic criteria filters
 */
export const listRentals = async (req, res, next) => {
  try {
    const { status, category, serialNumber } = req.query;

    let queryText = `
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
        u.address AS "address",
        u.is_corporate AS "isCorporate",
        d.serial_number AS "deviceSerial",
        d.category AS "deviceCategory",
        d.category AS "deviceModel",
        COALESCE(c.damage_description, 'None') AS "damageType",
        COALESCE(c.photo_evidence_urls, '') AS "photoEvidenceUrl",
        COALESCE(c.deduction_amount, 0) AS "damageDeduction",
        COALESCE(c.days_overdue, 0) AS "daysOverdue",
        COALESCE(c.late_fee_charged, 0) AS "lateFeeCharged",
        c.payment_method AS "paymentMethod",
        COALESCE(c.ai_explanation, '') AS "aiExplanation",
        COALESCE(c.customer_friendly_notes, '') AS "customerFriendlyNotes",
        COALESCE(c.ai_prompt, '') AS "aiPrompt",
        c.settled_on AS "settlementAt"
      FROM rentals r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN devices d ON r.device_id = d.id
      LEFT JOIN claims c ON r.id = c.rental_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      // Map UI filters to database statuses
      let dbStatus = status;
      if (status === 'Held') dbStatus = 'Active';
      else if (status === 'Under Review') dbStatus = 'Pending_Claim';
      
      queryText += ` AND r.status = $${paramIndex}`;
      params.push(dbStatus);
      paramIndex++;
    }

    if (category) {
      queryText += ` AND d.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (serialNumber) {
      queryText += ` AND d.serial_number = $${paramIndex}`;
      params.push(serialNumber);
      paramIndex++;
    }

    queryText += ` ORDER BY r.created_at DESC`;

    const dbResult = await query(queryText, params);

    res.status(200).json({
      success: true,
      count: dbResult.rows.length,
      data: dbResult.rows.map(row => ({
        ...row,
        isCorporate: row.isCorporate === 1 || row.isCorporate === true || row.isCorporate === '1'
      }))
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Reset the database by deleting all records and re-seeding them
 */
export const resetDatabase = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete all records in order of foreign key dependency
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM claims');
    await client.query('DELETE FROM rentals');
    await client.query('DELETE FROM devices');
    await client.query('DELETE FROM users');
    
    await client.query('COMMIT');
    
    const now = new Date().toISOString();
    
    // Seed Users
    await query(`
      INSERT INTO users (id, name, email, phone, is_corporate, kyc_status, created_at) VALUES 
      ('CUST-F8A3D9', 'Jane Smith', 'jane.smith@example.com', '+1-555-0199', 0, 'Verified', $1),
      ('CUST-E2B8C4', 'Priya Patel', 'priya.patel@example.com', '+91-98765-43210', 0, 'Pending', $2),
      ('CUST-D7F5E1', 'Amit Verma', 'amit.verma@example.com', '+91-99999-88888', 1, 'Rejected', $3),
      ('CUST-R8S4D1', 'Rohan Sharma', 'rohan.sharma@example.com', '+91-98888-77777', 0, 'Verified', $4),
      ('CUST-S7R5E2', 'Sneha Reddy', 'sneha.reddy@example.com', '+91-97777-66666', 0, 'Verified', $5)
    `, [now, now, now, now, now]);

    // Seed Staff and Customer accounts with passwords
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);
    await query(`
      INSERT INTO users (id, name, email, phone, is_corporate, kyc_status, password, role, created_at) VALUES 
      ('STAFF-001', 'Admin Manager', 'admin@onepointsolutions.com', '+1-555-0100', 0, 'Verified', $1, 'Manager', $2),
      ('STAFF-002', 'Service Technician', 'technician@onepointsolutions.com', '+1-555-0101', 0, 'Verified', $3, 'Service Technician', $4),
      ('STAFF-003', 'Accounts Staff', 'accounts@onepointsolutions.com', '+1-555-0102', 0, 'Verified', $5, 'Accounts Staff', $6),
      ('CUST-001', 'Customer User', 'customer@example.com', '+1-555-0103', 0, 'Verified', $7, 'Customer', $8)
    `, [
      hashedPassword, now, 
      hashedPassword, now, 
      hashedPassword, now, 
      hashedPassword, now
    ]);

    // Seed Devices
    await query(`
      INSERT INTO devices (id, serial_number, category, base_cost, status) VALUES
      ('d1', 'SN-MBP3-999', 'MacBook Pro M3', 150000.00, 'Rented'),
      ('d2', 'SN-IPD4-888', 'iPad Pro M4', 80000.00, 'Rented'),
      ('d3', 'SN-IPH15-777', 'iPhone 15 Pro', 120000.00, 'Available'),
      ('d4', 'SN-CAM-555', 'Canon DSLR Camera', 25000.00, 'Rented'),
      ('d5', 'SN-LAP-333', 'Lenovo ThinkPad Laptop', 40000.00, 'Rented')
    `);

    // Seed Rentals
    await query(`
      INSERT INTO rentals (id, user_id, device_id, start_date, end_date, security_deposit, base_tariff, initial_condition_notes, status, created_at) VALUES
      ('RENT-G6H2Y9', 'CUST-F8A3D9', 'd1', '2026-06-01T12:00:00.000Z', '2026-06-15T12:00:00.000Z', 50000.00, 5000.00, 'Factory pristine condition.', 'Active', $1),
      ('RENT-M4K7N1', 'CUST-E2B8C4', 'd2', '2026-06-02T10:00:00.000Z', '2026-06-12T10:00:00.000Z', 15000.00, 2500.00, 'Minor scratch on back bezel.', 'Pending_Claim', $2),
      ('RENT-P8Q3S5', 'CUST-D7F5E1', 'd3', '2026-06-03T09:00:00.000Z', '2026-06-10T09:00:00.000Z', 25000.00, 3500.00, 'Brand new in box.', 'Settled', $3),
      ('RENT-C5A2M8', 'CUST-R8S4D1', 'd4', '2026-06-20T10:00:00.000Z', '2026-06-28T10:00:00.000Z', 10000.00, 1500.00, 'Camera body clean, lens cover intact.', 'Active', $4),
      ('RENT-L3T7P5', 'CUST-S7R5E2', 'd5', '2026-06-18T10:00:00.000Z', '2026-07-02T10:00:00.000Z', 15000.00, 2000.00, 'Minor sticker residue on top shell.', 'Active', $5)
    `, [now, now, now, now, now]);

    // Seed Claims
    await query(`
      INSERT INTO claims (id, rental_id, damage_description, severity_multiplier, deduction_amount, final_refund, payment_method, settlement_notes, settled_on) VALUES
      ('c1', 'RENT-M4K7N1', 'Cracked Screen (Severity: 1.0x)', 1.0, 12500.00, 2500.00, NULL, NULL, $1),
      ('c2', 'RENT-P8Q3S5', 'Body Dents (Severity: 1.0x)', 1.0, 4166.00, 20834.00, 'UPI Refund Transfer', 'Deduction applied for light chassis scratches.', $2)
    `, [now, now]);

    // Seed Notifications
    await query(`
      INSERT INTO notifications (id, rental_id, recipient, type, subject, message, created_at) VALUES
      ('n1', 'RENT-G6H2Y9', 'jane.smith@example.com', 'Email', '🛡️ One Point Solutions - Booking Confirmed', 'Dear Jane Smith, your MacBook Pro M3 rental booking has been confirmed. Security deposit held: ₹50,000.', $1),
      ('n2', 'RENT-M4K7N1', 'priya.patel@example.com', 'Email', '🛡️ One Point Solutions - Booking Confirmed', 'Dear Priya Patel, your iPad Pro M4 rental booking has been confirmed. Security deposit held: ₹15,000.', $2),
      ('n3', 'RENT-M4K7N1', '+91-98765-43210', 'WhatsApp', NULL, 'One Point Solutions Alert: Return received with damage. Assessed Repair Deduction: ₹12,500.', $3),
      ('n4', 'RENT-P8Q3S5', 'amit.verma@example.com', 'Email', '🛡️ One Point Solutions - Booking Confirmed', 'Dear Amit Verma, your iPhone 15 Pro rental booking has been confirmed. Security deposit held: ₹25,000.', $4),
      ('n5', 'RENT-P8Q3S5', 'amit.verma@example.com', 'Email', '🛡️ One Point Solutions Return Cleared', 'Dear Amit Verma, your return has been processed and settled. Refund dispatched.', $5),
      ('n6', 'RENT-C5A2M8', 'rohan.sharma@example.com', 'Email', '🛡️ One Point Solutions - Booking Confirmed', 'Dear Rohan Sharma, your Canon DSLR Camera rental booking has been confirmed. Security deposit held: ₹10,000.', $6),
      ('n7', 'RENT-L3T7P5', 'sneha.reddy@example.com', 'Email', '🛡️ One Point Solutions - Booking Confirmed', 'Dear Sneha Reddy, your Lenovo ThinkPad Laptop rental booking has been confirmed. Security deposit held: ₹15,000.', $7)
    `, [now, now, now, now, now, now, now]);

    res.status(200).json({ success: true, message: 'Database reset and seeded successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
};

/**
 * Returns a raw flat list of rentals (unwrapped array) for specific UI components
 */
export const listRentalsRaw = async (req, res, next) => {
  try {
    const { status, damageType, overdue } = req.query;

    let queryText = `
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
        u.address AS "address",
        u.is_corporate AS "isCorporate",
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
        COALESCE(c.ai_prompt, '') AS "aiPrompt",
        c.settled_on AS "settlementAt"
      FROM rentals r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN devices d ON r.device_id = d.id
      LEFT JOIN claims c ON r.id = c.rental_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      let dbStatus = status;
      if (status === 'Held') dbStatus = 'Active';
      else if (status === 'Under Review') dbStatus = 'Pending_Claim';
      else if (status === 'Isolated Repair') dbStatus = 'Priority_Repair';
      
      queryText += ` AND r.status = $${paramIndex}`;
      params.push(dbStatus);
      paramIndex++;
    }

    if (damageType) {
      if (damageType === 'Water') {
        queryText += ` AND c.damage_description LIKE $${paramIndex}`;
        params.push('%Water Damage%');
      } else {
        queryText += ` AND c.damage_description = $${paramIndex}`;
        params.push(damageType);
      }
      paramIndex++;
    }

    if (overdue === 'true') {
      queryText += ` AND c.days_overdue > 0`;
    }

    queryText += ` ORDER BY r.created_at DESC`;

    const dbResult = await query(queryText, params);
    res.status(200).json(dbResult.rows.map(row => ({
      ...row,
      isCorporate: row.isCorporate === 1 || row.isCorporate === true || row.isCorporate === '1'
    })));
  } catch (err) {
    next(err);
  }
};

/**
 * Checks the KYC verification status of a customer by email.
 * GET /api/users/check-kyc?email=...
 */
export const checkUserKyc = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email query parameter is required.' });
    }

    const result = await query("SELECT kyc_status FROM users WHERE email = $1", [email.trim()]);
    
    if (result.rows.length > 0) {
      return res.status(200).json({
        success: true,
        exists: true,
        kycStatus: result.rows[0].kyc_status
      });
    } else {
      return res.status(200).json({
        success: true,
        exists: false,
        kycStatus: 'Verified'
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Update an existing rental transaction's basic customer details, device model, and deposit
 * PUT /api/rentals/:id
 */
export const updateRental = async (req, res, next) => {
  const { id } = req.params;
  const { userName, userEmail, userPhone, deviceModel, securityDepositHeld, endDate, address, kycStatus, isCorporate } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Find the rental record
    const rentalRes = await client.query('SELECT user_id, device_id FROM rentals WHERE id = $1', [id]);
    if (rentalRes.rows.length === 0) {
      throw new AppError(404, `Rental record with ID ${id} not found.`);
    }

    const { user_id: userId, device_id: deviceId } = rentalRes.rows[0];

    // Get existing user details for fallbacks
    const userSelectRes = await client.query('SELECT address, kyc_status, is_corporate FROM users WHERE id = $1', [userId]);
    const existingUser = userSelectRes.rows[0] || {};

    const finalAddress = address !== undefined ? address.trim() : (existingUser.address || '');
    const finalKycStatus = kycStatus !== undefined ? kycStatus : (existingUser.kyc_status || 'Verified');
    const finalIsCorporate = isCorporate !== undefined ? (isCorporate ? 1 : 0) : (existingUser.is_corporate || 0);

    // 2. Update User Details
    await client.query(
      'UPDATE users SET name = $1, email = $2, phone = $3, address = $4, kyc_status = $5, is_corporate = $6 WHERE id = $7',
      [userName.trim(), userEmail.trim(), userPhone.trim(), finalAddress, finalKycStatus, finalIsCorporate, userId]
    );

    // 3. Update Device Model Category
    await client.query(
      'UPDATE devices SET category = $1 WHERE id = $2',
      [deviceModel.trim(), deviceId]
    );

    // 4. Update Rental Deposit, customer_email cache, and optionally end_date
    if (endDate !== undefined) {
      const finalEndDate = endDate ? new Date(endDate).toISOString() : null;
      await client.query(
        'UPDATE rentals SET security_deposit = $1, customer_email = $2, end_date = $3 WHERE id = $4',
        [securityDepositHeld, userEmail.trim(), finalEndDate, id]
      );
    } else {
      await client.query(
        'UPDATE rentals SET security_deposit = $1, customer_email = $2 WHERE id = $3',
        [securityDepositHeld, userEmail.trim(), id]
      );
    }

    await client.query('COMMIT');

    // Fetch the updated flat record structure
    const updatedRecordRes = await client.query(`
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
        u.address AS "address",
        u.is_corporate AS "isCorporate",
        d.serial_number AS "deviceSerial",
        d.category AS "deviceCategory",
        d.category AS "deviceModel",
        COALESCE(c.damage_description, 'None') AS "damageType",
        COALESCE(c.photo_evidence_urls, '') AS "photoEvidenceUrl",
        COALESCE(c.deduction_amount, 0) AS "damageDeduction",
        COALESCE(c.days_overdue, 0) AS "daysOverdue",
        COALESCE(c.late_fee_charged, 0) AS "lateFeeCharged",
        c.payment_method AS "paymentMethod",
        c.settled_on AS "settlementAt"
      FROM rentals r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN devices d ON r.device_id = d.id
      LEFT JOIN claims c ON r.id = c.rental_id
      WHERE r.id = $1
    `, [id]);

    const finalRow = updatedRecordRes.rows[0] ? {
      ...updatedRecordRes.rows[0],
      isCorporate: updatedRecordRes.rows[0].isCorporate === 1 || updatedRecordRes.rows[0].isCorporate === true || updatedRecordRes.rows[0].isCorporate === '1'
    } : null;

    res.status(200).json({
      success: true,
      message: 'Rental record updated successfully.',
      data: finalRow
    });

  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * Toggle between standard review (Pending_Claim) and emergency triage (Priority_Repair)
 * PATCH /api/rentals/:id/triage
 */
export const toggleTriage = async (req, res, next) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch current status
    const rentalRes = await client.query('SELECT status, device_id FROM rentals WHERE id = $1', [id]);
    if (rentalRes.rows.length === 0) {
      throw new AppError(404, `Rental record with ID ${id} not found.`);
    }

    const { status, device_id: deviceId } = rentalRes.rows[0];
    let nextRentalStatus;
    let nextDeviceStatus;
    let actionDescription;

    if (status === 'Priority_Repair') {
      nextRentalStatus = 'Pending_Claim';
      nextDeviceStatus = 'Maintenance';
      actionDescription = 'Resolved from Emergency Triage. Moved back to standard inspection review.';
    } else if (status === 'Pending_Claim') {
      nextRentalStatus = 'Priority_Repair';
      nextDeviceStatus = 'ISOLATED_REPAIR';
      actionDescription = 'Escalated to Emergency Triage (Priority Repair Queue).';
    } else {
      throw new AppError(400, `Rental contract in status '${status}' cannot toggle triage.`);
    }

    // 2. Update rental status
    await client.query('UPDATE rentals SET status = $1 WHERE id = $2', [nextRentalStatus, id]);

    // 3. Update device status
    await client.query('UPDATE devices SET status = $1 WHERE id = $2', [nextDeviceStatus, deviceId]);

    // 4. Update claim note if exists, or prepend/append triage audit note
    const claimRes = await client.query('SELECT id, settlement_notes FROM claims WHERE rental_id = $1', [id]);
    if (claimRes.rows.length > 0) {
      const existingNotes = claimRes.rows[0].settlement_notes || '';
      const separator = existingNotes ? ' | ' : '';
      const updatedNotes = `${existingNotes}${separator}[TRIAGE UPDATE] ${actionDescription} on ${new Date().toISOString()}`;
      await client.query('UPDATE claims SET settlement_notes = $1 WHERE rental_id = $2', [updatedNotes, id]);
    }

    await client.query('COMMIT');

    // Fetch updated rental structure
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
        c.settled_on AS "settlementAt"
      FROM rentals r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN devices d ON r.device_id = d.id
      LEFT JOIN claims c ON r.id = c.rental_id
      WHERE r.id = $1
    `, [id]);

    res.status(200).json({
      success: true,
      message: actionDescription,
      data: updatedRes.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * Fetch detailed rental transaction record along with linked history and output
 */
export const getRentalDetail = async (req, res, next) => {
  const { id } = req.params;
  try {
    const detailQuery = `
      SELECT 
        r.id AS "rentalId",
        r.status AS "rentalStatus",
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
        r.initial_condition_notes AS "initialConditionNotes",
        r.created_at AS "createdAt",
        
        u.id AS "customerId",
        u.name AS "customerName",
        u.email AS "customerEmail",
        u.phone AS "customerPhone",
        u.kyc_status AS "kycStatus",
        u.address AS "address",
        u.is_corporate AS "isCorporate",
        
        d.id AS "deviceId",
        d.serial_number AS "deviceSerial",
        d.category AS "deviceCategory",
        d.category AS "deviceModel",
        d.base_cost AS "deviceBaseCost",
        d.status AS "deviceStatus",
        
        c.id AS "claimId",
        COALESCE(c.damage_description, 'None') AS "damageType",
        COALESCE(c.severity_multiplier, 1.0) AS "severityMultiplier",
        COALESCE(c.deduction_amount, 0) AS "damageDeduction",
        COALESCE(c.final_refund, r.security_deposit) AS "finalRefund",
        COALESCE(c.days_overdue, 0) AS "daysOverdue",
        COALESCE(c.late_fee_charged, 0) AS "lateFeeCharged",
        c.payment_method AS "paymentMethod",
        c.settlement_notes AS "settlementNotes",
        COALESCE(c.photo_evidence_urls, '') AS "photoEvidenceUrl",
        c.settled_on AS "settledOn",
        c.settled_at AS "settledAt",
        COALESCE(c.ai_explanation, '') AS "aiExplanation",
        COALESCE(c.customer_friendly_notes, '') AS "customerFriendlyNotes",
        COALESCE(c.ai_prompt, '') AS "aiPrompt"
      FROM rentals r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN devices d ON r.device_id = d.id
      LEFT JOIN claims c ON r.id = c.rental_id
      WHERE r.id = $1
    `;
    
    const dbResult = await query(detailQuery, [id]);
    if (dbResult.rows.length === 0) {
      throw new AppError(404, `Rental record with ID ${id} not found.`);
    }
    
    const rentalDetail = dbResult.rows[0];
    
    // Convert isCorporate format
    rentalDetail.isCorporate = rentalDetail.isCorporate === 1 || rentalDetail.isCorporate === true || rentalDetail.isCorporate === '1';

    // Fetch action/notification history
    const historyRes = await query(`
      SELECT id, type, recipient, subject, message, status, created_at AS "createdAt"
      FROM notifications
      WHERE rental_id = $1
      ORDER BY created_at ASC
    `, [id]);
    
    res.status(200).json({
      success: true,
      data: {
        ...rentalDetail,
        history: historyRes.rows
      }
    });
  } catch (err) {
    next(err);
  }
};




