/**
 * Test script for email configuration
 * Tests SMTP connection and sends a test email
 * 
 * Usage:
 *   node scripts/test-email.js
 * 
 * Make sure to set environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
 * 
 * Or set TEST_EMAIL to specify where to send the test email
 */

const nodemailer = require('nodemailer');

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const TEST_EMAIL = process.env.TEST_EMAIL || SMTP_FROM;

console.log('📧 Email Configuration Test');
console.log('============================\n');
console.log('SMTP Host:', SMTP_HOST);
console.log('SMTP Port:', SMTP_PORT);
console.log('SMTP User:', SMTP_USER);
console.log('SMTP From:', SMTP_FROM);
console.log('Test Email To:', TEST_EMAIL);
console.log('');

if (!SMTP_USER || !SMTP_PASSWORD) {
  console.error('❌ Error: SMTP_USER and SMTP_PASSWORD must be set in environment variables');
  console.log('\nPlease set these in your .env.local file or environment:');
  console.log('SMTP_HOST=smtp-relay.brevo.com');
  console.log('SMTP_PORT=587');
  console.log('SMTP_USER=a046c2001@smtp-brevo.com');
  console.log('SMTP_PASSWORD=Etc4dfDOsMUyvISA');
  console.log('SMTP_FROM=americas.cfb.rankings@gmail.com');
  process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});

async function testEmail() {
  try {
    console.log('🔍 Testing SMTP connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
    
    // Send test email
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: `"ACFBR Test" <${SMTP_FROM}>`,
      to: TEST_EMAIL,
      subject: 'Test Email from ACFBR - Email Configuration',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="color: #1a1a1a; margin: 0;">✅ Email Configuration Test</h1>
            </div>
            
            <p>This is a test email to verify your Brevo SMTP configuration is working correctly.</p>
            
            <p>If you received this email, your email service is properly configured! 🎉</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #666;">
              <strong>Configuration Details:</strong><br>
              SMTP Host: ${SMTP_HOST}<br>
              SMTP Port: ${SMTP_PORT}<br>
              From: ${SMTP_FROM}
            </p>
          </body>
        </html>
      `,
      text: `
        Email Configuration Test
        
        This is a test email to verify your Brevo SMTP configuration is working correctly.
        
        If you received this email, your email service is properly configured!
        
        Configuration Details:
        SMTP Host: ${SMTP_HOST}
        SMTP Port: ${SMTP_PORT}
        From: ${SMTP_FROM}
      `,
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('\nPlease check your inbox at:', TEST_EMAIL);
    console.log('(Check spam folder if you don\'t see it)');
    
  } catch (error) {
    console.error('❌ Error testing email:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    if (error.responseCode) {
      console.error('Response Code:', error.responseCode);
    }
    process.exit(1);
  }
}

testEmail();
