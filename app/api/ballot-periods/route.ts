import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Query ballot_periods table for year 2025 (using season column)
    // All timestamps are stored in Mountain Time (America/Denver)
    const result = await pool.query(
      `SELECT 
        period_name,
        period_beg_dt,
        period_end_dt,
        poll_open_dt,
        poll_close_dt
      FROM ballot_periods
      WHERE season = $1
      ORDER BY period ASC`,
      ['2025']
    );

    return NextResponse.json({
      periods: result.rows,
    });
  } catch (error) {
    console.error('Error fetching ballot periods:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
