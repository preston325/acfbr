import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email configuration - these should be set in environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

/**
 * Generate a secure random token for email verification
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send email verification email to user
 */
export async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    console.error('SMTP credentials not configured. Email verification email not sent.');
    console.log('Verification link (for development):', `${APP_URL}/api/auth/verify-email?token=${token}`);
    return;
  }

  const verificationUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

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
    text: `
      Welcome to ACFBR!
      
      Hi ${name},
      
      Thank you for registering with America's College Football Rankings (ACFBR).
      
      Please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with ACFBR, please ignore this email.
      
      ---
      America's College Football Rankings (ACFBR)
      Independent voting system for college football pundits
    `,
  };

  try {
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send password reset email with link to update-password page
 */
export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    console.error('SMTP credentials not configured. Password reset email not sent.');
    console.log('Password reset link (for development):', `${APP_URL}/update-password?token=${token}`);
    return;
  }

  const resetUrl = `${APP_URL}/update-password?token=${token}`;

  const mailOptions = {
    from: `"ACFBR" <${SMTP_FROM}>`,
    to: email,
    subject: 'Reset Your Password - ACFBR',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #1a1a1a; margin: 0;">Reset Your Password</h1>
          </div>
          
          <p>Hi ${name},</p>
          
          <p>You requested a password reset for your ACFBR account.</p>
          
          <p>Click the button below to choose a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: #007bff; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
          
          <p>This link will expire in 1 hour.</p>
          
          <p>If you didn't request a password reset, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666;">
            America's College Football Rankings (ACFBR)<br>
            Independent voting system for college football pundits
          </p>
        </body>
      </html>
    `,
    text: `
      Hi ${name},
      
      You requested a password reset for your ACFBR account.
      
      Click the link below to choose a new password:
      
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, please ignore this email.
      
      ---
      America's College Football Rankings (ACFBR)
    `,
  };

  try {
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}
