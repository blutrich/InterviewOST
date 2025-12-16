-- Discovery Co-Pilot Database Schema
-- Based on Teresa Torres' Continuous Discovery Framework

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES (extends Supabase Auth)
-- ============================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INTERVIEW PROJECTS
-- ============================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  research_goals TEXT NOT NULL,          -- Becomes context for Planner agent
  target_audience TEXT,
  desired_outcome TEXT,                   -- Root node of Opportunity Tree
  model TEXT DEFAULT 'anthropic/claude-sonnet-4-20250514',
  settings JSONB DEFAULT '{"max_duration": 15, "tone": "professional"}',
  status TEXT DEFAULT 'draft',            -- draft, active, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INTERVIEW TEMPLATES (Story-Based Rubrics)
-- ============================================

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE,
  name TEXT NOT NULL,
  version INT DEFAULT 1,
  rubric JSONB NOT NULL,                  -- {introduction, topics[], questions[], closing}
  -- Questions use "Tell me about a time..." format (Teresa Torres method)
  status TEXT DEFAULT 'draft',            -- draft, pending_review, approved
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- ============================================
-- INTERVIEW SESSIONS
-- ============================================

CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates ON DELETE CASCADE,
  project_id UUID REFERENCES projects ON DELETE CASCADE,
  access_token TEXT UNIQUE NOT NULL,      -- For public participant access
  participant_name TEXT,
  status TEXT DEFAULT 'pending',          -- pending, active, completed, abandoned
  transcript JSONB,                       -- Full conversation history
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INTERVIEW MESSAGES (Real-time Sync)
-- ============================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES interviews ON DELETE CASCADE,
  role TEXT NOT NULL,                     -- assistant, user
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INTERVIEW SNAPSHOTS (Teresa Torres Framework)
-- Structured output from each interview
-- ============================================

CREATE TABLE snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES interviews ON DELETE CASCADE UNIQUE,

  -- Experience Map: Timeline of the user's story
  -- [{step: 1, action: "...", feeling: "...", timestamp: "..."}]
  experience_map JSONB,

  -- Quote Reel: Top 3-5 emotional quotes
  -- [{quote: "...", context: "...", emotion: "...", message_id: "..."}]
  quote_reel JSONB,

  -- Facts Extracted (separated from synthesis)
  -- {role: "...", tools: [...], frequency: "...", context: "..."}
  facts JSONB,

  -- Blind Spots: What we missed
  -- [{observation: "...", suggestion: "...", severity: "low|medium|high"}]
  blind_spots JSONB,

  -- Human validation
  status TEXT DEFAULT 'pending',          -- pending, approved, rejected
  human_notes TEXT,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OPPORTUNITY SOLUTION TREE (OST)
-- Hierarchical structure for opportunities
-- ============================================

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE,
  parent_id UUID REFERENCES opportunities, -- For tree hierarchy (NULL = root)

  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'opportunity',        -- 'outcome', 'opportunity', 'solution'

  -- Prioritization data
  evidence_count INT DEFAULT 0,           -- How many interviews mention this

  -- Human validation
  status TEXT DEFAULT 'suggested',        -- 'suggested', 'approved', 'rejected', 'merged'

  -- React Flow positioning
  position JSONB DEFAULT '{"x": 0, "y": 0}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVIDENCE (Links quotes to opportunities)
-- ============================================

CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities ON DELETE CASCADE,
  snapshot_id UUID REFERENCES snapshots ON DELETE CASCADE,
  interview_id UUID REFERENCES interviews ON DELETE CASCADE,

  quote TEXT NOT NULL,
  context TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKFLOW SNAPSHOTS (Mastra suspend/resume)
-- ============================================

CREATE TABLE workflow_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  run_id TEXT UNIQUE NOT NULL,
  snapshot JSONB NOT NULL,
  status TEXT DEFAULT 'running',          -- running, suspended, completed, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_templates_project_id ON templates(project_id);
CREATE INDEX idx_interviews_project_id ON interviews(project_id);
CREATE INDEX idx_interviews_access_token ON interviews(access_token);
CREATE INDEX idx_messages_interview_id ON messages(interview_id);
CREATE INDEX idx_snapshots_interview_id ON snapshots(interview_id);
CREATE INDEX idx_opportunities_project_id ON opportunities(project_id);
CREATE INDEX idx_opportunities_parent_id ON opportunities(parent_id);
CREATE INDEX idx_evidence_opportunity_id ON evidence(opportunity_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

-- Users manage their own profile
CREATE POLICY "Users manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Users manage their own projects
CREATE POLICY "Users manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Users manage templates for their projects
CREATE POLICY "Users manage own templates" ON templates
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Users can see interviews for their projects
CREATE POLICY "Users manage own interviews" ON interviews
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Participants can access interviews via token (public read)
CREATE POLICY "Public interview access by token" ON interviews
  FOR SELECT USING (status IN ('pending', 'active'));

-- Anyone can read messages for active interviews
CREATE POLICY "Public message read for active interviews" ON messages
  FOR SELECT USING (
    interview_id IN (SELECT id FROM interviews WHERE status = 'active')
  );

-- Anyone can insert messages to active interviews
CREATE POLICY "Public message insert for active interviews" ON messages
  FOR INSERT WITH CHECK (
    interview_id IN (SELECT id FROM interviews WHERE status = 'active')
  );

-- Users manage snapshots for their projects
CREATE POLICY "Users manage own snapshots" ON snapshots
  FOR ALL USING (
    interview_id IN (
      SELECT id FROM interviews WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

-- Users manage opportunities for their projects
CREATE POLICY "Users manage own opportunities" ON opportunities
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Users manage evidence for their projects
CREATE POLICY "Users manage own evidence" ON evidence
  FOR ALL USING (
    opportunity_id IN (
      SELECT id FROM opportunities WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- ENABLE REALTIME FOR MESSAGES
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update evidence_count on opportunities
CREATE OR REPLACE FUNCTION update_evidence_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE opportunities
    SET evidence_count = evidence_count + 1
    WHERE id = NEW.opportunity_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE opportunities
    SET evidence_count = evidence_count - 1
    WHERE id = OLD.opportunity_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_opportunity_evidence_count
  AFTER INSERT OR DELETE ON evidence
  FOR EACH ROW EXECUTE FUNCTION update_evidence_count();

-- Function to update project updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
