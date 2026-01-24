import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      'SELECT id, user_type FROM user_type ORDER BY user_type'
    );

    const response = NextResponse.json({
      userTypes: result.rows.map(row => ({ id: row.id, user_type: row.user_type })),
    });

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching user types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
