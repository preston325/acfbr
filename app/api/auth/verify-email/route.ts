import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    console.log(`[VERIFY-EMAIL] Request received for token: ${token ? token.substring(0, 10) + '...' : 'null'}`);

    if (!token) {
      console.log('[VERIFY-EMAIL] No token provided in request');
      return NextResponse.redirect(new URL('/signin?error=invalid_token', APP_URL));
    }

    console.log(`[VERIFY-EMAIL] Querying database for token: ${token.substring(0, 10)}...`);

    // Find user with this verification token
    const result = await pool.query(
      'SELECT id, email, email_verified_y_n FROM users WHERE email_verification_token = $1',
      [token]
    );

    console.log(`[VERIFY-EMAIL] Database query result: ${result.rows.length} rows found`);

    if (result.rows.length === 0) {
      console.log('[VERIFY-EMAIL] Token not found in database');
      return NextResponse.redirect(new URL('/signin?error=invalid_token', APP_URL));
    }

    const user = result.rows[0];
    console.log(`[VERIFY-EMAIL] Found user: ${user.email}, verified: ${user.email_verified_y_n}`);

    // If already verified, redirect to signin with success message
    if (user.email_verified_y_n === 'Y') {
      console.log('[VERIFY-EMAIL] User already verified');
      return NextResponse.redirect(new URL('/signin?verified=already', APP_URL));
    }

    console.log('[VERIFY-EMAIL] Updating user verification status');

    // Update user to verified and clear token
    await pool.query(
      `UPDATE users 
       SET email_verified_y_n = 'Y', 
           email_verification_token = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [user.id]
    );

    console.log(`[VERIFY-EMAIL] User ${user.email} successfully verified`);

    // Redirect to signin with success message
    return NextResponse.redirect(new URL('/signin?verified=success', APP_URL));
  } catch (error) {
    console.error('[VERIFY-EMAIL] Error during email verification:', error);
    return NextResponse.redirect(new URL('/signin?error=verification_failed', APP_URL));
  }
}
