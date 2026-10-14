-- Runs the reminder sender every 10 minutes from inside Supabase.
-- (Vercel's free plan only allows daily cron jobs, which is too slow for a 3-hour reminder.)
--
-- Before running:
--   1) Supabase → Database → Extensions: enable "pg_cron" and "pg_net".
--   2) Replace YOUR-APP-URL and YOUR-CRON-SECRET below (same value as CRON_SECRET in Vercel).

select cron.unschedule('networkpulse-reminders')
where exists (select 1 from cron.job where jobname = 'networkpulse-reminders');

select cron.schedule(
  'networkpulse-reminders',
  '*/10 * * * *',
  $$
  select net.http_get(
    url := 'https://YOUR-APP-URL/api/cron/reminders',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR-CRON-SECRET')
  );
  $$
);
