const { Pool } = require('pg');

// Test database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Snoqualmie2015%21@tdpllc-1.cqgd5zbaiuii.us-west-2.rds.amazonaws.com:5432/acfbr?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for RDS - it uses self-signed certificates
  }
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Connection string (password hidden):', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'Using fallback');
    
    const client = await pool.connect();
    console.log('✓ Successfully connected to database!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✓ Database query successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✓ Users table exists');
      
      // Check table structure
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);
      console.log('Users table columns:', columns.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    } else {
      console.log('✗ Users table does NOT exist - you may need to run migrations');
    }
    
    client.release();
    await pool.end();
    console.log('\n✓ Database connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Database connection failed!');
    console.error('Error details:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Full error:', error);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
