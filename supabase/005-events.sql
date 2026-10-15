-- hyve5 upgrade: events with a date, start and end time, and the
-- "Are you at the same event?" question after a swap.
-- Safe to run more than once. Keeps all your data.

-- Organisers get the event check-in QR; attendees don't.
alter table public.events add column if not exists organised boolean not null default false;

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

grant execute on function public.swap_cards(text) to authenticated;
grant execute on function public.join_swap_event(text) to authenticated;
