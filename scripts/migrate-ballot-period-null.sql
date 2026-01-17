-- Migration script to allow NULL ballot_period_id in ballots table
-- This allows saving in-progress ballots without a specific ballot period

-- Drop the existing NOT NULL constraint on ballot_period_id
ALTER TABLE ballots ALTER COLUMN ballot_period_id DROP NOT NULL;

-- Note: The UNIQUE constraint (user_id, ballot_period_id, ballot_type_id) will still work
-- because PostgreSQL treats NULL values as distinct in UNIQUE constraints,
-- allowing multiple rows with the same user_id and ballot_type_id when ballot_period_id is NULL
