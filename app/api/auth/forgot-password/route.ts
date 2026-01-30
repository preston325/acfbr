import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateVerificationToken, sendPasswordResetEmail } from '@/lib/email';

const RESET_EXPIRY_HOURS = 1;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'email_not_found', message: 'No account found with this email address.' },
        { status: 404 }
      );
    }

    const user = result.rows[0];
    const token = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESET_EXPIRY_HOURS);

    await pool.query(
      `UPDATE users 
       SET password_reset_token = $1,
           password_reset_expires_at = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [token, expiresAt, user.id]
    );

    try {
      await sendPasswordResetEmail(user.email, user.name, token);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      await pool.query(
        'UPDATE users SET password_reset_token = NULL, password_reset_expires_at = NULL WHERE id = $1',
        [user.id]
      );
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'A password reset link has been sent to your email.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
