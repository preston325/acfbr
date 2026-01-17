const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/acfbr',
});

async function migrateTeams() {
  try {
    console.log('Starting teams migration...');

    // Step 1: Drop foreign key constraint from ballot_rankings
    console.log('Dropping foreign key constraint...');
    await pool.query(`
      ALTER TABLE IF EXISTS ballot_rankings 
      DROP CONSTRAINT IF EXISTS ballot_rankings_team_id_fkey;
    `);

    // Step 2: Drop the teams table
    console.log('Dropping teams table...');
    await pool.query('DROP TABLE IF EXISTS teams CASCADE;');

    // Step 3: Create teams_ncaa_d1_football table
    console.log('Creating teams_ncaa_d1_football table...');
    await pool.query(`
      CREATE TABLE teams_ncaa_d1_football (
        id SERIAL PRIMARY KEY,
        id_team VARCHAR(255) UNIQUE NOT NULL,
        str_team VARCHAR(255) NOT NULL,
        str_team_short VARCHAR(50),
        str_colour1 VARCHAR(50),
        str_colour2 VARCHAR(50),
        str_colour3 VARCHAR(50),
        id_league VARCHAR(255),
        str_league VARCHAR(255),
        str_badge TEXT,
        str_logo TEXT,
        str_banner TEXT,
        str_fanart1 TEXT,
        str_equipment TEXT,
        str_country VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Step 4: Create index on id_team for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_teams_ncaa_d1_football_id_team ON teams_ncaa_d1_football(id_team);
    `);

    // Step 5: Create trigger for updated_at
    await pool.query(`
      CREATE TRIGGER update_teams_ncaa_d1_football_updated_at BEFORE UPDATE ON teams_ncaa_d1_football
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Step 6: Recreate foreign key constraint pointing to new table
    console.log('Recreating foreign key constraint...');
    await pool.query(`
      ALTER TABLE ballot_rankings 
      ADD CONSTRAINT ballot_rankings_team_id_fkey 
      FOREIGN KEY (team_id) REFERENCES teams_ncaa_d1_football(id) ON DELETE CASCADE;
    `);

    // Step 7: Load and insert data from JSON file
    console.log('Loading teams data from JSON file...');
    const jsonPath = path.join(__dirname, '../teams_ncaa_d1_football.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const teams = jsonData.list || [];

    console.log(`Found ${teams.length} teams to insert...`);

    // Insert teams in batches for better performance
    const batchSize = 100;
    for (let i = 0; i < teams.length; i += batchSize) {
      const batch = teams.slice(i, i + batchSize);
      const placeholders = [];
      const params = [];

      batch.forEach((team, index) => {
        const offset = index * 14;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14})`
        );
        params.push(
          team.idTeam || null,
          team.strTeam || null,
          team.strTeamShort || null,
          team.strColour1 || null,
          team.strColour2 || null,
          team.strColour3 || null,
          team.idLeague || null,
          team.strLeague || null,
          team.strBadge || null,
          team.strLogo || null,
          team.strBanner || null,
          team.strFanart1 || null,
          team.strEquipment || null,
          team.strCountry || null
        );
      });

      await pool.query(
        `INSERT INTO teams_ncaa_d1_football (
          id_team, str_team, str_team_short, str_colour1, str_colour2, str_colour3,
          id_league, str_league, str_badge, str_logo, str_banner, str_fanart1,
          str_equipment, str_country
        ) VALUES ${placeholders.join(', ')}
        ON CONFLICT (id_team) DO NOTHING`,
        params
      );

      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(teams.length / batchSize)}`);
    }

    console.log('Teams migration completed successfully!');
    console.log(`Total teams inserted: ${teams.length}`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateTeams()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
