-- Migration: 007_snapshot_insights.sql
-- Purpose: add the Teresa Torres "Insights" column to interview snapshots.
-- Each insight separates observed FACTS from the INTERPRETATION drawn from them:
--   insights: [{ facts: string[], interpretation: string }]
alter table public.snapshots add column if not exists insights jsonb default '[]'::jsonb;
