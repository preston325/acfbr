import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Helper function to get current ballot period ID
async function getCurrentBallotPeriodId(): Promise<number | null> {
  const now = new Date();
  const result = await pool.query(
    `SELECT id FROM ballot_periods 
     WHERE period_beg_dt <= $1 AND poll_close_dt >= $1 
     ORDER BY period DESC 
     LIMIT 1`,
    [now]
  );
  
  if (result.rows.length > 0) {
    return result.rows[0].id;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    // Get current ballot period ID
    const ballotPeriodId = await getCurrentBallotPeriodId();
    if (!ballotPeriodId) {
      return NextResponse.json({
        rankings: [],
        message: 'No active ballot period found',
      });
    }

    // Calculate aggregated rankings
    // Only include ballots where ballot_type_id = 2 (final) and ballot_period_id is current
    const result = await pool.query(
      `SELECT 
        t.id as team_id,
        t.str_team as team_name,
        t.str_badge_b64 as logo_url,
        AVG(br.rank) as average_rank,
        COUNT(DISTINCT br.ballot_id) as total_votes
      FROM teams_ncaa_d1_football t
      INNER JOIN ballot_rankings br ON t.id = br.team_id
      INNER JOIN ballots b ON br.ballot_id = b.id
      WHERE b.ballot_period_id = $1 AND b.ballot_type_id = 2
      GROUP BY t.id, t.str_team, t.str_badge_b64
      HAVING COUNT(DISTINCT br.ballot_id) > 0
      ORDER BY average_rank ASC
      LIMIT 25`,
      [ballotPeriodId]
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
      ballot_period_id: ballotPeriodId,
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
