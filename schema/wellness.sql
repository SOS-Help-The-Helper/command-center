-- Wellness Check-ins Table for Baby G
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/rtduqguwhkczexnoawej/sql

CREATE TABLE IF NOT EXISTS wellness_checkins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    checkin_type text NOT NULL CHECK (checkin_type IN ('morning', 'evening')),
    sleep_quality int CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
    energy_level int CHECK (energy_level >= 1 AND energy_level <= 5),
    mood int CHECK (mood >= 1 AND mood <= 5),
    symptoms jsonb DEFAULT '[]'::jsonb,
    notes text,
    ai_response text
);

-- Enable Row Level Security (optional - can add later for multi-user)
-- ALTER TABLE wellness_checkins ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous access (for now, single user)
-- This allows the anon key to insert and read
CREATE POLICY "Allow anonymous insert" ON wellness_checkins
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON wellness_checkins
    FOR SELECT TO anon
    USING (true);

-- Index for faster history queries
CREATE INDEX IF NOT EXISTS idx_wellness_checkins_created_at 
    ON wellness_checkins (created_at DESC);
