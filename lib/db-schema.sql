-- ============================================================================
-- ACFBR Database Schema
-- ============================================================================
-- This file contains the complete database schema for the ACFBR application.
-- It includes tables, indexes, triggers, and functions.
-- 
-- Tables:
--   - user_type: Predefined user types (fan, podcaster, coach/staff)
--   - users: User accounts with authentication
--   - user_account: Extended user profile information
--   - teams_ncaa_d1_football: NCAA Division 1 football teams
--   - ballots: User ballots submitted per week/season
--   - ballot_rankings: Individual team rankings within ballots
--   - ballot_casting_schedule: Schedule for when polls open and close per week/year
-- ============================================================================

-- Create user_type table
CREATE TABLE IF NOT EXISTS user_type (
  id SERIAL PRIMARY KEY,
  user_type VARCHAR(255) UNIQUE NOT NULL
);

-- Insert predefined user types
INSERT INTO user_type (user_type) VALUES 
  ('College Football Fan'),
  ('College Football Podcaster'),
  ('College Football Coach or Staff')
ON CONFLICT (user_type) DO NOTHING;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified_y_n CHAR(1) CHECK (email_verified_y_n IN ('Y', 'N')),
  email_verification_token VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_account table
CREATE TABLE IF NOT EXISTS user_account (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  user_type_id INTEGER REFERENCES user_type(id),
  favorite_team_id INTEGER REFERENCES teams_ncaa_d1_football(id),
  podcast_y_n CHAR(1) CHECK (podcast_y_n IN ('Y', 'N')),
  podcast_name VARCHAR(255),
  podcast_url VARCHAR(255),
  podcast_followers INTEGER,
  podcast_verified_y_n CHAR(1) CHECK (podcast_verified_y_n IN ('Y', 'N')),
  podcast_verified_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user_account table
CREATE INDEX IF NOT EXISTS idx_user_account_user_type ON user_account(user_type_id);
CREATE INDEX IF NOT EXISTS idx_user_account_favorite_team ON user_account(favorite_team_id);

-- Create teams_ncaa_d1_football table
CREATE TABLE IF NOT EXISTS teams_ncaa_d1_football (
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
  str_badge_b64 TEXT,
  str_logo TEXT,
  str_banner TEXT,
  str_fanart1 TEXT,
  str_equipment TEXT,
  str_country VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on id_team for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_ncaa_d1_football_id_team ON teams_ncaa_d1_football(id_team);

-- Create ballots table (one per user per week)
CREATE TABLE IF NOT EXISTS ballots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ballot_period_id INTEGER REFERENCES ballot_periods(id) ON DELETE CASCADE,
  ballot_type_id INTEGER NOT NULL REFERENCES ballot_types(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ballot_period_id, ballot_type_id)
);

-- Create ballot_types table (predefined ballot types)
CREATE TABLE IF NOT EXISTS ballot_types (
  id SERIAL PRIMARY KEY,
  ballot_type VARCHAR(255) UNIQUE NOT NULL
);

-- Insert predefined ballot types
INSERT INTO ballot_types (ballot_type) VALUES 
  ('in-progress'),
  ('final')
  ON CONFLICT (ballot_type) DO NOTHING;

-- Create ballot_rankings table (individual team rankings within a ballot)
CREATE TABLE IF NOT EXISTS ballot_rankings (
  id SERIAL PRIMARY KEY,
  ballot_id INTEGER NOT NULL REFERENCES ballots(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams_ncaa_d1_football(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 25),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ballot_id, team_id, rank)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ballot_rankings_ballot_team_rank ON ballot_rankings(ballot_id, team_id, rank);

-- Create ballot_periods table (schedule for poll open/close times per week/year)
-- All timestamps are stored in Mountain Time (America/Denver)
CREATE TABLE IF NOT EXISTS ballot_periods (
  id SERIAL PRIMARY KEY,
  season VARCHAR(50) NOT NULL,
  period INTEGER NOT NULL,
  period_name VARCHAR(255) NOT NULL,
  period_beg_dt TIMESTAMPTZ NOT NULL,
  period_end_dt TIMESTAMPTZ NOT NULL,
  poll_open_dt TIMESTAMPTZ NOT NULL,
  poll_close_dt TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(season, period)
);

-- Create indexes for ballot_casting_schedule table
CREATE INDEX IF NOT EXISTS idx_ballot_periods_season_period ON ballot_periods(season, period);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_ncaa_d1_football_updated_at ON teams_ncaa_d1_football;
CREATE TRIGGER update_teams_ncaa_d1_football_updated_at BEFORE UPDATE ON teams_ncaa_d1_football
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_account_updated_at ON user_account;
CREATE TRIGGER update_user_account_updated_at BEFORE UPDATE ON user_account
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ballot_periods_updated_at ON ballot_periods;
CREATE TRIGGER update_ballot_periods_updated_at BEFORE UPDATE ON ballot_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
