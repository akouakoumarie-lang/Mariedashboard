-- Marie Dashboard : notifications push.
-- Étape 1 — à coller dans Supabase → SQL Editor → New query, puis « Run ».

-- Les appareils qui reçoivent les notifications (un par téléphone / navigateur).
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subscription jsonb not null,
  timezone text not null default 'Europe/Paris',
  device text,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Mes appareils" on public.push_subscriptions;
create policy "Mes appareils" on public.push_subscriptions
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Notifications déjà envoyées (évite les doublons). Seul le serveur y accède.
create table if not exists public.notifications_sent (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.notifications_sent enable row level security;

-- Étape 2 — le planificateur (toutes les 5 minutes).
-- L'app génère ce bloc avec ton adresse et ton secret déjà remplis :
-- Paramètres → Notifications → « Générer mes clés ».
--
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select cron.schedule('marie-notify', '*/5 * * * *', $$
--   select net.http_post(
--     url := 'https://TON-PROJET.supabase.co/functions/v1/notify',
--     headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer TON_CRON_SECRET'),
--     body := '{}'::jsonb
--   );
-- $$);
-- select cron.schedule('marie-notify-cleanup', '0 4 * * *', $$
--   delete from public.notifications_sent where sent_at < now() - interval '3 days';
-- $$);
