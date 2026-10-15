-- hyve5 schema
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to re-run: it drops and recreates the hyve5 objects (and their data).

create extension if not exists pgcrypto;

drop function if exists public.swap_cards(text);
drop function if exists public.book_slot(uuid, text, text);
drop table if exists public.push_subscriptions cascade;
drop table if exists public.notifications cascade;
drop table if exists public.reminders cascade;
drop table if exists public.slots cascade;
drop table if exists public.swaps cascade;
drop table if exists public.profile_private cascade;
drop table if exists public.profiles cascade;
drop table if exists public.events cascade;

-- ───────────────────────── Events ─────────────────────────
create table public.events (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  venue       text,
  starts_at   timestamptz default now(),
  ends_at     timestamptz,
  created_by  uuid,
  organised   boolean not null default false,   -- true = the creator runs it (gets the check-in QR)
  created_at  timestamptz default now()
);

-- ───────────────────────── Profiles (public card data) ─────────────────────────
-- id = auth.users.id for real users. Demo profiles get a random id.
create table public.profiles (
  id               uuid primary key,
  slug             text unique not null,
  full_name        text not null,
  avatar_url       text,
  role_line        text,                 -- "Product lead at Lumen Health"
  headline         text,                 -- AI-written one-liner
  status           text not null default 'collab' check (status in ('open','hiring','collab')),
  topics           text[] not null default '{}',
  linkedin_url     text,
  x_url            text,
  website_url      text,
  links            text[] not null default '{}',   -- any other links: GitHub, Behance, Substack, Instagram…
  active_event_id  uuid references public.events(id) on delete set null,
  onboarded        boolean not null default false,
  is_demo          boolean not null default false,
  created_at       timestamptz default now()
);

-- Email lives apart from the public card: only you and people you swapped with can read it.
create table public.profile_private (
  id     uuid primary key references public.profiles(id) on delete cascade,
  email  text
);

-- ───────────────────────── Swaps (one row per direction) ─────────────────────────
create table public.swaps (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  contact_id   uuid not null references public.profiles(id) on delete cascade,
  event_id     uuid references public.events(id) on delete set null,
  note         text,
  decision     text not null default 'pending' check (decision in ('pending','connect','skip')),
  stage        text not null default 'met' check (stage in ('met','messaged','booked','done')),
  met_at       timestamptz not null default now(),
  messaged_at  timestamptz,
  booked_at    timestamptz,
  deleted_at   timestamptz,               -- set when deleted; restorable for 30 days, then purged
  unique (owner_id, contact_id)
);

-- ───────────────────────── Booking slots ─────────────────────────
create table public.slots (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.profiles(id) on delete cascade,
  starts_at        timestamptz not null,
  duration_min     int not null default 15,
  booked_by_name   text,
  booked_by_email  text,
  booked_by_user   uuid,
  booked_at        timestamptz
);

-- ───────────────────────── Reminders ─────────────────────────
-- message_3h: nudge if you haven't messaged within 3 hours
-- followup_d3: nudge if no call is booked after 3 days
-- lastcall_d7: last nudge on day 7
create table public.reminders (
  id          uuid primary key default gen_random_uuid(),
  swap_id     uuid not null references public.swaps(id) on delete cascade,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('message_3h','followup_d3','lastcall_d7')),
  due_at      timestamptz not null,
  sent_at     timestamptz,
  cleared_at  timestamptz,
  unique (swap_id, kind)
);

-- ───────────────────────── In-app notifications ─────────────────────────
-- Written by the server (service role) whenever a reminder fires, someone swaps
-- with you, or someone books a call. The bell shows unread ones.
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null,
  title       text not null,
  body        text,
  link        text,
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);

-- ───────────────────────── Web push subscriptions (one per device) ─────────────────────────
create table public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  endpoint    text unique not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

create index on public.notifications (user_id, created_at desc);
create index on public.swaps (owner_id, decision);
create index on public.slots (owner_id, starts_at);
create index on public.reminders (due_at) where sent_at is null and cleared_at is null;

-- ───────────────────────── Row-level security ─────────────────────────
alter table public.events          enable row level security;
alter table public.profiles        enable row level security;
alter table public.profile_private enable row level security;
alter table public.swaps           enable row level security;
alter table public.slots           enable row level security;
alter table public.reminders       enable row level security;
alter table public.notifications   enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "events readable"     on public.events for select using (true);
create policy "events insert own"   on public.events for insert with check (created_by = auth.uid());
create policy "events update own"   on public.events for update using (created_by = auth.uid());

create policy "cards are public"    on public.profiles for select using (true);
create policy "insert own profile"  on public.profiles for insert with check (id = auth.uid());
create policy "update own profile"  on public.profiles for update using (id = auth.uid());

create policy "email: me or swapped" on public.profile_private for select using (
  id = auth.uid()
  or exists (select 1 from public.swaps s where s.owner_id = auth.uid() and s.contact_id = profile_private.id)
);
create policy "email insert own"    on public.profile_private for insert with check (id = auth.uid());
create policy "email update own"    on public.profile_private for update using (id = auth.uid());

create policy "my swaps"            on public.swaps for select using (owner_id = auth.uid());
create policy "update my swaps"     on public.swaps for update using (owner_id = auth.uid());
create policy "delete my swaps"     on public.swaps for delete using (owner_id = auth.uid());

create policy "slots readable"      on public.slots for select using (true);
create policy "slots insert own"    on public.slots for insert with check (owner_id = auth.uid());
create policy "slots update own"    on public.slots for update using (owner_id = auth.uid());
create policy "slots delete own"    on public.slots for delete using (owner_id = auth.uid());

create policy "my reminders"        on public.reminders for select using (owner_id = auth.uid());
create policy "update my reminders" on public.reminders for update using (owner_id = auth.uid());

create policy "my notifications"        on public.notifications for select using (user_id = auth.uid());
create policy "mark my notifications"   on public.notifications for update using (user_id = auth.uid());

create policy "my push subs"            on public.push_subscriptions for select using (user_id = auth.uid());
create policy "add my push sub"         on public.push_subscriptions for insert with check (user_id = auth.uid());
create policy "update my push sub"      on public.push_subscriptions for update using (user_id = auth.uid());
create policy "remove my push sub"      on public.push_subscriptions for delete using (user_id = auth.uid());

-- ───────────────────────── swap_cards(host_slug) ─────────────────────────
-- Called by the guest after scanning the host's QR. Creates both directions,
-- tags the swap (and the guest) to the host's live event, and schedules reminders.
-- Returns the guest's swap id.
create or replace function public.swap_cards(host_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me        uuid := auth.uid();
  host      public.profiles;
  ev        uuid;
  my_swap   uuid;
  host_swap uuid;
begin
  if me is null then raise exception 'not signed in'; end if;
  select * into host from public.profiles where slug = host_slug;
  if host.id is null then raise exception 'card not found'; end if;
  if host.id = me then return null; end if;

  -- Tag the swap to the host's event only if it's happening right now AND the guest has
  -- already said they're attending it (checked in, or answered yes before). Otherwise the
  -- app asks the guest "Are you at the same event?" and calls join_swap_event on yes.
  select e.id into ev from public.events e
   where e.id = host.active_event_id
     and (e.starts_at is null or e.starts_at <= now() + interval '30 minutes')
     and (e.ends_at   is null or e.ends_at   >= now() - interval '30 minutes')
     and exists (select 1 from public.profiles g where g.id = me and g.active_event_id = e.id);

  insert into public.swaps (owner_id, contact_id, event_id)
  values (me, host.id, ev)
  on conflict (owner_id, contact_id) do update
    set event_id = coalesce(excluded.event_id, public.swaps.event_id), met_at = now(),
        decision = case when public.swaps.deleted_at is not null then 'pending' else public.swaps.decision end,
        deleted_at = null
  returning id into my_swap;

  insert into public.swaps (owner_id, contact_id, event_id)
  values (host.id, me, ev)
  on conflict (owner_id, contact_id) do update
    set event_id = coalesce(excluded.event_id, public.swaps.event_id), met_at = now(),
        decision = case when public.swaps.deleted_at is not null then 'pending' else public.swaps.decision end,
        deleted_at = null
  returning id into host_swap;

  insert into public.reminders (swap_id, owner_id, kind, due_at) values
    (my_swap,   me,      'message_3h',  now() + interval '3 hours'),
    (my_swap,   me,      'followup_d3', now() + interval '3 days'),
    (my_swap,   me,      'lastcall_d7', now() + interval '7 days'),
    (host_swap, host.id, 'message_3h',  now() + interval '3 hours'),
    (host_swap, host.id, 'followup_d3', now() + interval '3 days'),
    (host_swap, host.id, 'lastcall_d7', now() + interval '7 days')
  on conflict (swap_id, kind) do update
    set due_at = excluded.due_at, sent_at = null, cleared_at = null;  -- meeting again restarts the reminders

  return my_swap;
end;
$$;

-- ───────────────────────── join_swap_event(host_slug) ─────────────────────────
-- The guest said "yes, I'm at the same event": tag both swaps to the host's event
-- and mark the guest as attending it. Only works while the event is on.
create or replace function public.join_swap_event(host_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me   uuid := auth.uid();
  host public.profiles;
  ev   uuid;
begin
  if me is null then raise exception 'not signed in'; end if;
  select * into host from public.profiles where slug = host_slug;
  if host.id is null or host.id = me then return null; end if;

  select e.id into ev from public.events e
   where e.id = host.active_event_id
     and (e.starts_at is null or e.starts_at <= now() + interval '30 minutes')
     and (e.ends_at   is null or e.ends_at   >= now() - interval '30 minutes');
  if ev is null then return null; end if;

  update public.swaps set event_id = ev
   where (owner_id = me and contact_id = host.id) or (owner_id = host.id and contact_id = me);
  update public.profiles set active_event_id = ev where id = me;
  return ev;
end;
$$;

-- ───────────────────────── book_slot(slot, name, email) ─────────────────────────
-- Anyone can book an open slot on a card. If the booker is signed in and the two
-- have swapped, both swaps move to "booked" and the follow-up reminders clear.
create or replace function public.book_slot(slot_id uuid, booker_name text, booker_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me    uuid := auth.uid();
  s     public.slots;
begin
  update public.slots
     set booked_by_name = booker_name, booked_by_email = booker_email,
         booked_by_user = me, booked_at = now()
   where id = slot_id and booked_at is null and starts_at > now()
  returning * into s;

  if s.id is null then return false; end if;

  if me is not null then
    update public.swaps set stage = 'booked', booked_at = now(), decision = 'connect'
     where (owner_id = s.owner_id and contact_id = me) or (owner_id = me and contact_id = s.owner_id);
    update public.reminders set cleared_at = now()
     where cleared_at is null and swap_id in (
       select id from public.swaps
        where (owner_id = s.owner_id and contact_id = me) or (owner_id = me and contact_id = s.owner_id));
  end if;
  return true;
end;
$$;

grant execute on function public.swap_cards(text) to authenticated;
grant execute on function public.join_swap_event(text) to authenticated;
grant execute on function public.book_slot(uuid, text, text) to anon, authenticated;
