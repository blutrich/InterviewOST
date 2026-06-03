-- Migration: 006_project_sharing_helpers.sql
-- Purpose: support the in-app "Share project" UI.
--
-- The browser/authed client can't read auth.users, so two SECURITY DEFINER
-- helpers expose only what the Share dialog needs:
--   * get_user_id_by_email  -> resolve an invitee's account by email
--   * get_project_members   -> list owner + members (with emails + roles)
-- Both are gated so only project members can read membership.

-- Resolve a user id from an email (used when inviting). Returns NULL if no account.
create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql security definer stable set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
$$;

revoke all on function public.get_user_id_by_email(text) from public;
grant execute on function public.get_user_id_by_email(text) to authenticated;

-- List a project's people (owner + members) with emails + roles.
-- Returns nothing unless the caller is a member/owner of the project.
create or replace function public.get_project_members(pid uuid)
returns table (user_id uuid, email text, role text, is_owner boolean)
language sql security definer stable set search_path = public, auth as $$
  select x.user_id, x.email, x.role, x.is_owner
  from (
    select p.user_id as user_id,
           (select email from auth.users u where u.id = p.user_id) as email,
           'owner'::text as role,
           true as is_owner
    from projects p
    where p.id = pid
    union
    select m.user_id,
           (select email from auth.users u where u.id = m.user_id),
           m.role,
           false
    from project_members m
    where m.project_id = pid
  ) x
  where public.is_project_member(pid)
  order by x.is_owner desc, x.email;
$$;

revoke all on function public.get_project_members(uuid) from public;
grant execute on function public.get_project_members(uuid) to authenticated;
