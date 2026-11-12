-- Migration: 010_close_public_interview_access.sql
-- Purpose: Stop exposing interviews and transcripts to anyone holding the anon key.
--
-- The participant page (/i/[token]) used to query `interviews` and `messages`
-- directly from the browser, which required policies open to the `anon` role.
-- Those policies let any visitor list every pending/active interview (including
-- its access_token) and read every active/completed transcript.
--
-- The page now goes through /api/interviews/session and /api/chat, which
-- validate the access token server-side with the service role.
--
-- APPLY ONLY AFTER the app version that uses /api/interviews/session is deployed.

-- ============================================
-- 1. DROP ANON-FACING TABLE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Public interview access by token" ON public.interviews;
DROP POLICY IF EXISTS "Public message read for active and completed interviews" ON public.messages;
DROP POLICY IF EXISTS "Public message insert for active interviews" ON public.messages;

-- ============================================
-- 2. LOCK DOWN SECURITY DEFINER HELPERS
-- ============================================
-- Supabase grants EXECUTE to `anon` by default; revoking from PUBLIC alone is not enough.

-- Resolves an account id from an email: signed-in users only (no email enumeration).
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_project_members(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_project_members(uuid) TO authenticated;

-- Bumps evidence_count on any opportunity: signed-in users only.
REVOKE EXECUTE ON FUNCTION public.increment_evidence_count(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_evidence_count(uuid) TO authenticated;
