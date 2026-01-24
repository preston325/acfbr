import { Pool } from 'pg';

// Support both DATABASE_URL and individual DB environment variables (for ECS)
function getConnectionString(): string {
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
function cleanConnectionString(connString: string): string {
  return connString.replace(/[?&]sslmode=[^&]*/g, '').replace(/[?&]uselibpqcompat=[^&]*/g, '');
}

const rawConnectionString = getConnectionString();
const connectionString = cleanConnectionString(rawConnectionString);

// For RDS, we need to accept self-signed certificates
// Handle SSL configuration explicitly via Pool options (not connection string)
// Also set NODE_TLS_REJECT_UNAUTHORIZED=0 in environment as additional safeguard
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for RDS - it uses self-signed certificates
  }
});

// Test connection on startup
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
