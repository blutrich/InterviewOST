-- Migration: 003_add_user_id_to_tables.sql
-- Purpose: Add direct user_id to key tables for faster RLS and simpler queries
--
-- Best Practice: Denormalized user_id enables:
-- 1. Faster RLS policies (direct column check vs nested subquery)
-- 2. Simpler queries (WHERE user_id = auth.uid())
-- 3. Better indexing for user-based lookups
-- 4. Audit trail (know who created each record)

-- ============================================
-- 1. ADD user_id COLUMNS (nullable first for backfill)
-- ============================================

ALTER TABLE templates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;
ALTER TABLE snapshots ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;

-- ============================================
-- 2. BACKFILL EXISTING DATA
-- ============================================

-- Templates: Get user_id from parent project
UPDATE templates
SET user_id = (SELECT user_id FROM projects WHERE projects.id = templates.project_id)
WHERE user_id IS NULL;

-- Interviews: Get user_id from parent project
UPDATE interviews
SET user_id = (SELECT user_id FROM projects WHERE projects.id = interviews.project_id)
WHERE user_id IS NULL;

-- Snapshots: Get user_id through interview -> project chain
UPDATE snapshots
SET user_id = (
  SELECT p.user_id
  FROM projects p
  JOIN interviews i ON i.project_id = p.id
  WHERE i.id = snapshots.interview_id
)
WHERE user_id IS NULL;

-- Opportunities: Get user_id from parent project
UPDATE opportunities
SET user_id = (SELECT user_id FROM projects WHERE projects.id = opportunities.project_id)
WHERE user_id IS NULL;

-- Evidence: Get user_id through opportunity -> project chain
UPDATE evidence
SET user_id = (
  SELECT p.user_id
  FROM projects p
  JOIN opportunities o ON o.project_id = p.id
  WHERE o.id = evidence.opportunity_id
)
WHERE user_id IS NULL;

-- ============================================
-- 3. MAKE NOT NULL (after backfill complete)
-- ============================================
-- Note: Only set NOT NULL if there's data, otherwise skip

DO $$
BEGIN
  -- Only alter if column exists and has no nulls
  IF EXISTS (SELECT 1 FROM templates LIMIT 1) THEN
    IF NOT EXISTS (SELECT 1 FROM templates WHERE user_id IS NULL) THEN
      ALTER TABLE templates ALTER COLUMN user_id SET NOT NULL;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM interviews LIMIT 1) THEN
    IF NOT EXISTS (SELECT 1 FROM interviews WHERE user_id IS NULL) THEN
      ALTER TABLE interviews ALTER COLUMN user_id SET NOT NULL;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM snapshots LIMIT 1) THEN
    IF NOT EXISTS (SELECT 1 FROM snapshots WHERE user_id IS NULL) THEN
      ALTER TABLE snapshots ALTER COLUMN user_id SET NOT NULL;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM opportunities LIMIT 1) THEN
    IF NOT EXISTS (SELECT 1 FROM opportunities WHERE user_id IS NULL) THEN
      ALTER TABLE opportunities ALTER COLUMN user_id SET NOT NULL;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM evidence LIMIT 1) THEN
    IF NOT EXISTS (SELECT 1 FROM evidence WHERE user_id IS NULL) THEN
      ALTER TABLE evidence ALTER COLUMN user_id SET NOT NULL;
    END IF;
  END IF;
END $$;

-- ============================================
-- 4. ADD INDEXES FOR FAST USER-BASED LOOKUPS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_user_id ON evidence(user_id);

-- ============================================
-- 5. AUTO-SET user_id ON INSERT (server-side, secure)
-- ============================================

CREATE OR REPLACE FUNCTION set_user_id_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if not already provided (allows service role to set explicitly)
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers (drop first if exist for idempotency)
DROP TRIGGER IF EXISTS set_templates_user_id ON templates;
CREATE TRIGGER set_templates_user_id
BEFORE INSERT ON templates
FOR EACH ROW EXECUTE FUNCTION set_user_id_from_auth();

DROP TRIGGER IF EXISTS set_interviews_user_id ON interviews;
CREATE TRIGGER set_interviews_user_id
BEFORE INSERT ON interviews
FOR EACH ROW EXECUTE FUNCTION set_user_id_from_auth();

DROP TRIGGER IF EXISTS set_snapshots_user_id ON snapshots;
CREATE TRIGGER set_snapshots_user_id
BEFORE INSERT ON snapshots
FOR EACH ROW EXECUTE FUNCTION set_user_id_from_auth();

DROP TRIGGER IF EXISTS set_opportunities_user_id ON opportunities;
CREATE TRIGGER set_opportunities_user_id
BEFORE INSERT ON opportunities
FOR EACH ROW EXECUTE FUNCTION set_user_id_from_auth();

DROP TRIGGER IF EXISTS set_evidence_user_id ON evidence;
CREATE TRIGGER set_evidence_user_id
BEFORE INSERT ON evidence
FOR EACH ROW EXECUTE FUNCTION set_user_id_from_auth();

-- ============================================
-- 6. UPDATE RLS POLICIES (faster direct check)
-- ============================================

-- Templates: Direct user_id check
DROP POLICY IF EXISTS "Users manage own templates" ON templates;
CREATE POLICY "Users manage own templates" ON templates
FOR ALL USING (user_id = auth.uid());

-- Interviews: Direct user_id check (keep public access policy)
DROP POLICY IF EXISTS "Users manage own interviews" ON interviews;
CREATE POLICY "Users manage own interviews" ON interviews
FOR ALL USING (user_id = auth.uid());

-- Snapshots: Direct user_id check
DROP POLICY IF EXISTS "Users manage own snapshots" ON snapshots;
CREATE POLICY "Users manage own snapshots" ON snapshots
FOR ALL USING (user_id = auth.uid());

-- Opportunities: Direct user_id check
DROP POLICY IF EXISTS "Users manage own opportunities" ON opportunities;
CREATE POLICY "Users manage own opportunities" ON opportunities
FOR ALL USING (user_id = auth.uid());

-- Evidence: Direct user_id check
DROP POLICY IF EXISTS "Users manage own evidence" ON evidence;
CREATE POLICY "Users manage own evidence" ON evidence
FOR ALL USING (user_id = auth.uid());

-- ============================================
-- KEEP EXISTING PUBLIC ACCESS POLICIES
-- ============================================
-- These remain unchanged:
-- - "Public interview access by token" ON interviews
-- - "Public message read for active interviews" ON messages
-- - "Public message insert for active interviews" ON messages
