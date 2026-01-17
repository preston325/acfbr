import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      'SELECT id, user_type FROM user_type ORDER BY user_type'
    );

    return NextResponse.json({
      userTypes: result.rows.map(row => ({ id: row.id, user_type: row.user_type })),
    });
  } catch (error) {
    console.error('Error fetching user types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
