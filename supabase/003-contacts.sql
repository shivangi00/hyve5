-- Contacts update: delete/restore contacts (30-day recycle bin) and re-swapping brings a deleted contact back.
-- Run once in Supabase → SQL Editor if your database was set up before this update.
-- (A fresh run of schema.sql already includes it.) Safe to re-run; keeps all your data.

alter table public.swaps add column if not exists deleted_at timestamptz;

drop policy if exists "delete my swaps" on public.swaps;
create policy "delete my swaps" on public.swaps for delete using (owner_id = auth.uid());

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

  select e.id into ev from public.events e
   where e.id = host.active_event_id and (e.ends_at is null or e.ends_at > now() - interval '6 hours');

  if ev is not null then
    update public.profiles set active_event_id = ev where id = me;
  end if;

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

grant execute on function public.swap_cards(text) to authenticated;

-- Removes the tables from the events-map preview, if you ran its SQL (that feature was rolled back).
drop table if exists public.event_interests cascade;
drop table if exists public.event_cache cascade;
drop table if exists public.geocode_cache cascade;
