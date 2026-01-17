const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/acfbr',
});

async function migrateUsersTable() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('Starting users table migration...');

    // Check if old columns exist
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('user_type', 'podcast_followers')
    `);

    const hasOldColumns = columnCheck.rows.length > 0;
    const hasUserType = columnCheck.rows.some(row => row.column_name === 'user_type');
    const hasPodcastFollowers = columnCheck.rows.some(row => row.column_name === 'podcast_followers');

    // Check if new columns exist
    const newColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('user_type_id', 'followers')
    `);

    const hasUserTypeId = newColumnCheck.rows.some(row => row.column_name === 'user_type_id');
    const hasFollowers = newColumnCheck.rows.some(row => row.column_name === 'followers');

    // Ensure user_type table has the correct entry
    await client.query(`
      INSERT INTO user_type (user_type) VALUES 
        ('college football coach or staff')
      ON CONFLICT (user_type) DO NOTHING
    `);

    // Add new columns if they don't exist
    if (!hasUserTypeId) {
      console.log('Adding user_type_id column...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN user_type_id INTEGER REFERENCES user_type(id)
      `);
    }

    if (!hasFollowers) {
      console.log('Adding followers column...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN followers VARCHAR(255)
      `);
    }

    // Migrate data from old columns to new columns if old columns exist
    if (hasOldColumns) {
      console.log('Migrating data from old columns to new columns...');

      if (hasUserType && !hasUserTypeId) {
        // Migrate user_type string to user_type_id
        await client.query(`
          UPDATE users u
          SET user_type_id = ut.id
          FROM user_type ut
          WHERE u.user_type = ut.user_type
          AND u.user_type_id IS NULL
        `);
        console.log('Migrated user_type to user_type_id');
      }

      if (hasPodcastFollowers && !hasFollowers) {
        // Migrate podcast_followers to followers
        await client.query(`
          UPDATE users
          SET followers = podcast_followers
          WHERE followers IS NULL AND podcast_followers IS NOT NULL
        `);
        console.log('Migrated podcast_followers to followers');
      }
    }

    // Drop old columns if they exist
    if (hasUserType) {
      console.log('Dropping old user_type column...');
      await client.query(`
        ALTER TABLE users 
        DROP COLUMN IF EXISTS user_type
      `);
    }

    if (hasPodcastFollowers) {
      console.log('Dropping old podcast_followers column...');
      await client.query(`
        ALTER TABLE users 
        DROP COLUMN IF EXISTS podcast_followers
      `);
    }

    await client.query('COMMIT');
    console.log('Users table migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateUsersTable()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
