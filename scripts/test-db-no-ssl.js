const { Pool } = require('pg');

// Test connection WITHOUT SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Snoqualmie2015%21@tdpllc-1.cqgd5zbaiuii.us-west-2.rds.amazonaws.com:5432/acfbr',
  ssl: false // Explicitly disable SSL
});

async function testConnection() {
  try {
    console.log('Testing database connection WITHOUT SSL...');
    const client = await pool.connect();
    console.log('✓ Successfully connected WITHOUT SSL!');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Current time:', result.rows[0].current_time);
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Connection WITHOUT SSL failed!');
    console.error('Error:', error.message);
    console.error('\nThis confirms SSL is REQUIRED for this database.');
    await pool.end();
    process.exit(1);
  }
}

testConnection();
