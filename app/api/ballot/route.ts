import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { rankings } = await request.json();

    if (!rankings || !Array.isArray(rankings) || rankings.length === 0) {
      return NextResponse.json(
        { error: 'Rankings array is required' },
        { status: 400 }
      );
    }

    if (rankings.length > 25) {
      return NextResponse.json(
        { error: 'Maximum 25 teams can be ranked' },
        { status: 400 }
      );
    }

    // Get current week and year (simplified - you may want to make this more sophisticated)
    const now = new Date();
    const seasonYear = now.getFullYear();
    // Simple week calculation - you may want to use actual CFB week calculation
    const weekNumber = Math.floor((now.getTime() - new Date(seasonYear, 7, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Check if ballot already exists for this week
      const existingBallot = await pool.query(
        'SELECT id FROM ballots WHERE user_id = $1 AND week_number = $2 AND season_year = $3',
        [user.id, weekNumber, seasonYear]
      );

      let ballotId: number;

      if (existingBallot.rows.length > 0) {
        // Update existing ballot
        ballotId = existingBallot.rows[0].id;
        await pool.query(
          'DELETE FROM ballot_rankings WHERE ballot_id = $1',
          [ballotId]
        );
      } else {
        // Create new ballot
        const ballotResult = await pool.query(
          'INSERT INTO ballots (user_id, week_number, season_year) VALUES ($1, $2, $3) RETURNING id',
          [user.id, weekNumber, seasonYear]
        );
        ballotId = ballotResult.rows[0].id;
      }

      // Insert rankings
      for (const ranking of rankings) {
        await pool.query(
          'INSERT INTO ballot_rankings (ballot_id, team_id, rank) VALUES ($1, $2, $3)',
          [ballotId, ranking.teamId, ranking.rank]
        );
      }

      await pool.query('COMMIT');

      return NextResponse.json({
        message: 'Ballot submitted successfully',
        ballotId,
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error submitting ballot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
