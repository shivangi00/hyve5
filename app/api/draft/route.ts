import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { draftMessage } from '@/lib/ai';
import type { Tone } from '@/lib/types';

export async function POST(request: Request) {
  const { swapId, tone } = (await request.json().catch(() => ({}))) as { swapId?: string; tone?: Tone };
  if (!swapId) return NextResponse.json({ error: 'swapId required' }, { status: 400 });
  const t: Tone = tone === 'short' || tone === 'direct' ? tone : 'warm';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not signed in' }, { status: 401 });

  const { data: swap } = await supabase.from('swaps').select('*').eq('id', swapId).eq('owner_id', user.id).maybeSingle();
  if (!swap) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const [{ data: me }, { data: contact }, { data: ev }] = await Promise.all([
    supabase.from('profiles').select('full_name, topics').eq('id', user.id).single(),
    supabase.from('profiles').select('full_name, role_line').eq('id', swap.contact_id).single(),
    swap.event_id ? supabase.from('events').select('name').eq('id', swap.event_id).single() : Promise.resolve({ data: null }),
  ]);

  const draft = await draftMessage({
    myName: me?.full_name ?? '',
    myTopics: me?.topics ?? [],
    contactName: contact?.full_name ?? '',
    contactRole: contact?.role_line ?? null,
    eventName: (ev as { name: string } | null)?.name ?? null,
    note: swap.note,
    tone: t,
  });
  return NextResponse.json(draft);
}
