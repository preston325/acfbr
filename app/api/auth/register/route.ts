import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password and generate verification token
    const passwordHash = await hashPassword(password);
    const verificationToken = generateVerificationToken();

    // Create user with email_verified_y_n set to 'N' and verification token
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, email_verified_y_n, email_verification_token) 
       VALUES ($1, $2, $3, 'N', $4) 
       RETURNING id, name, email`,
      [name, email, passwordHash, verificationToken]
    );

    // Send verification email (non-blocking - don't fail registration if email fails)
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue anyway - user can request resend later
    }

    return NextResponse.json(
      { message: 'User registered successfully. Please check your email to verify your account.', user: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
