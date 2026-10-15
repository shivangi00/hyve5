'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Status } from '@/lib/types';

function url(v: FormDataEntryValue | null) {
  const s = String(v || '').trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, id: user!.id };
}

export async function saveProfile(formData: FormData) {
  const { supabase, id } = await me();
  const raw = String(formData.get('status') || 'collab');
  const status: Status = raw === 'open' || raw === 'hiring' ? raw : 'collab';
  await supabase
    .from('profiles')
    .update({
      full_name: String(formData.get('full_name') || '').trim() || undefined,
      role_line: String(formData.get('role_line') || '').trim() || null,
      headline: String(formData.get('headline') || '').trim() || null,
      status,
      topics: String(formData.get('topics') || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 6),
      linkedin_url: url(formData.get('linkedin_url')),
      x_url: url(formData.get('x_url')),
      website_url: url(formData.get('website_url')),
    })
    .eq('id', id);
  revalidatePath('/me');
  redirect('/me');
}

export async function addSlot(formData: FormData) {
  const { supabase, id } = await me();
  const iso = String(formData.get('starts_at_iso') || '');
  const t = Date.parse(iso);
  if (!iso || Number.isNaN(t)) redirect('/me/edit?slot=invalid#times');
  if (t <= Date.now()) redirect('/me/edit?slot=past#times');
  await supabase.from('slots').insert({ owner_id: id, starts_at: iso, duration_min: 15 });
  revalidatePath('/me/edit');
  redirect('/me/edit?slot=added#times');
}

/** Use the name and photo from one of your connected sign-in accounts (Google or LinkedIn). */
export async function chooseIdentity(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const provider = String(formData.get('provider') || '');
  const identity = user!.identities?.find((i) => i.provider === provider);
  const d = (identity?.identity_data ?? {}) as Record<string, string | undefined>;
  const name = d.full_name || d.name || [d.given_name, d.family_name].filter(Boolean).join(' ');
  const photo = d.avatar_url || d.picture || null;
  const update: Record<string, string | null> = {};
  const both = !!formData.get('take_both');
  if ((both || formData.get('take_name')) && name) update.full_name = name;
  if ((both || formData.get('take_photo')) && photo) update.avatar_url = photo;
  if (Object.keys(update).length) await supabase.from('profiles').update(update).eq('id', user!.id);
  revalidatePath('/me');
  revalidatePath('/me/edit');
  redirect('/me/edit?source=updated#accounts');
}

export async function deleteSlot(formData: FormData) {
  const { supabase, id } = await me();
  await supabase.from('slots').delete().eq('id', String(formData.get('id'))).eq('owner_id', id);
  revalidatePath('/me/edit');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
