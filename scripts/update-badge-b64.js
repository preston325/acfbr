const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/acfbr',
});

/**
 * Fetches an image from a URL and converts it to base64
 */
async function fetchImageAsBase64(url) {
  try {
    if (!url || url.trim() === '') {
      return null;
    }

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ACFBR/1.0)',
      },
    });

    const contentType = response.headers['content-type'] || 'image/png';
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    
    // Return data URI format: data:image/png;base64,...
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`Failed to fetch image from ${url}:`, error.message);
    return null;
  }
}

/**
 * Adds the str_badge_b64 column if it doesn't exist
 */
async function addColumnIfNotExists() {
  try {
    console.log('Adding str_badge_b64 column if it doesn\'t exist...');
    await pool.query(`
      ALTER TABLE teams_ncaa_d1_football 
      ADD COLUMN IF NOT EXISTS str_badge_b64 TEXT;
    `);
    console.log('Column added successfully!');
  } catch (error) {
    console.error('Failed to add column:', error);
    throw error;
  }
}

/**
 * Updates all teams with base64 encoded badge images
 */
async function updateBadgeImages() {
  try {
    // Get all teams with badge URLs
    const result = await pool.query(`
      SELECT id, id_team, str_team, str_badge 
      FROM teams_ncaa_d1_football 
      WHERE str_badge IS NOT NULL 
        AND str_badge != ''
        AND (str_badge_b64 IS NULL OR str_badge_b64 = '')
      ORDER BY id
    `);

    const teams = result.rows;
    console.log(`Found ${teams.length} teams to update...`);

    let successCount = 0;
    let failCount = 0;

    // Process teams in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < teams.length; i += batchSize) {
      const batch = teams.slice(i, i + batchSize);
      
      // Process batch in parallel
      const promises = batch.map(async (team) => {
        try {
          console.log(`Processing ${team.str_team} (${team.id_team})...`);
          const base64 = await fetchImageAsBase64(team.str_badge);
          
          if (base64) {
            await pool.query(
              'UPDATE teams_ncaa_d1_football SET str_badge_b64 = $1 WHERE id = $2',
              [base64, team.id]
            );
            console.log(`✓ Updated ${team.str_team}`);
            successCount++;
          } else {
            console.log(`✗ Failed to fetch image for ${team.str_team}`);
            failCount++;
          }
        } catch (error) {
          console.error(`Error processing ${team.str_team}:`, error.message);
          failCount++;
        }
      });

      await Promise.all(promises);
      
      // Small delay between batches to be respectful to the server
      if (i + batchSize < teams.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n=== Update Summary ===');
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Total processed: ${teams.length}`);
  } catch (error) {
    console.error('Failed to update badge images:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting badge base64 update process...\n');
    
    await addColumnIfNotExists();
    console.log('');
    
    await updateBadgeImages();
    
    console.log('\nBadge base64 update completed successfully!');
  } catch (error) {
    console.error('Process failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
