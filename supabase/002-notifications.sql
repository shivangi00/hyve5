-- Only needed if you ran an older schema.sql BEFORE notifications were added.
-- (A fresh run of schema.sql already includes all of this.)

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null,
  title       text not null,
  body        text,
  link        text,
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  endpoint    text unique not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_created on public.notifications (user_id, created_at desc);

alter table public.notifications      enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "my notifications"      on public.notifications;
drop policy if exists "mark my notifications" on public.notifications;
drop policy if exists "my push subs"          on public.push_subscriptions;
drop policy if exists "add my push sub"       on public.push_subscriptions;
drop policy if exists "update my push sub"    on public.push_subscriptions;
drop policy if exists "remove my push sub"    on public.push_subscriptions;

create policy "my notifications"      on public.notifications for select using (user_id = auth.uid());
create policy "mark my notifications" on public.notifications for update using (user_id = auth.uid());
create policy "my push subs"          on public.push_subscriptions for select using (user_id = auth.uid());
create policy "add my push sub"       on public.push_subscriptions for insert with check (user_id = auth.uid());
create policy "update my push sub"    on public.push_subscriptions for update using (user_id = auth.uid());
create policy "remove my push sub"    on public.push_subscriptions for delete using (user_id = auth.uid());
