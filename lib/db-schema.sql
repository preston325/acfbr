-- Create user_types table
CREATE TABLE IF NOT EXISTS user_types (
  id SERIAL PRIMARY KEY,
  user_type VARCHAR(255) UNIQUE NOT NULL
);

-- Insert predefined user types
INSERT INTO user_types (user_type) VALUES 
  ('College Football Fan'),  
  ('College Football Podcaster'),
  ('Sports Media Personality (Newspaper, Magazine, Website)'),
  ('Sports Broadcaster (Radio, TV)')
ON CONFLICT (user_type) DO NOTHING;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified_y_n CHAR(1) CHECK (email_verified_y_n IN ('Y', 'N')),
  email_verification_token VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expires_at TIMESTAMPTZ
);

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
  str_logo TEXT,
  str_banner TEXT,
  str_fanart1 TEXT,
  str_equipment TEXT,
  str_country VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	str_badge_b64 TEXT NULL
);

-- Create social_media_types table
CREATE TABLE IF NOT EXISTS social_media_types (
  id SERIAL PRIMARY KEY,
  social_media_type VARCHAR(255) UNIQUE NOT NULL
);

-- Insert predefined social media types
INSERT INTO social_media_types (social_media_type) VALUES 
  ('Twitter'),
  ('Instagram'),
  ('YouTube'),
  ('TikTok'),
  ('Facebook'),
  ('LinkedIn'),
  ('Snapchat'),
  ('Pinterest'),
  ('Reddit'),
  ('Discord'),
  ('Telegram'),
  ('Other')
ON CONFLICT (social_media_type) DO NOTHING;

-- Create social_media_handles table
CREATE TABLE IF NOT EXISTS social_media_handles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  social_media_type_id INTEGER NOT NULL REFERENCES social_media_types(id) ON DELETE CASCADE,
  handle VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- social_media_handles indexes
CREATE INDEX IF NOT EXISTS idx_social_media_handles_user_id ON social_media_handles(user_id);
CREATE INDEX IF NOT EXISTS idx_social_media_handles_social_media_type_id ON social_media_handles(social_media_type_id);

-- Create user_account table
CREATE TABLE IF NOT EXISTS user_account (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  favorite_team_id INTEGER REFERENCES teams_ncaa_d1_football(id),
  podcast_y_n CHAR(1) CHECK (podcast_y_n IN ('Y', 'N')),
  podcast_url VARCHAR(255),
  podcast_followers INTEGER,
  podcast_verified_y_n CHAR(1) CHECK (podcast_verified_y_n IN ('Y', 'N')),
  sports_media_y_n CHAR(1) CHECK (sports_media_y_n IN ('Y', 'N')),
  sports_media_url VARCHAR(255),
  sports_media_verified_y_n CHAR(1) CHECK (sports_media_verified_y_n IN ('Y', 'N')),
  sports_broadcast_y_n CHAR(1) CHECK (sports_broadcast_y_n IN ('Y', 'N')),
  sports_broadcast_url VARCHAR(255),
  sports_broadcast_verified_y_n CHAR(1) CHECK (sports_broadcast_verified_y_n IN ('Y', 'N')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- user_account indexes
CREATE INDEX IF NOT EXISTS idx_user_account_favorite_team_id ON user_account(favorite_team_id);

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

-- Create ballot_periods table (schedule for poll open/close times per week/year)
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

-- ballot_periods indexes
CREATE INDEX IF NOT EXISTS idx_ballot_periods_season ON ballot_periods(season);

-- Create ballots table (one per user per week)
CREATE TABLE IF NOT EXISTS ballots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ballot_period_id INTEGER REFERENCES ballot_periods(id) ON DELETE CASCADE,
  ballot_type_id INTEGER NOT NULL REFERENCES ballot_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ballot_period_id, ballot_type_id)
);

-- ballots indexes
CREATE INDEX IF NOT EXISTS idx_ballots_user_id ON ballots(user_id);
CREATE INDEX IF NOT EXISTS idx_ballots_ballot_period_id ON ballots(ballot_period_id);
CREATE INDEX IF NOT EXISTS idx_ballots_ballot_type_id ON ballots(ballot_type_id);

-- Create ballot_rankings table (individual team rankings within a ballot)
CREATE TABLE IF NOT EXISTS ballot_rankings (
  id SERIAL PRIMARY KEY,
  ballot_id INTEGER NOT NULL REFERENCES ballots(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams_ncaa_d1_football(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 25),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ballot_id, team_id, rank)
);

-- ballot_rankings indexes
CREATE INDEX IF NOT EXISTS idx_ballot_rankings_ballot_id ON ballot_rankings(ballot_id);
CREATE INDEX IF NOT EXISTS idx_ballot_rankings_team_id ON ballot_rankings(team_id);

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

DROP TRIGGER IF EXISTS update_ballots_updated_at ON ballots;
CREATE TRIGGER update_ballots_updated_at BEFORE UPDATE ON ballots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ballot_rankings_updated_at ON ballot_rankings;
CREATE TRIGGER update_ballot_rankings_updated_at BEFORE UPDATE ON ballot_rankings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

