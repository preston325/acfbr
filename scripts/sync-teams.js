const axios = require('axios');
const { Pool } = require('pg');

const SPORTSDB_API_KEY = process.env.SPORTSDB_API_KEY || '428457';
const SPORTSDB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/acfbr',
});

async function fetchNCAAFTeams() {
  try {
    const response = await axios.get(
      `${SPORTSDB_BASE_URL}/${SPORTSDB_API_KEY}/lookup_all_teams.php?id=4479`
    );
    
    if (response.data && response.data.teams) {
      return response.data.teams;
    }
    return [];
  } catch (error) {
    console.error('Error fetching NCAAF teams:', error);
    return [];
  }
}

async function syncTeamsToDatabase() {
  const teams = await fetchNCAAFTeams();
  
  console.log(`Found ${teams.length} teams to sync...`);
  
  for (const team of teams) {
    await pool.query(
      `INSERT INTO teams (name, school_name, conference, logo_url, external_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (external_id) DO UPDATE
       SET name = EXCLUDED.name,
           school_name = EXCLUDED.school_name,
           conference = EXCLUDED.conference,
           logo_url = EXCLUDED.logo_url,
           updated_at = CURRENT_TIMESTAMP`,
      [
        team.strTeam,
        team.strSchool || team.strTeam,
        team.strConference || null,
        team.strTeamBadge || null,
        team.idTeam
      ]
    );
  }
  
  console.log('Teams synced successfully!');
}

async function main() {
  try {
    console.log('Syncing teams from TheSportsDB API...');
    await syncTeamsToDatabase();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error syncing teams:', error);
    await pool.end();
    process.exit(1);
  }
}

main();
