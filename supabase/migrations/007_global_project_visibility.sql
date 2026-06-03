-- Migration: 007_global_project_visibility.sql
-- Purpose: Make all projects visible (SELECT) to any authenticated user.
-- Write operations remain restricted to owner/members via existing policies.

-- Allow any logged-in user to read any project
drop policy if exists "All authenticated users can view projects" on public.projects;
create policy "All authenticated users can view projects" on public.projects
  for select using (auth.role() = 'authenticated');

-- Allow any logged-in user to read templates (needed to see active template on projects)
drop policy if exists "All authenticated users can view templates" on public.templates;
create policy "All authenticated users can view templates" on public.templates
  for select using (auth.role() = 'authenticated');
