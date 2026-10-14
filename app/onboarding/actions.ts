'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { generateCard } from '@/lib/ai';
import { safeNext } from '@/lib/util';
import type { Status } from '@/lib/types';

export async function finishOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const next = safeNext(String(formData.get('next') || ''));
  const roleLine = String(formData.get('role_line') || '').trim().slice(0, 120);
  const rawStatus = String(formData.get('status') || 'collab');
  const status: Status = rawStatus === 'open' || rawStatus === 'hiring' ? rawStatus : 'collab';
  const topics = String(formData.get('topics') || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4);

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user!.id).single();
  const card = await generateCard({ name: profile?.full_name ?? '', roleLine, status, topics });

  await supabase
    .from('profiles')
    .update({ role_line: roleLine, status, headline: card.headline, topics: card.topics, onboarded: true })
    .eq('id', user!.id);

  // Give new cards three bookable times so the booking tile works from minute one.
  const { count } = await supabase.from('slots').select('id', { count: 'exact', head: true }).eq('owner_id', user!.id);
  if (!count) {
    let starts: string[] = [];
    try {
      starts = JSON.parse(String(formData.get('default_slots') || '[]'));
    } catch {}
    const rows = starts
      .filter((s) => !Number.isNaN(Date.parse(s)))
      .slice(0, 3)
      .map((s) => ({ owner_id: user!.id, starts_at: s, duration_min: 15 }));
    if (rows.length) await supabase.from('slots').insert(rows);
  }

  redirect(next);
}
