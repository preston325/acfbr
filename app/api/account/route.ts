import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser, hashPassword, generateToken } from '@/lib/auth';
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user_account data
    const accountResult = await pool.query(
      `SELECT 
        ua.user_type_id,
        ut.user_type,
        ua.favorite_team_id,
        t.str_team as favorite_team_name,
        ua.podcast_y_n,
        ua.podcast_name,
        ua.podcast_url,
        ua.podcast_followers,
        ua.podcast_verified_y_n
      FROM user_account ua
      LEFT JOIN user_type ut ON ua.user_type_id = ut.id
      LEFT JOIN teams_ncaa_d1_football t ON ua.favorite_team_id = t.id
      WHERE ua.user_id = $1`,
      [user.id]
    );

    const accountData = accountResult.rows[0] || null;

    const response = NextResponse.json(
      { 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email 
        },
        account: accountData ? {
          user_type_id: accountData.user_type_id,
          user_type: accountData.user_type,
          favorite_team_id: accountData.favorite_team_id,
          favorite_team_name: accountData.favorite_team_name,
          podcast_y_n: accountData.podcast_y_n,
          podcast_name: accountData.podcast_name,
          podcast_url: accountData.podcast_url,
          podcast_followers: accountData.podcast_followers,
          podcast_verified_y_n: accountData.podcast_verified_y_n,
        } : null
      },
      { status: 200 }
    );

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Get account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { 
      email, 
      password, 
      user_type_id,
      favorite_team_id,
      podcast_y_n,
      podcast_name,
      podcast_url,
      podcast_followers
    } = await request.json();

    // Validate that at least one field is being updated
    if (!email && !password && user_type_id === undefined && favorite_team_id === undefined && 
        podcast_y_n === undefined && podcast_name === undefined && podcast_url === undefined && podcast_followers === undefined) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    // If updating password, validate new password
    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }
    }

    // If updating email, check if it's already taken
    if (email && email !== user.email) {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Build update query for users table dynamically
    const userUpdates: string[] = [];
    const userValues: any[] = [];
    let userParamIndex = 1;
    let verificationToken: string | null = null;

    if (email && email !== user.email) {
      userUpdates.push(`email = $${userParamIndex}`);
      userValues.push(email);
      userParamIndex++;
      // Set email_verified_y_n to 'N' when email is changed
      userUpdates.push(`email_verified_y_n = $${userParamIndex}`);
      userValues.push('N');
      userParamIndex++;
      // Generate new verification token
      verificationToken = generateVerificationToken();
      userUpdates.push(`email_verification_token = $${userParamIndex}`);
      userValues.push(verificationToken);
      userParamIndex++;
    }

    if (password) {
      const passwordHash = await hashPassword(password);
      userUpdates.push(`password_hash = $${userParamIndex}`);
      userValues.push(passwordHash);
      userParamIndex++;
    }

    // Update users table if there are changes
    let updatedUser = { id: user.id, name: user.name, email: user.email };
    let emailUpdated = false;

    if (userUpdates.length > 0) {
      userValues.push(user.id);
      const updateUserQuery = `
        UPDATE users 
        SET ${userUpdates.join(', ')}
        WHERE id = $${userParamIndex}
        RETURNING id, name, email
      `;
      const userResult = await pool.query(updateUserQuery, userValues);
      updatedUser = userResult.rows[0];

      // If email was updated, send verification email
      if (email && email !== user.email && verificationToken) {
        emailUpdated = true;
        
        // Send verification email
        try {
          await sendVerificationEmail(updatedUser.email, user.name, verificationToken);
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          // Continue anyway - user can request resend later
        }
      }
    }

    // Handle user_account updates
    if (user_type_id !== undefined || favorite_team_id !== undefined || 
        podcast_y_n !== undefined || podcast_name !== undefined || podcast_url !== undefined || podcast_followers !== undefined) {
      
      // Check if user_account record exists
      const existingAccount = await pool.query(
        'SELECT user_id FROM user_account WHERE user_id = $1',
        [user.id]
      );

      if (existingAccount.rows.length === 0) {
        // Insert new user_account record with user_id and submitted values
        const insertFields: string[] = ['user_id'];
        const insertValues: any[] = [user.id];

        if (user_type_id !== undefined) {
          insertFields.push('user_type_id');
          insertValues.push(user_type_id);
        }
        if (favorite_team_id !== undefined) {
          insertFields.push('favorite_team_id');
          insertValues.push(favorite_team_id);
        }
        if (podcast_y_n !== undefined) {
          insertFields.push('podcast_y_n');
          insertValues.push(podcast_y_n);
        }
        if (podcast_name !== undefined) {
          insertFields.push('podcast_name');
          insertValues.push(podcast_name);
        }
        if (podcast_url !== undefined) {
          insertFields.push('podcast_url');
          insertValues.push(podcast_url);
        }
        if (podcast_followers !== undefined) {
          insertFields.push('podcast_followers');
          insertValues.push(podcast_followers);
        }
        // If any podcast field is being updated, set verified to 'N'
        if (podcast_y_n !== undefined || podcast_name !== undefined || podcast_url !== undefined || podcast_followers !== undefined) {
          insertFields.push('podcast_verified_y_n');
          insertValues.push('N');
        }

        const insertQuery = `
          INSERT INTO user_account (${insertFields.join(', ')})
          VALUES (${insertFields.map((_, i) => `$${i + 1}`).join(', ')})
        `;
        await pool.query(insertQuery, insertValues);
      } else {
        // Update existing user_account record
        const accountUpdates: string[] = [];
        const accountValues: any[] = [];
        let accountParamIndex = 1;

        if (user_type_id !== undefined) {
          accountUpdates.push(`user_type_id = $${accountParamIndex}`);
          accountValues.push(user_type_id);
          accountParamIndex++;
        }
        if (favorite_team_id !== undefined) {
          accountUpdates.push(`favorite_team_id = $${accountParamIndex}`);
          accountValues.push(favorite_team_id);
          accountParamIndex++;
        }
        if (podcast_y_n !== undefined) {
          accountUpdates.push(`podcast_y_n = $${accountParamIndex}`);
          accountValues.push(podcast_y_n);
          accountParamIndex++;
        }
        if (podcast_name !== undefined) {
          accountUpdates.push(`podcast_name = $${accountParamIndex}`);
          accountValues.push(podcast_name);
          accountParamIndex++;
        }
        if (podcast_url !== undefined) {
          accountUpdates.push(`podcast_url = $${accountParamIndex}`);
          accountValues.push(podcast_url);
          accountParamIndex++;
        }
        if (podcast_followers !== undefined) {
          accountUpdates.push(`podcast_followers = $${accountParamIndex}`);
          accountValues.push(podcast_followers);
          accountParamIndex++;
        }
        // If any podcast field is being updated, set verified to 'N'
        if (podcast_y_n !== undefined || podcast_name !== undefined || podcast_url !== undefined || podcast_followers !== undefined) {
          accountUpdates.push(`podcast_verified_y_n = $${accountParamIndex}`);
          accountValues.push('N');
          accountParamIndex++;
        }

        if (accountUpdates.length > 0) {
          accountValues.push(user.id);
          const updateAccountQuery = `
            UPDATE user_account 
            SET ${accountUpdates.join(', ')}
            WHERE user_id = $${accountParamIndex}
          `;
          await pool.query(updateAccountQuery, accountValues);
        }
      }
    }

    const response = NextResponse.json(
      { 
        message: emailUpdated ? 'Email updated. Please check your email to verify your new address.' : 'Account updated successfully', 
        user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email },
        emailUpdated: emailUpdated
      },
      { status: 200 }
    );

    // If email was updated, clear the token cookie to log out the user
    if (emailUpdated) {
      response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Expire immediately
      });
    }

    return response;
  } catch (error) {
    console.error('Update account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
