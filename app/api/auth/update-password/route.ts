import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'invalid_token', message: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'passwords_mismatch', message: 'Password and confirm password do not match.' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT id FROM users 
       WHERE password_reset_token = $1 
       AND password_reset_expires_at > CURRENT_TIMESTAMP`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'invalid_token', message: 'Invalid or expired reset link. Please request a new password reset.' },
        { status: 400 }
      );
    }

    const user = result.rows[0];
    const passwordHash = await hashPassword(password);

    await pool.query(
      `UPDATE users 
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    return NextResponse.json(
      { message: 'Password updated successfully. You can now sign in.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
