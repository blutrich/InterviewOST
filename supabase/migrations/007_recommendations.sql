-- Migration: 007_recommendations.sql
-- Purpose: Add a "recommendations" table for the Solution Recommendations feature.
--
-- The Recommender agent generates 4 product recommendations per theme
-- (top-level opportunity) covering different risk/innovation tiers:
--   solid | bold | moonshot | standalone
--
-- Human-in-the-loop status pattern mirrors snapshots/opportunities:
--   pending -> approved | rejected

-- ============================================================
-- 1. Table
-- ============================================================

create table if not exists public.recommendations (
  id              uuid primary key default gen_random_uuid(),

  project_id      uuid not null references public.projects(id) on delete cascade,
  opportunity_id  uuid not null references public.opportunities(id) on delete cascade,  -- the THEME
  user_id         uuid not null references auth.users(id),

  -- The four tiers: solid (practical) | bold (strategic) | moonshot (innovative) | standalone (independent)
  type            text not null check (type in ('solid', 'bold', 'moonshot', 'standalone')),

  title               text not null,
  explanation         text not null,
  rationale           text not null,
  supporting_examples jsonb not null default '[]'::jsonb,  -- array of quote/example strings
  expected_value      text not null,
  call_to_action      text not null,

  -- Human validation, same shape as snapshots
  status        text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  human_notes   text,
  validated_at  timestamptz,
  validated_by  uuid references auth.users(id),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 2. Indexes
-- ============================================================

create index if not exists idx_recommendations_project_id     on public.recommendations(project_id);
create index if not exists idx_recommendations_opportunity_id on public.recommendations(opportunity_id);
create index if not exists idx_recommendations_user_id        on public.recommendations(user_id);

-- One generated set per (opportunity, type). Lets us upsert tier-by-tier
-- without creating duplicates if the user regenerates.
create unique index if not exists unique_recommendation_per_theme_tier
  on public.recommendations (opportunity_id, type);

-- ============================================================
-- 3. RLS — owner + member access (mirrors migrations 003, 005)
-- ============================================================

alter table public.recommendations enable row level security;

-- Direct ownership check (denormalized user_id pattern from migration 003)
drop policy if exists "Users manage own recommendations" on public.recommendations;
create policy "Users manage own recommendations" on public.recommendations
  for all using (user_id = auth.uid());

-- Additive member access (collaborative-projects pattern from migration 005)
drop policy if exists "Members access recommendations" on public.recommendations;
create policy "Members access recommendations" on public.recommendations
  for all using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

-- ============================================================
-- 4. Triggers — auto user_id, auto updated_at
-- ============================================================

drop trigger if exists set_recommendations_user_id on public.recommendations;
create trigger set_recommendations_user_id
  before insert on public.recommendations
  for each row execute function set_user_id_from_auth();

drop trigger if exists update_recommendations_updated_at on public.recommendations;
create trigger update_recommendations_updated_at
  before update on public.recommendations
  for each row execute function update_updated_at();
