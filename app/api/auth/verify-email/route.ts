import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/signin?error=invalid_token', request.url));
    }

    // Find user with this verification token
    const result = await pool.query(
      'SELECT id, email, email_verified_y_n FROM users WHERE email_verification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.redirect(new URL('/signin?error=invalid_token', request.url));
    }

    const user = result.rows[0];

    // If already verified, redirect to signin with success message
    if (user.email_verified_y_n === 'Y') {
      return NextResponse.redirect(new URL('/signin?verified=already', request.url));
    }

    // Update user to verified and clear token
    await pool.query(
      `UPDATE users 
       SET email_verified_y_n = 'Y', 
           email_verification_token = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [user.id]
    );

    // Redirect to signin with success message
    return NextResponse.redirect(new URL('/signin?verified=success', request.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/signin?error=verification_failed', request.url));
  }
}
