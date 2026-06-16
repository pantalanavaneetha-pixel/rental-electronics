// Mock Messaging & Reporting Integration (WhatsApp & Email APIs)
// File: utils/notifier.js

/**
 * Simulates sending an Email via Email API
 * @param {Object} options Email options
 * @param {string} options.to Recipient email address
 * @param {string} options.subject Email subject line
 * @param {string} options.body Email markdown/text content
 * @returns {Promise<{success: boolean, service: string, messageId: string}>}
 */
export async function sendEmail({ to, subject, body }) {
  console.log(`\n📧 [EMAIL API] DISPATCHING EMAIL...`);
  console.log(`   Recipient : ${to}`);
  console.log(`   Subject   : ${subject}`);
  console.log(`   Timestamp : ${new Date().toISOString()}`);
  console.log(`   Body Details:\n${body.split('\n').map(line => `   | ${line}`).join('\n')}\n`);
  
  return {
    success: true,
    service: 'MockEmailAPI',
    messageId: `email-${Math.random().toString(36).substr(2, 9)}`
  };
}

/**
 * Simulates sending a WhatsApp message via WhatsApp Business API
 * @param {Object} options WhatsApp options
 * @param {string} options.to Recipient mobile number
 * @param {string} options.message Notification text
 * @returns {Promise<{success: boolean, service: string, messageId: string}>}
 */
export async function sendWhatsApp({ to, message }) {
  console.log(`\n💬 [WHATSAPP BUSINESS API] DISPATCHING MESSAGE...`);
  console.log(`   Recipient : ${to}`);
  console.log(`   Timestamp : ${new Date().toISOString()}`);
  console.log(`   Message   : "${message}"\n`);
  
  return {
    success: true,
    service: 'MockWhatsAppAPI',
    messageId: `wa-${Math.random().toString(36).substr(2, 9)}`
  };
}
