-- Demo data for rehearsing the Ride Home stack.
-- 1) Sign in to the app once and finish onboarding.
-- 2) Change the email on the next line to the one you signed in with, then run this file.
-- Re-running it replaces the demo people (your real swaps are untouched).

do $$
declare
  my_email text := 'you@example.com';   -- ← CHANGE ME
  me       uuid;
  ev       uuid;
  p        record;
  sid      uuid;
begin
  select id into me from auth.users where email = my_email;
  if me is null then raise exception 'No user with email %. Sign in to the app first.', my_email; end if;

  delete from public.profiles where is_demo;

  select id into ev from public.events where slug = 'xyz-summit-demo';
  if ev is null then
    insert into public.events (slug, name, venue, starts_at, ends_at, created_by)
    values ('xyz-summit-demo', 'XYZ Summit', 'London', now() - interval '3 hours', now() + interval '4 hours', me)
    returning id into ev;
  end if;
  update public.profiles set active_event_id = ev where id = me;

  for p in
    select * from (values
      ('Priya Raman',  'Product lead at Lumen Health',         'hiring', array['Health tech','Product design','Hiring'],     'Building scheduling for clinics. Hiring a product designer before Christmas.', 95),
      ('James Okafor', 'Partner at Northwind Ventures',        'collab', array['Pre-seed','Community software'],              'Pre-seed fund. Said: send a two-line pitch by Friday.', 80),
      ('Aisha Khan',   'Community lead at Fernway',            'collab', array['Events','Community','Partnerships'],          'Runs about 40 meetups a year. Possible pilot partner.', 65),
      ('Tom Becker',   'Frontend engineer, freelance',         'open',   array['Next.js','Supabase','Design systems'],        'Next.js and Supabase. Free from November.', 50),
      ('Mei Lin',      'Founder at Paperkite',                 'collab', array['Ticketing','Events'],                         'Ticketing for small venues. Swapped notes on organiser pain.', 35),
      ('Daniel Ortiz', 'Talent partner at Halden',             'hiring', array['Recruiting'],                                 null, 20)
    ) as t(name, role_line, status, topics, note, mins_ago)
  loop
    insert into public.profiles (id, slug, full_name, role_line, headline, status, topics, linkedin_url, onboarded, is_demo, active_event_id)
    values (gen_random_uuid(),
            lower(regexp_replace(p.name, '[^a-zA-Z]+', '-', 'g')) || '-demo-' || substr(md5(random()::text), 1, 4),
            p.name, p.role_line, p.role_line, p.status, p.topics, null, true, true, ev)
    returning id into sid;

    insert into public.profile_private (id, email) values (sid, null);

    insert into public.swaps (owner_id, contact_id, event_id, note, met_at)
    values (me, sid, ev, p.note, now() - make_interval(mins => p.mins_ago))
    returning id into sid;

    insert into public.reminders (swap_id, owner_id, kind, due_at) values
      (sid, me, 'message_3h',  now() - make_interval(mins => p.mins_ago) + interval '3 hours'),
      (sid, me, 'followup_d3', now() + interval '3 days'),
      (sid, me, 'lastcall_d7', now() + interval '7 days');
  end loop;
end $$;
