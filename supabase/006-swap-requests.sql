-- hyve5 upgrade: swap requests from an event's "Who's going" list.
-- Safe to run more than once. Keeps all your data.

-- ───────────────────────── Swap requests (from an event's "Who's going" list) ─────────────────────────
create table if not exists public.swap_requests (
  id          uuid primary key default gen_random_uuid(),
  from_id     uuid not null references public.profiles(id) on delete cascade,
  to_id       uuid not null references public.profiles(id) on delete cascade,
  event_id    uuid references public.events(id) on delete set null,
  status      text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at  timestamptz not null default now(),
  answered_at timestamptz,
  unique (from_id, to_id)
);
create index if not exists swap_requests_to on public.swap_requests (to_id, status);

alter table public.swap_requests enable row level security;
drop policy if exists "see my requests" on public.swap_requests;
create policy "see my requests" on public.swap_requests for select using (from_id = auth.uid() or to_id = auth.uid());
drop policy if exists "cancel my requests" on public.swap_requests;
create policy "cancel my requests" on public.swap_requests for delete using (from_id = auth.uid());
-- Sending and answering go through the functions below.

-- Internal: create (or revive) both halves of a swap, plus reminders. Not callable from the app directly.
create or replace function public._make_swap(a uuid, b uuid, ev uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  a_swap uuid;
  b_swap uuid;
begin
  insert into public.swaps (owner_id, contact_id, event_id)
  values (a, b, ev)
  on conflict (owner_id, contact_id) do update
    set event_id = coalesce(excluded.event_id, public.swaps.event_id), met_at = now(),
        decision = case when public.swaps.deleted_at is not null then 'pending' else public.swaps.decision end,
        deleted_at = null
  returning id into a_swap;

  insert into public.swaps (owner_id, contact_id, event_id)
  values (b, a, ev)
  on conflict (owner_id, contact_id) do update
    set event_id = coalesce(excluded.event_id, public.swaps.event_id), met_at = now(),
        decision = case when public.swaps.deleted_at is not null then 'pending' else public.swaps.decision end,
        deleted_at = null
  returning id into b_swap;

  insert into public.reminders (swap_id, owner_id, kind, due_at) values
    (a_swap, a, 'message_3h',  now() + interval '3 hours'),
    (a_swap, a, 'followup_d3', now() + interval '3 days'),
    (a_swap, a, 'lastcall_d7', now() + interval '7 days'),
    (b_swap, b, 'message_3h',  now() + interval '3 hours'),
    (b_swap, b, 'followup_d3', now() + interval '3 days'),
    (b_swap, b, 'lastcall_d7', now() + interval '7 days')
  on conflict (swap_id, kind) do update
    set due_at = excluded.due_at, sent_at = null, cleared_at = null;
  return a_swap;
end;
$$;
revoke all on function public._make_swap(uuid, uuid, uuid) from public, anon, authenticated;

-- Ask someone going to the same event to swap. If they already asked you, it swaps straight away.
-- Returns 'requested' | 'swapped' | 'already' | 'not_going'.
create or replace function public.request_swap(to_user uuid, ev uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  theirs uuid;
begin
  if me is null then raise exception 'not signed in'; end if;
  if to_user = me then return 'already'; end if;
  -- Both must be going to this event.
  if not exists (select 1 from public.profiles where id = me and active_event_id = ev)
     or not exists (select 1 from public.profiles where id = to_user and active_event_id = ev) then
    return 'not_going';
  end if;
  if exists (select 1 from public.swaps where owner_id = me and contact_id = to_user and deleted_at is null) then
    return 'already';
  end if;

  select id into theirs from public.swap_requests where from_id = to_user and to_id = me and status = 'pending';
  if theirs is not null then
    update public.swap_requests set status = 'accepted', answered_at = now() where id = theirs;
    perform public._make_swap(me, to_user, ev);
    return 'swapped';
  end if;

  insert into public.swap_requests (from_id, to_id, event_id)
  values (me, to_user, ev)
  on conflict (from_id, to_id) do update
    set status = 'pending', event_id = excluded.event_id, created_at = now(), answered_at = null;
  return 'requested';
end;
$$;

-- Accept or decline a request sent to you. Returns 'swapped' | 'declined' | 'gone'.
create or replace function public.respond_swap_request(req uuid, accept boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  r  public.swap_requests;
begin
  if me is null then raise exception 'not signed in'; end if;
  select * into r from public.swap_requests where id = req and to_id = me;
  if r.id is null then return 'gone'; end if;
  if r.status = 'accepted' then return 'swapped'; end if;
  if not accept then
    update public.swap_requests set status = 'declined', answered_at = now() where id = req;
    return 'declined';
  end if;
  update public.swap_requests set status = 'accepted', answered_at = now() where id = req;
  perform public._make_swap(me, r.from_id, r.event_id);
  return 'swapped';
end;
$$;

grant execute on function public.request_swap(uuid, uuid) to authenticated;
grant execute on function public.respond_swap_request(uuid, boolean) to authenticated;
