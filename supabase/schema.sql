-- Marie Dashboard : table de synchronisation.
-- À coller dans Supabase → SQL Editor → New query, puis « Run ».

create table if not exists public.dashboards (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Chaque personne ne peut lire et modifier que son propre tableau de bord.
alter table public.dashboards enable row level security;

drop policy if exists "Mon tableau de bord" on public.dashboards;
create policy "Mon tableau de bord" on public.dashboards
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
