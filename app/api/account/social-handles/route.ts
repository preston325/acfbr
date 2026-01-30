import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT 
        smh.id,
        smh.handle,
        smh.social_media_type_id,
        smt.social_media_type
      FROM social_media_handles smh
      JOIN social_media_types smt ON smh.social_media_type_id = smt.id
      WHERE smh.user_id = $1
      ORDER BY smt.social_media_type, smh.handle`,
      [user.id]
    );

    const handles = result.rows.map((row) => ({
      id: row.id,
      handle: row.handle,
      social_media_type_id: row.social_media_type_id,
      social_media_type: row.social_media_type,
    }));

    const response = NextResponse.json({ handles }, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('Get social handles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { social_media_type_id, handle } = body;

    if (social_media_type_id == null || !handle || typeof handle !== 'string') {
      return NextResponse.json(
        { error: 'social_media_type_id and handle are required' },
        { status: 400 }
      );
    }

    const trimmedHandle = handle.trim();
    if (!trimmedHandle) {
      return NextResponse.json({ error: 'Handle cannot be empty' }, { status: 400 });
    }

    // Verify social_media_type_id exists
    const typeCheck = await pool.query(
      'SELECT id FROM social_media_types WHERE id = $1',
      [social_media_type_id]
    );
    if (typeCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid social media type' }, { status: 400 });
    }

    // Prevent duplicate (user + type + handle)
    const existing = await pool.query(
      `SELECT id FROM social_media_handles 
       WHERE user_id = $1 AND social_media_type_id = $2 AND LOWER(TRIM(handle)) = LOWER($3)`,
      [user.id, social_media_type_id, trimmedHandle]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'You already have this handle for this social media type' },
        { status: 400 }
      );
    }

    const insertResult = await pool.query(
      `INSERT INTO social_media_handles (user_id, social_media_type_id, handle)
       VALUES ($1, $2, $3)
       RETURNING id, handle, social_media_type_id`,
      [user.id, social_media_type_id, trimmedHandle]
    );

    const row = insertResult.rows[0];
    const typeRow = await pool.query(
      'SELECT social_media_type FROM social_media_types WHERE id = $1',
      [row.social_media_type_id]
    );

    const response = NextResponse.json(
      {
        message: 'Handle added',
        handle: {
          id: row.id,
          handle: row.handle,
          social_media_type_id: row.social_media_type_id,
          social_media_type: typeRow.rows[0]?.social_media_type ?? '',
        },
      },
      { status: 201 }
    );
    return response;
  } catch (error) {
    console.error('Add social handle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Handle id is required' }, { status: 400 });
    }

    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: 'Invalid handle id' }, { status: 400 });
    }

    const result = await pool.query(
      'DELETE FROM social_media_handles WHERE id = $1 AND user_id = $2 RETURNING id',
      [idNum, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Handle not found or you do not have permission to remove it' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Handle removed' }, { status: 200 });
  } catch (error) {
    console.error('Delete social handle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
