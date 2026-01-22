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
    return `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=require`;
  }
  
  // Fallback to default (for local development)
  return 'postgresql://postgres:Snoqualmie2015%21@tdpllc-1.cqgd5zbaiuii.us-west-2.rds.amazonaws.com:5432/acfbr?sslmode=require';
}

const connectionString = getConnectionString();

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for RDS - it uses self-signed certificates
  }
});

export default pool;
