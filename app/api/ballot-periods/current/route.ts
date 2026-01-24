import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Find the current ballot period where the current date falls between poll_open_dt and poll_close_dt
    const now = new Date();
    const result = await pool.query(
      `SELECT 
        period_name,
        period_beg_dt,
        period_end_dt,
        poll_open_dt,
        poll_close_dt
      FROM ballot_periods
      WHERE poll_open_dt <= $1 AND poll_close_dt >= $1
      ORDER BY period DESC
      LIMIT 1`,
      [now]
    );

    let response;
    if (result.rows.length > 0) {
      response = NextResponse.json({
        period: result.rows[0],
      });
    } else {
      // No current period found
      response = NextResponse.json({
        period: null,
      });
    }
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching current ballot period:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
