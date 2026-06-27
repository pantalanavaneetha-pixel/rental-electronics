import pool from '../config/db.js';
import { sendEmail, sendWhatsApp } from '../utils/notifier.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * GET /api/notifications
 * Lists all notification logs, optionally filtered by rentalId.
 */
export const listNotifications = async (req, res, next) => {
  const { rentalId } = req.query;
  
  try {
    let result;
    if (rentalId) {
      result = await pool.query(
        `SELECT n.*, r.customer_email AS "customerEmail" 
         FROM notifications n
         LEFT JOIN rentals r ON n.rental_id = r.id
         WHERE n.rental_id = $1
         ORDER BY n.created_at DESC`,
        [rentalId]
      );
    } else {
      result = await pool.query(
        `SELECT n.*, r.customer_email AS "customerEmail" 
         FROM notifications n
         LEFT JOIN rentals r ON n.rental_id = r.id
         ORDER BY n.created_at DESC`
      );
    }
    
    // Normalize properties for frontend usage
    const data = result.rows.map(row => ({
      id: row.id,
      rentalId: row.rental_id,
      recipient: row.recipient,
      type: row.type,
      subject: row.subject,
      message: row.message,
      status: row.status,
      createdAt: row.created_at
    }));
    
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/trigger
 * Manually triggers a simulated WhatsApp or Email alert based on templates.
 */
export const triggerManualNotification = async (req, res, next) => {
  const { rentalId, type, templateName, customMessage, customSubject } = req.body;
  
  if (!rentalId || !type || !templateName) {
    return next(new AppError(400, 'Missing rentalId, type, or templateName in payload.'));
  }
  
  try {
    // 1. Retrieve the rental details and customer info
    const rentalRes = await pool.query(`
      SELECT 
        r.id AS "rentalId",
        r.security_deposit AS "securityDeposit",
        u.name AS "customerName",
        u.email AS "customerEmail",
        u.phone AS "customerPhone",
        d.category AS "deviceModel"
      FROM rentals r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN devices d ON r.device_id = d.id
      WHERE r.id = $1
    `, [rentalId]);
    
    if (rentalRes.rows.length === 0) {
      throw new AppError(404, `Rental record not found for ID: ${rentalId}`);
    }
    
    const rental = rentalRes.rows[0];
    const customerName = rental.customerName;
    const deviceModel = rental.deviceModel;
    const depositAmount = rental.securityDeposit;
    
    let subject = '';
    let message = '';
    
    // 2. Select message content depending on template name
    switch (templateName) {
      case 'Return Reminder':
        subject = `⏰ One Point Solutions Return Checklist Reminder [Ref: ${rentalId}]`;
        message = `Dear ${customerName},\n\nThis is a friendly reminder that your rental laptop/tablet (${deviceModel}) is due for return soon. \n\nPlease ensure you bring the original charger, cables, and packaging to avoid deduction fees. Thank you for renting with One Point Solutions!`;
        break;
        
      case 'Overdue Alert':
        subject = `⚠️ URGENT: Overdue Equipment Return Alert [Ref: ${rentalId}]`;
        message = `Dear ${customerName},\n\nOur system indicates that your rental laptop/tablet (${deviceModel}) was due for check-in on the scheduled return date. \n\nLate overdue penalty fees of ₹1,250 per day are accumulating against your security deposit of ₹${depositAmount.toLocaleString()}. Please return the device immediately.`;
        break;
        
      case 'Payment Reminder':
        subject = `💳 Settlement Invoice Payment Reminder [Ref: ${rentalId}]`;
        message = `Dear ${customerName},\n\nWe have completed the post-rental inspection audit on your returned device (${deviceModel}). An outstanding deficit balance remains due on your settlement invoice. \n\nPlease coordinate with our payments desk to complete the transaction and clear your account.`;
        break;
        
      case 'Custom Message':
      default:
        subject = customSubject || `🛡️ Update from One Point Solutions Support [Ref: ${rentalId}]`;
        message = customMessage || `Dear ${customerName}, this is a status update regarding your rental contract ${rentalId}. Please contact support if you have any questions.`;
        break;
    }
    
    // 3. Dispatch simulate dispatches using matching channel type
    if (type === 'Email') {
      const emailRes = await sendEmail({
        to: rental.customerEmail,
        subject,
        body: message,
        rentalId
      });
      
      res.status(200).json({
        success: true,
        message: `Simulated confirmation email successfully dispatched via Mock API.`,
        data: {
          rentalId,
          recipient: rental.customerEmail,
          type: 'Email',
          subject,
          message,
          messageId: emailRes.messageId
        }
      });
    } else {
      // WhatsApp channel
      const waRes = await sendWhatsApp({
        to: rental.customerPhone,
        message,
        rentalId
      });
      
      res.status(200).json({
        success: true,
        message: `Simulated confirmation WhatsApp alert successfully dispatched via Mock API.`,
        data: {
          rentalId,
          recipient: rental.customerPhone,
          type: 'WhatsApp',
          subject: null,
          message,
          messageId: waRes.messageId
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/broadcast
 * Triggers simulated bulk promotional campaign dispatches to all customer contacts.
 */
export const triggerBulkBroadcast = async (req, res, next) => {
  const { channel, subject, message } = req.body;
  
  if (!channel || !message) {
    return next(new AppError(400, 'Missing channel or message in broadcast payload.'));
  }
  
  try {
    // 1. Fetch all unique customers with their most recent rental ID (to satisfy database foreign key NOT NULL constraint)
    const usersRes = await pool.query(`
      SELECT 
        u.id AS "userId",
        u.name AS "customerName",
        u.email AS "customerEmail",
        u.phone AS "customerPhone",
        (SELECT r.id FROM rentals r WHERE r.user_id = u.id ORDER BY r.created_at DESC LIMIT 1) AS "latestRentalId"
      FROM users u
    `);
    
    const customers = usersRes.rows;
    let emailDispatches = 0;
    let waDispatches = 0;
    
    // We need at least one fallback rental ID in case a customer has no rentals (highly unlikely, but safe)
    let fallbackRentalId = null;
    const anyRentalRes = await pool.query('SELECT id FROM rentals LIMIT 1');
    if (anyRentalRes.rows.length > 0) {
      fallbackRentalId = anyRentalRes.rows[0].id;
    }
    
    for (let c of customers) {
      const rentalId = c.latestRentalId || fallbackRentalId;
      if (!rentalId) continue; // Skip if absolutely no rentals exist in database
      
      const personalizedMsg = `Dear ${c.customerName},\n\n${message}`;
      
      if (channel === 'Email' || channel === 'Both') {
        await sendEmail({
          to: c.customerEmail,
          subject: subject || '🎉 Special Festival Rental Offer!',
          body: personalizedMsg,
          rentalId
        });
        emailDispatches++;
      }
      
      if (channel === 'WhatsApp' || channel === 'Both') {
        await sendWhatsApp({
          to: c.customerPhone,
          message: personalizedMsg,
          rentalId
        });
        waDispatches++;
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Bulk campaign successfully broadcast to ${customers.length} customer records.`,
      summary: {
        totalCustomers: customers.length,
        emailsSent: emailDispatches,
        whatsAppsSent: waDispatches
      }
    });
  } catch (err) {
    next(err);
  }
};
