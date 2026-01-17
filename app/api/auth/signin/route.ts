import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const result = await pool.query(
      'SELECT id, name, email, password_hash, email_verified_y_n FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'email_not_found', message: 'No registered user found with this email address.' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (user.email_verified_y_n !== 'Y') {
      return NextResponse.json(
        { error: 'Please verify your email address before signing in. Check your email for the verification link.' },
        { status: 403 }
      );
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    // Create response with token in cookie
    const response = NextResponse.json(
      { message: 'Sign in successful', user: { id: user.id, name: user.name, email: user.email } },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
