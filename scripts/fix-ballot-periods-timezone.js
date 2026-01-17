const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/acfbr',
});

async function fixBallotPeriodsTimezone() {
  try {
    console.log('Subtracting 6 hours from all ballot_periods timestamps...');
    
    // Subtract 6 hours from all timestamp columns
    const result = await pool.query(`
      UPDATE ballot_periods
      SET 
        period_beg_dt = period_beg_dt - INTERVAL '6 hours',
        period_end_dt = period_end_dt - INTERVAL '6 hours',
        poll_open_dt = poll_open_dt - INTERVAL '6 hours',
        poll_close_dt = poll_close_dt - INTERVAL '6 hours'
    `);
    
    console.log(`Updated ${result.rowCount} ballot period records`);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixBallotPeriodsTimezone();
