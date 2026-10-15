'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/util';

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/events/new');

  const name = String(formData.get('name') || '').trim().slice(0, 80);
  if (!name) redirect('/events/new');
  const organised = formData.get('role') === 'organising';
  const venue = String(formData.get('venue') || '').trim().slice(0, 80) || null;
  const startsIso = String(formData.get('starts_at_iso') || '');
  const endsIso = String(formData.get('ends_at_iso') || '');
  const startsT = Date.parse(startsIso);
  const endsT = Date.parse(endsIso);
  const fail = (m: string) => redirect('/events/new?error=' + encodeURIComponent(m));
  if (Number.isNaN(startsT) || Number.isNaN(endsT)) fail('Pick a date, a start time and an end time.');
  if (endsT <= startsT) fail('The end time needs to be after the start time.');
  if (endsT <= Date.now()) fail('That event has already finished. Pick a later end time.');
  if (startsT > Date.now() + 366 * 86400e3) fail('Pick a date within the next year.');
  const starts_at = new Date(startsT).toISOString();
  const ends_at = new Date(endsT).toISOString();

  const { data: ev, error } = await supabase
    .from('events')
    .insert({ slug: slugify(name), name, venue, starts_at, ends_at, organised, created_by: user!.id })
    .select('id')
    .single();
  if (error || !ev) redirect(`/events/new?error=${encodeURIComponent(error?.message ?? 'Could not save')}`);

  await supabase.from('profiles').update({ active_event_id: ev!.id }).eq('id', user!.id);
  revalidatePath('/me');
  redirect('/me');
}

export async function leaveEvent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  await supabase.from('profiles').update({ active_event_id: null }).eq('id', user!.id);
  revalidatePath('/me');
  redirect('/me');
}
