import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { reminderEmail } from '@/lib/email';
import { notify, reminderCopy } from '@/lib/notify';
import { siteUrl } from '@/lib/util';

export const dynamic = 'force-dynamic';

// Fires any reminders that are due: in-app + push (+ email if configured).
// Called every 10 minutes by Supabase pg_cron (supabase/reminders-cron.sql),
// with Authorization: Bearer CRON_SECRET.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: due, error } = await admin
    .from('reminders')
    .select('id, kind, swap_id, owner_id')
    .is('sent_at', null)
    .is('cleared_at', null)
    .lte('due_at', new Date().toISOString())
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  let skipped = 0;
  for (const r of due ?? []) {
    const { data: swap } = await admin.from('swaps').select('contact_id, event_id, decision, stage').eq('id', r.swap_id).single();
    const stillRelevant =
      swap &&
      swap.decision !== 'skip' &&
      ((r.kind === 'message_3h' && swap.stage === 'met') || (r.kind !== 'message_3h' && (swap.stage === 'met' || swap.stage === 'messaged')));

    if (!stillRelevant) {
      await admin.from('reminders').update({ cleared_at: new Date().toISOString() }).eq('id', r.id);
      skipped++;
      continue;
    }

    const [{ data: contact }, { data: ev }] = await Promise.all([
      admin.from('profiles').select('full_name').eq('id', swap!.contact_id).single(),
      swap!.event_id ? admin.from('events').select('name').eq('id', swap!.event_id).single() : Promise.resolve({ data: null }),
    ]);
    const contactName = contact?.full_name ?? 'your contact';
    const eventName = (ev as { name: string } | null)?.name ?? null;
    const link = `/connect/${r.swap_id}`;
    const copy = reminderCopy(r.kind, contactName, eventName);

    // Mark first so a slow run can't double-send; notify() never throws.
    await admin.from('reminders').update({ sent_at: new Date().toISOString() }).eq('id', r.id);
    await notify(r.owner_id, {
      kind: r.kind,
      title: copy.title,
      body: copy.body,
      link,
      email: reminderEmail({ kind: r.kind, contactName, eventName, link: `${siteUrl()}${link}` }),
    });
    sent++;
  }

  return NextResponse.json({ checked: due?.length ?? 0, sent, skipped });
}
