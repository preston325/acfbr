import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get current week and year (same logic as ballot route)
    const now = new Date();
    const seasonYear = now.getFullYear();
    const weekNumber = Math.floor((now.getTime() - new Date(seasonYear, 7, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

    // Calculate aggregated rankings
    const result = await pool.query(
      `SELECT 
        t.id as team_id,
        t.name as team_name,
        t.school_name,
        t.logo_url,
        AVG(br.rank) as average_rank,
        COUNT(DISTINCT br.ballot_id) as total_votes
      FROM teams t
      INNER JOIN ballot_rankings br ON t.id = br.team_id
      INNER JOIN ballots b ON br.ballot_id = b.id
      WHERE b.week_number = $1 AND b.season_year = $2
      GROUP BY t.id, t.name, t.school_name, t.logo_url
      HAVING COUNT(DISTINCT br.ballot_id) > 0
      ORDER BY average_rank ASC
      LIMIT 25`,
      [weekNumber, seasonYear]
    );

    // Add rank numbers
    const rankings = result.rows.map((row, index) => ({
      ...row,
      rank: index + 1,
      average_rank: parseFloat(row.average_rank),
      total_votes: parseInt(row.total_votes),
    }));

    return NextResponse.json({
      rankings,
      week: weekNumber,
      season: seasonYear,
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
