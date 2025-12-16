-- Migration: 004_security_fixes.sql
-- Purpose: Enable RLS on mastra tables & fix function search_path
--
-- Security Issues Fixed:
-- 1. CRITICAL: 9 tables without RLS (mastra_* and workflow_snapshots)
-- 2. WARNING: 6 functions missing search_path setting

-- ============================================
-- 1. ENABLE RLS ON MASTRA TABLES
-- ============================================
-- These are internal Mastra framework tables used for:
-- - Agent execution tracking (runs, traces, spans)
-- - Message storage (threads, messages)
-- - Workflow state (syncs, evals, snapshots)
--
-- Strategy: Enable RLS with service-role-only access
-- This blocks anon/authenticated users but allows server-side operations

ALTER TABLE mastra_ai_spans ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastra_evals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastra_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastra_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastra_scorers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastra_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastra_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastra_workflow_snapshot ENABLE ROW LEVEL SECURITY;

-- Service role bypass policies (internal tables only accessed from server)
CREATE POLICY "Service role full access" ON mastra_ai_spans
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON mastra_evals
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON mastra_messages
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON mastra_resources
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON mastra_scorers
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON mastra_threads
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON mastra_traces
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON mastra_workflow_snapshot
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Also enable RLS on workflow_snapshots (separate table)
ALTER TABLE workflow_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON workflow_snapshots
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- 2. FIX FUNCTION SEARCH_PATH
-- ============================================
-- Adding SET search_path = public, pg_temp prevents:
-- - Search path injection attacks
-- - Unintended schema resolution
-- Note: graphql and graphql_subscription are Supabase internal functions, not ours to modify

CREATE OR REPLACE FUNCTION create_root_opportunity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.desired_outcome IS NOT NULL AND NEW.desired_outcome != '' THEN
    INSERT INTO opportunities (project_id, title, type, status, parent_id, position, evidence_count, user_id)
    VALUES (NEW.id, NEW.desired_outcome, 'outcome', 'approved', NULL, '{"x": 400, "y": 50}'::jsonb, 0, NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_user_id_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validate_opportunity_parent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM opportunities WHERE id = NEW.parent_id AND project_id = NEW.project_id) THEN
      RAISE EXCEPTION 'Parent must belong to same project';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_self_reference_parent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'Cannot be own parent';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_root_opportunity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.desired_outcome IS DISTINCT FROM NEW.desired_outcome THEN
    UPDATE opportunities
    SET title = NEW.desired_outcome
    WHERE project_id = NEW.id AND type = 'outcome' AND parent_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Additional functions that needed search_path fix
CREATE OR REPLACE FUNCTION increment_evidence_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE opportunities
  SET evidence_count = evidence_count + 1
  WHERE id = NEW.opportunity_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION increment_evidence_count(opportunity_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE opportunities
  SET evidence_count = COALESCE(evidence_count, 0) + 1
  WHERE id = opportunity_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_evidence_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE opportunities
    SET evidence_count = evidence_count - 1
    WHERE id = OLD.opportunity_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_set_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at = COALESCE(NEW.created_at, NOW());
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;
