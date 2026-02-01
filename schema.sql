-- Henry Command Center Schema
-- Run in Supabase SQL Editor

-- Daily briefs
CREATE TABLE IF NOT EXISTS henry_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
    summary TEXT,
    highlights JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks with approve/deny
CREATE TABLE IF NOT EXISTS henry_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    denied_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE henry_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE henry_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON henry_briefs FOR ALL USING (true);
CREATE POLICY "Allow all" ON henry_tasks FOR ALL USING (true);
GRANT ALL ON henry_briefs TO anon;
GRANT ALL ON henry_tasks TO anon;

-- Sample tasks
INSERT INTO henry_tasks (title, description, category, priority, source) VALUES 
  ('Review Grunt qualified leads', 'Export and review the qualified prospects for outreach', 'reforge', 'high', 'auto'),
  ('Check SOS Supabase logs', 'Review edge function logs for any errors', 'sos', 'medium', 'auto'),
  ('Draft foundation outreach emails', 'Prepare personalized emails for top 5 foundation targets', 'sos', 'high', 'manual');
