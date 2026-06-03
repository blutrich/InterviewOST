-- Migration: 005_collaborative_projects.sql
-- Purpose: Turn single-owner projects into shareable, multi-member projects.
--
-- Model: a project has one owner (projects.user_id) plus zero+ members
-- (project_members). Owner OR member can read/write the project and all its
-- child rows. Existing owner policies are LEFT IN PLACE; these member policies
-- are additive (RLS permissive policies are OR'd together).
--
-- Recursion safety: membership checks run inside SECURITY DEFINER functions so
-- they bypass RLS on the tables they read (no policy -> function -> policy loop).

-- ============================================================
-- 1. Membership table
-- ============================================================
create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'editor',   -- editor | viewer (advisory for now)
  created_at timestamptz default now(),
  primary key (project_id, user_id)
);

alter table public.project_members enable row level security;

-- ============================================================
-- 2. Membership helpers (SECURITY DEFINER -> bypass RLS internally)
-- ============================================================
create or replace function public.is_project_owner(pid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from projects p where p.id = pid and p.user_id = auth.uid());
$$;

create or replace function public.is_project_member(pid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from projects p where p.id = pid and p.user_id = auth.uid())
      or exists (select 1 from project_members m where m.project_id = pid and m.user_id = auth.uid());
$$;

create or replace function public.is_project_member_via_interview(iid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from interviews i where i.id = iid and public.is_project_member(i.project_id));
$$;

create or replace function public.is_project_member_via_opportunity(oid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from opportunities o where o.id = oid and public.is_project_member(o.project_id));
$$;

-- ============================================================
-- 3. Policies on project_members itself
-- ============================================================
drop policy if exists "Members see membership" on public.project_members;
create policy "Members see membership" on public.project_members
  for select using (public.is_project_member(project_id));

drop policy if exists "Owners manage membership" on public.project_members;
create policy "Owners manage membership" on public.project_members
  for all using (public.is_project_owner(project_id))
  with check (public.is_project_owner(project_id));

-- ============================================================
-- 4. Additive member policies on project + child tables
-- ============================================================
drop policy if exists "Members access projects" on public.projects;
create policy "Members access projects" on public.projects
  for all using (public.is_project_member(id)) with check (public.is_project_member(id));

drop policy if exists "Members access interviews" on public.interviews;
create policy "Members access interviews" on public.interviews
  for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));

drop policy if exists "Members access templates" on public.templates;
create policy "Members access templates" on public.templates
  for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));

drop policy if exists "Members access opportunities" on public.opportunities;
create policy "Members access opportunities" on public.opportunities
  for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));

drop policy if exists "Members access snapshots" on public.snapshots;
create policy "Members access snapshots" on public.snapshots
  for all using (public.is_project_member_via_interview(interview_id))
  with check (public.is_project_member_via_interview(interview_id));

drop policy if exists "Members access messages" on public.messages;
create policy "Members access messages" on public.messages
  for all using (public.is_project_member_via_interview(interview_id))
  with check (public.is_project_member_via_interview(interview_id));

drop policy if exists "Members access evidence" on public.evidence;
create policy "Members access evidence" on public.evidence
  for all using (
    (opportunity_id is not null and public.is_project_member_via_opportunity(opportunity_id))
    or (interview_id is not null and public.is_project_member_via_interview(interview_id))
  )
  with check (
    (opportunity_id is not null and public.is_project_member_via_opportunity(opportunity_id))
    or (interview_id is not null and public.is_project_member_via_interview(interview_id))
  );
