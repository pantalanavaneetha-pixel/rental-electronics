// Mock Messaging & Reporting Integration (WhatsApp & Email APIs)
// File: utils/notifier.js

import { query } from '../config/db.js';
import crypto from 'crypto';

/**
 * Simulates sending an Email via Email API
 * @param {Object} options Email options
 * @param {string} options.to Recipient email address
 * @param {string} options.subject Email subject line
 * @param {string} options.body Email markdown/text content
 * @param {string} [options.rentalId] Associated rental transaction ID
 * @returns {Promise<{success: boolean, service: string, messageId: string}>}
 */
export async function sendEmail({ to, subject, body, rentalId }) {
  console.log(`\n📧 [EMAIL API] DISPATCHING EMAIL...`);
  console.log(`   Recipient : ${to}`);
  console.log(`   Subject   : ${subject}`);
  console.log(`   Timestamp : ${new Date().toISOString()}`);
  console.log(`   Body Details:\n${body.split('\n').map(line => `   | ${line}`).join('\n')}\n`);
  
  const messageId = `email-${Math.random().toString(36).substr(2, 9)}`;
  
  if (rentalId) {
    const notificationId = `notif-${crypto.randomUUID()}`;
    try {
      await query(
        `INSERT INTO notifications (id, rental_id, recipient, type, subject, message, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [notificationId, rentalId, to, 'Email', subject, body, 'Sent']
      );
    } catch (e) {
      console.error('Error logging email notification to SQLite/PostgreSQL database:', e.message);
    }
  }
  
  return {
    success: true,
    service: 'MockEmailAPI',
    messageId
  };
}

/**
 * Simulates sending a WhatsApp message via WhatsApp Business API
 * @param {Object} options WhatsApp options
 * @param {string} options.to Recipient mobile number
 * @param {string} options.message Notification text
 * @param {string} [options.rentalId] Associated rental transaction ID
 * @returns {Promise<{success: boolean, service: string, messageId: string}>}
 */
export async function sendWhatsApp({ to, message, rentalId }) {
  console.log(`\n💬 [WHATSAPP BUSINESS API] DISPATCHING MESSAGE...`);
  console.log(`   Recipient : ${to}`);
  console.log(`   Timestamp : ${new Date().toISOString()}`);
  console.log(`   Message   : "${message}"\n`);
  
  const messageId = `wa-${Math.random().toString(36).substr(2, 9)}`;
  
  if (rentalId) {
    const notificationId = `notif-${crypto.randomUUID()}`;
    try {
      await query(
        `INSERT INTO notifications (id, rental_id, recipient, type, subject, message, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [notificationId, rentalId, to, 'WhatsApp', null, message, 'Sent']
      );
    } catch (e) {
      console.error('Error logging WhatsApp notification to SQLite/PostgreSQL database:', e.message);
    }
  }
  
  return {
    success: true,
    service: 'MockWhatsAppAPI',
    messageId
  };
}
