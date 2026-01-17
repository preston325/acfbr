const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/acfbr',
});

async function migrate() {
  try {
    console.log('Adding email_verification_token column to users table...');

    // Check if column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='email_verification_token'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('Column email_verification_token already exists. Skipping migration.');
      await pool.end();
      return;
    }

    // Add the column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN email_verification_token VARCHAR(255)
    `);

    console.log('✓ Successfully added email_verification_token column to users table');

    // Set default value for existing users who don't have email_verified_y_n set
    await pool.query(`
      UPDATE users 
      SET email_verified_y_n = 'N' 
      WHERE email_verified_y_n IS NULL
    `);

    console.log('✓ Updated existing users to have email_verified_y_n = "N"');

    await pool.end();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();
