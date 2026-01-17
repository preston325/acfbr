import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const result = await pool.query(
      'SELECT id, name, email, email_verified_y_n, email_verification_token FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { message: 'If an account with this email exists and is not verified, a verification email has been sent.' },
        { status: 200 }
      );
    }

    const user = result.rows[0];

    // If already verified, don't send another email
    if (user.email_verified_y_n === 'Y') {
      return NextResponse.json(
        { message: 'This email is already verified.' },
        { status: 200 }
      );
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

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
      return NextResponse.json(
        { message: 'Verification email has been sent. Please check your inbox.' },
        { status: 200 }
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
