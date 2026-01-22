/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:Snoqualmie2015%21@tdpllc-1.cqgd5zbaiuii.us-west-2.rds.amazonaws.com:5432/acfbr?sslmode=require',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    SPORTSDB_API_KEY: process.env.SPORTSDB_API_KEY || '428457',
  },
}

module.exports = nextConfig
