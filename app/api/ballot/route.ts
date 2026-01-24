import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

// Helper function to get ballot type ID by type name
async function getBallotTypeId(typeName: string): Promise<number | null> {
  const result = await pool.query(
    'SELECT id FROM ballot_types WHERE ballot_type = $1',
    [typeName]
  );
  
  if (result.rows.length > 0) {
    return result.rows[0].id;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Explicitly use ballot_type_id = 1 as requested
    const ballotTypeId = 1;

    // Find the user's ballot with ballot_type_id = 1 and NULL ballot_period_id
    // (matching the PUT endpoint which saves with NULL ballot_period_id)
    const ballotResult = await pool.query(
      `SELECT id FROM ballots 
       WHERE user_id = $1 AND ballot_period_id IS NULL AND ballot_type_id = $2 
       ORDER BY updated_at DESC 
       LIMIT 1`,
      [user.id, ballotTypeId]
    );

    if (ballotResult.rows.length === 0) {
      // No saved ballot found
      return NextResponse.json({
        rankings: [],
      });
    }

    const ballotId = ballotResult.rows[0].id;

    // Fetch the rankings with team information from ballot_rankings table
    // where ballot_type_id = 1
    const rankingsResult = await pool.query(
      `SELECT 
        br.rank,
        t.id as team_id,
        t.str_team,
        t.str_badge_b64
      FROM ballot_rankings br
      INNER JOIN teams_ncaa_d1_football t ON br.team_id = t.id
      WHERE br.ballot_id = $1
      ORDER BY br.rank ASC`,
      [ballotId]
    );

    const rankings = rankingsResult.rows.map((row) => ({
      teamId: row.team_id,
      rank: row.rank,
      team: {
        id: row.team_id,
        str_team: row.str_team,
        str_badge_b64: row.str_badge_b64,
      },
    }));

    const response = NextResponse.json({
      rankings,
    });

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching ballot:', error);
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

    // Explicitly use ballot_type_id = 1 as requested (matching GET endpoint)
    const ballotTypeId = 1;

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Check if ballot already exists for this user with NULL ballot_period_id and in-progress type
      const existingBallot = await pool.query(
        'SELECT id FROM ballots WHERE user_id = $1 AND ballot_period_id IS NULL AND ballot_type_id = $2',
        [user.id, ballotTypeId]
      );

      let ballotId: number;

      if (existingBallot.rows.length > 0) {
        // Update existing ballot (just update the updated_at timestamp)
        ballotId = existingBallot.rows[0].id;
        await pool.query(
          'UPDATE ballots SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [ballotId]
        );
        // Delete existing rankings
        await pool.query(
          'DELETE FROM ballot_rankings WHERE ballot_id = $1',
          [ballotId]
        );
      } else {
        // Create new ballot with NULL ballot_period_id
        const ballotResult = await pool.query(
          'INSERT INTO ballots (user_id, ballot_period_id, ballot_type_id) VALUES ($1, NULL, $2) RETURNING id',
          [user.id, ballotTypeId]
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
        message: 'Ballot saved successfully',
        ballotId,
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error saving ballot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get current ballot period
    const ballotPeriodId = await getCurrentBallotPeriodId();
    if (!ballotPeriodId) {
      return NextResponse.json(
        { error: 'No active ballot period found' },
        { status: 400 }
      );
    }

    // Get ballot_type_id for 'final'
    const ballotTypeId = await getBallotTypeId('final');
    if (!ballotTypeId) {
      return NextResponse.json(
        { error: 'Ballot type not found' },
        { status: 500 }
      );
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Check if ballot already exists for this user, period, and type
      const existingBallot = await pool.query(
        'SELECT id FROM ballots WHERE user_id = $1 AND ballot_period_id = $2 AND ballot_type_id = $3',
        [user.id, ballotPeriodId, ballotTypeId]
      );

      let ballotId: number;

      if (existingBallot.rows.length > 0) {
        // Update existing ballot
        ballotId = existingBallot.rows[0].id;
        await pool.query(
          'UPDATE ballots SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [ballotId]
        );
        // Delete existing rankings
        await pool.query(
          'DELETE FROM ballot_rankings WHERE ballot_id = $1',
          [ballotId]
        );
      } else {
        // Create new ballot
        const ballotResult = await pool.query(
          'INSERT INTO ballots (user_id, ballot_period_id, ballot_type_id) VALUES ($1, $2, $3) RETURNING id',
          [user.id, ballotPeriodId, ballotTypeId]
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
