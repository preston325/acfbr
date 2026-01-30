import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, podcast_y_n, podcast_url, sports_media_y_n, sports_media_url, sports_broadcast_y_n, sports_broadcast_url, primary_social_handle, social_media_type_id } = await request.json();

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

    const handleTrimmed = typeof primary_social_handle === 'string' ? primary_social_handle.trim() : '';
    if (handleTrimmed) {
      const typeIdNum = Number(social_media_type_id);
      if (!social_media_type_id || !Number.isInteger(typeIdNum) || typeIdNum < 1) {
        return NextResponse.json(
          { error: 'Social media type is required when providing a social media handle' },
          { status: 400 }
        );
      }
      const typeCheck = await pool.query('SELECT id FROM social_media_types WHERE id = $1', [typeIdNum]);
      if (typeCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid social media type' },
          { status: 400 }
        );
      }
    }

    // Hash password and generate verification token
    const passwordHash = await hashPassword(password);
    const verificationToken = generateVerificationToken();

    let userRow: { id: number; name: string; email: string };
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert into users table (name, email, password_hash, email_verified_y_n, email_verification_token)
      const userResult = await client.query(
        `INSERT INTO users (name, email, password_hash, email_verified_y_n, email_verification_token) 
         VALUES ($1, $2, $3, 'N', $4) 
         RETURNING id, name, email`,
        [name, email, passwordHash, verificationToken]
      );
      userRow = userResult.rows[0];
      const userId = userRow.id;

      // Insert into user_account table so every user has a profile record from registration
      // user_account schema: user_id (PK), favorite_team_id, podcast_*, sports_media_*, sports_broadcast_*
      const podcastYn = podcast_y_n === 'Y' || podcast_y_n === 'N' ? podcast_y_n : 'N';
      const sportsMediaYn = sports_media_y_n === 'Y' || sports_media_y_n === 'N' ? sports_media_y_n : 'N';
      const sportsBroadcastYn = sports_broadcast_y_n === 'Y' || sports_broadcast_y_n === 'N' ? sports_broadcast_y_n : 'N';
      const podcastUrlVal = podcastYn === 'Y' && podcast_url ? String(podcast_url).trim() : null;
      const sportsMediaUrlVal = sportsMediaYn === 'Y' && sports_media_url ? String(sports_media_url).trim() : null;
      const sportsBroadcastUrlVal = sportsBroadcastYn === 'Y' && sports_broadcast_url ? String(sports_broadcast_url).trim() : null;
      await client.query(
        `INSERT INTO user_account (user_id, podcast_y_n, podcast_url, sports_media_y_n, sports_media_url, sports_broadcast_y_n, sports_broadcast_url) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, podcastYn, podcastUrlVal, sportsMediaYn, sportsMediaUrlVal, sportsBroadcastYn, sportsBroadcastUrlVal]
      );

      if (handleTrimmed) {
        const typeId = Number(social_media_type_id);
        await client.query(
          `INSERT INTO social_media_handles (user_id, social_media_type_id, handle) VALUES ($1, $2, $3)`,
          [userId, typeId, handleTrimmed]
        );
      }

      await client.query('COMMIT');
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }

    // Send verification email (non-blocking - don't fail registration if email fails)
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue anyway - user can request resend later
    }

    return NextResponse.json(
      { message: 'User registered successfully. Please check your email to verify your account.', user: userRow },
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
