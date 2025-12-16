-- Migration: 002_fix_schema_integrity.sql
-- Purpose: Fix data integrity issues for multi-interview → single OST architecture
--
-- Data Flow:
-- ONE PROJECT → MANY INTERVIEWS → ONE OST (Opportunity Solution Tree)
-- Evidence from all interviews accumulates on shared opportunities

-- ============================================
-- 1. AUTO-CREATE ROOT OPPORTUNITY ON PROJECT INSERT
-- ============================================
-- Problem: project.desired_outcome is just a string, not part of the tree
-- Fix: Automatically create a root opportunity node when a project is created

CREATE OR REPLACE FUNCTION create_root_opportunity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if desired_outcome is provided
  IF NEW.desired_outcome IS NOT NULL AND NEW.desired_outcome != '' THEN
    INSERT INTO opportunities (project_id, title, type, status, parent_id, position, evidence_count)
    VALUES (
      NEW.id,
      NEW.desired_outcome,
      'outcome',
      'approved',
      NULL,
      '{"x": 400, "y": 50}'::jsonb,
      0
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists (for re-running migration)
DROP TRIGGER IF EXISTS after_project_insert_create_root ON projects;

CREATE TRIGGER after_project_insert_create_root
AFTER INSERT ON projects
FOR EACH ROW EXECUTE FUNCTION create_root_opportunity();

-- ============================================
-- 2. VALIDATE PARENT BELONGS TO SAME PROJECT
-- ============================================
-- Problem: parent_id could reference opportunity from different project
-- Fix: Trigger validates parent is in same project

CREATE OR REPLACE FUNCTION validate_opportunity_parent()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if parent_id is set
  IF NEW.parent_id IS NOT NULL THEN
    -- Check parent exists and belongs to same project
    IF NOT EXISTS (
      SELECT 1 FROM opportunities
      WHERE id = NEW.parent_id AND project_id = NEW.project_id
    ) THEN
      RAISE EXCEPTION 'Parent opportunity must belong to the same project (project_id: %, parent_id: %)',
        NEW.project_id, NEW.parent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS before_opportunity_validate_parent ON opportunities;

CREATE TRIGGER before_opportunity_validate_parent
BEFORE INSERT OR UPDATE ON opportunities
FOR EACH ROW EXECUTE FUNCTION validate_opportunity_parent();

-- ============================================
-- 3. PREVENT SELF-REFERENCING PARENT (BASIC CYCLE CHECK)
-- ============================================
-- Problem: Opportunity could set itself as parent
-- Fix: CHECK constraint prevents id = parent_id

-- First drop if exists (for re-running)
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS no_self_parent;

ALTER TABLE opportunities
ADD CONSTRAINT no_self_parent
CHECK (id != parent_id);

-- ============================================
-- 4. EVIDENCE DEDUPLICATION
-- ============================================
-- Problem: Exact same quote could be linked multiple times to same opportunity
-- Fix: Unique index on opportunity + quote hash
-- Note: Multiple DIFFERENT quotes from same interview ARE allowed

-- Drop if exists
DROP INDEX IF EXISTS unique_quote_per_opportunity;

CREATE UNIQUE INDEX unique_quote_per_opportunity
ON evidence (opportunity_id, md5(quote));

-- ============================================
-- 5. INTERVIEW FILTER SUPPORT INDEX
-- ============================================
-- Purpose: Optimize queries filtering evidence by interview

-- Drop if exists
DROP INDEX IF EXISTS idx_evidence_interview_snapshot;

CREATE INDEX idx_evidence_interview_snapshot
ON evidence(interview_id, snapshot_id);

-- ============================================
-- 6. BACKFILL: CREATE ROOT OPPORTUNITIES FOR EXISTING PROJECTS
-- ============================================
-- For projects that already exist without a root opportunity

INSERT INTO opportunities (project_id, title, type, status, parent_id, position, evidence_count)
SELECT
  p.id,
  COALESCE(p.desired_outcome, 'Root Outcome'),
  'outcome',
  'approved',
  NULL,
  '{"x": 400, "y": 50}'::jsonb,
  0
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM opportunities o
  WHERE o.project_id = p.id AND o.type = 'outcome' AND o.parent_id IS NULL
);

-- ============================================
-- SUMMARY OF CHANGES
-- ============================================
-- 1. Root opportunity auto-created when project is created
-- 2. Parent must belong to same project (trigger enforced)
-- 3. Cannot set self as parent (CHECK constraint)
-- 4. Same quote can't be added twice to same opportunity (hash index)
-- 5. Added index for interview-based filtering
-- 6. Backfilled root opportunities for existing projects
