-- Migration: 008_recommendation_owner.sql
-- Purpose: Attach a human owner to each recommendation so it can be
--          assigned, tracked, and (later) emailed.
--
-- Email-based for now to keep the UI simple; future iterations may
-- swap this for a user_id reference + lookup against auth.users.

alter table public.recommendations
  add column if not exists owner_email       text,
  add column if not exists owner_assigned_at timestamptz,
  add column if not exists owner_assigned_by uuid references auth.users(id);

-- Index for "show all my assigned recommendations" queries down the road.
create index if not exists idx_recommendations_owner_email
  on public.recommendations (owner_email)
  where owner_email is not null;
