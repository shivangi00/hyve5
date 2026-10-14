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
  const venue = String(formData.get('venue') || '').trim().slice(0, 80) || null;
  const endsIso = String(formData.get('ends_at_iso') || '');
  const ends_at = endsIso && !Number.isNaN(Date.parse(endsIso)) ? endsIso : new Date(Date.now() + 5 * 3600e3).toISOString();

  const { data: ev, error } = await supabase
    .from('events')
    .insert({ slug: slugify(name), name, venue, ends_at, created_by: user!.id })
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
