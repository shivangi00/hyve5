'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { reminderEmail } from '@/lib/email';
import { notify, reminderCopy } from '@/lib/notify';
import { siteUrl } from '@/lib/util';

async function clear(supabase: Awaited<ReturnType<typeof createClient>>, swapId: string, kinds: string[]) {
  await supabase
    .from('reminders')
    .update({ cleared_at: new Date().toISOString() })
    .eq('swap_id', swapId)
    .in('kind', kinds)
    .is('cleared_at', null);
}

export async function markMessaged(swapId: string) {
  const supabase = await createClient();
  const { data: swap } = await supabase.from('swaps').select('stage').eq('id', swapId).single();
  if (swap?.stage === 'met') {
    await supabase.from('swaps').update({ stage: 'messaged', decision: 'connect', messaged_at: new Date().toISOString() }).eq('id', swapId);
  }
  await clear(supabase, swapId, ['message_3h']);
  revalidatePath('/ride-home');
  return { ok: true };
}

export async function markBooked(swapId: string) {
  const supabase = await createClient();
  await supabase.from('swaps').update({ stage: 'booked', decision: 'connect', booked_at: new Date().toISOString() }).eq('id', swapId);
  await clear(supabase, swapId, ['message_3h', 'followup_d3', 'lastcall_d7']);
  revalidatePath('/ride-home');
  return { ok: true };
}

export async function markDone(swapId: string) {
  const supabase = await createClient();
  await supabase.from('swaps').update({ stage: 'done' }).eq('id', swapId);
  await clear(supabase, swapId, ['message_3h', 'followup_d3', 'lastcall_d7']);
  revalidatePath('/ride-home');
  return { ok: true };
}

/** For live demos: fires the reminder right now, to you (bell + push, + email if configured). */
export async function sendTestReminder(swapId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, text: 'Please sign in again.' };

  const { data: swap } = await supabase.from('swaps').select('id, contact_id, event_id, stage').eq('id', swapId).single();
  if (!swap) return { ok: false, text: 'Swap not found.' };
  const [{ data: contact }, { data: ev }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', swap.contact_id).single(),
    swap.event_id ? supabase.from('events').select('name').eq('id', swap.event_id).single() : Promise.resolve({ data: null }),
  ]);
  const kind = swap.stage === 'met' ? 'message_3h' : 'followup_d3';
  const contactName = contact?.full_name ?? 'your contact';
  const eventName = (ev as { name: string } | null)?.name ?? null;
  const link = `/connect/${swapId}`;
  const copy = reminderCopy(kind, contactName, eventName);

  const res = await notify(user.id, {
    kind,
    title: copy.title,
    body: copy.body,
    link,
    email: reminderEmail({ kind, contactName, eventName, link: `${siteUrl()}${link}` }),
  });
  if (!res.inApp) return { ok: false, text: 'Could not save the reminder (check SUPABASE_SERVICE_ROLE_KEY).' };
  if (res.push) return { ok: true, text: 'Reminder sent. Check your phone.' };
  return { ok: true, text: 'Reminder added under the bell. Turn on notifications to get it on your phone.' };
}
