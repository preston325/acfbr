/**
 * Script to manually send a verification email to a user
 * Usage: node scripts/send-verification-email.js <email>
 */

const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Environment variables should be set in the environment or .env file
// Docker Compose will automatically load .env file

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/acfbr',
});

// Email configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function sendVerificationEmail(email, name, token) {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    console.error('❌ SMTP credentials not configured.');
    console.log('Verification link:', `${APP_URL}/api/auth/verify-email?token=${token}`);
    return;
  }

  const verificationUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"ACFBR" <${SMTP_FROM}>`,
    to: email,
    subject: 'Verify Your Email - ACFBR',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #1a1a1a; margin: 0;">Welcome to ACFBR!</h1>
          </div>
          
          <p>Hi ${name},</p>
          
          <p>Thank you for registering with America's College Football Rankings (ACFBR).</p>
          
          <p>Please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background: #007bff; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
          
          <p>This link will expire in 24 hours.</p>
          
          <p>If you didn't create an account with ACFBR, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666;">
            America's College Football Rankings (ACFBR)<br>
            Independent voting system for college football pundits
          </p>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    throw error;
  }
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node scripts/send-verification-email.js <email>');
    process.exit(1);
  }

  try {
    console.log(`Looking up user with email: ${email}...`);
    
    // Find user
    const result = await pool.query(
      'SELECT id, name, email, email_verified_y_n FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.error(`❌ No user found with email: ${email}`);
      await pool.end();
      process.exit(1);
    }

    const user = result.rows[0];

    if (user.email_verified_y_n === 'Y') {
      console.log(`ℹ️  User ${email} is already verified.`);
      await pool.end();
      process.exit(0);
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();

    // Update user with new token
    await pool.query(
      `UPDATE users 
       SET email_verification_token = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [verificationToken, user.id]
    );

    console.log(`✅ Updated verification token for user: ${user.name} (${user.email})`);

    // Send verification email
    await sendVerificationEmail(user.email, user.name, verificationToken);

    await pool.end();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

main();
