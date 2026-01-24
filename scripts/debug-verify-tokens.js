#!/usr/bin/env node

const { Pool } = require('pg');

// Support both DATABASE_URL and individual DB environment variables (for ECS)
function getConnectionString() {
  // If DATABASE_URL is set, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Otherwise, construct from individual environment variables (for ECS)
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) {
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT || '5432';
    const user = encodeURIComponent(process.env.DB_USER);
    const password = encodeURIComponent(process.env.DB_PASSWORD);
    const database = process.env.DB_NAME;
    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }
  
  // Fallback to default (for local development)
  return 'postgresql://postgres:Snoqualmie2015%21@tdpllc-1.cqgd5zbaiuii.us-west-2.rds.amazonaws.com:5432/acfbr';
}

// Remove sslmode from connection string to handle SSL via Pool options
function cleanConnectionString(connString) {
  return connString.replace(/[?&]sslmode=[^&]*/g, '').replace(/[?&]uselibpqcompat=[^&]*/g, '');
}

const rawConnectionString = getConnectionString();
const connectionString = cleanConnectionString(rawConnectionString);

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for RDS - it uses self-signed certificates
  }
});

async function debugVerificationTokens() {
  try {
    console.log('🔍 Debugging email verification tokens...\n');
    
    // Check total users
    const totalUsersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    console.log(`📊 Total users in database: ${totalUsersResult.rows[0].total}`);
    
    // Check users with verification tokens
    const tokensResult = await pool.query(`
      SELECT 
        id, 
        name, 
        email, 
        email_verified_y_n,
        LENGTH(email_verification_token) as token_length,
        LEFT(email_verification_token, 10) || '...' as token_preview,
        created_at
      FROM users 
      WHERE email_verification_token IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`📝 Users with pending verification tokens: ${tokensResult.rows.length}`);
    
    if (tokensResult.rows.length > 0) {
      console.log('\n📋 Recent unverified users:');
      tokensResult.rows.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email})`);
        console.log(`     Token: ${user.token_preview} (${user.token_length} chars)`);
        console.log(`     Created: ${user.created_at}`);
        console.log(`     Verified: ${user.email_verified_y_n}`);
        console.log('');
      });
    }
    
    // Check if the specific token exists
    const specificToken = 'faa458866a4f8bebc06d9b9998dea0ce10c3e9a3fe5a7b9b928ba240750516d6';
    console.log(`🔎 Checking for specific token: ${specificToken.substring(0, 10)}...`);
    
    const specificResult = await pool.query(
      'SELECT id, name, email, email_verified_y_n, created_at FROM users WHERE email_verification_token = $1',
      [specificToken]
    );
    
    if (specificResult.rows.length > 0) {
      const user = specificResult.rows[0];
      console.log(`✅ Token found! User: ${user.name} (${user.email})`);
      console.log(`   Verified: ${user.email_verified_y_n}`);
      console.log(`   Created: ${user.created_at}`);
    } else {
      console.log('❌ Specific token not found in database');
    }
    
    // Check verified users count
    const verifiedResult = await pool.query(`
      SELECT COUNT(*) as verified_count 
      FROM users 
      WHERE email_verified_y_n = 'Y'
    `);
    console.log(`\n✅ Verified users: ${verifiedResult.rows[0].verified_count}`);
    
    // Check unverified users count
    const unverifiedResult = await pool.query(`
      SELECT COUNT(*) as unverified_count 
      FROM users 
      WHERE email_verified_y_n = 'N'
    `);
    console.log(`⏳ Unverified users: ${unverifiedResult.rows[0].unverified_count}`);
    
  } catch (error) {
    console.error('❌ Error debugging verification tokens:', error);
  } finally {
    await pool.end();
  }
}

debugVerificationTokens();