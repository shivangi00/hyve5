'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { esc, sendEmail } from '@/lib/email';
import { notify } from '@/lib/notify';
import { APP_TZ, fmtDayDate, fmtTime, firstName } from '@/lib/util';

export async function bookSlot(slotId: string, name: string, email: string, ownerSlug: string) {
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return { ok: false, text: 'Add your name and a valid email.' };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: slot } = await supabase.from('slots').select('id, owner_id, starts_at').eq('id', slotId).maybeSingle();
  if (!slot) return { ok: false, text: 'That time no longer exists.' };

  const { data: ok, error } = await supabase.rpc('book_slot', { slot_id: slotId, booker_name: name, booker_email: email });
  if (error) return { ok: false, text: error.message };
  if (!ok) return { ok: false, text: 'Someone just took that time. Pick another one.' };

  const when = `${fmtDayDate(slot.starts_at, APP_TZ)} at ${fmtTime(slot.starts_at, APP_TZ)}`;
  let ownerName = 'them';
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { data: owner } = await createAdminClient().from('profiles').select('full_name').eq('id', slot.owner_id).single();
    ownerName = owner?.full_name ?? ownerName;
  }

  // Card owner: bell + push (+ email when configured).
  await notify(slot.owner_id, {
    kind: 'booking',
    title: `${name} booked a call: ${when}`,
    body: `15 minutes. Reply to ${email} with a video link.`,
    link: '/me/edit#times',
    email: {
      subject: `${name} booked a call: ${when}`,
      html: `<p>${esc(name)} (${esc(email)}) booked a 15-minute call with you on <b>${when}</b> (UK time).</p><p>Reply to them to share a video link.</p>`,
    },
  });

  // Booker: bell + push if they're signed in; email confirmation when email is configured.
  if (user) {
    await notify(user.id, {
      kind: 'booking',
      title: `Call booked with ${firstName(ownerName)}`,
      body: `${when}, 15 minutes. They'll send you a link.`,
      link: `/c/${ownerSlug}`,
    });
  }
  await sendEmail(email, `You're booked with ${ownerName}: ${when}`, `<p>Your 15-minute call with ${esc(ownerName)} is on <b>${when}</b> (UK time). They'll send you a video link.</p>`);

  revalidatePath(`/c/${ownerSlug}`);
  return { ok: true, text: `Booked for ${when}. ${firstName(ownerName) === 'them' ? 'They' : firstName(ownerName)} will send you a link.` };
}

export async function saveSwapNote(swapId: string, note: string) {
  const supabase = await createClient();
  await supabase.from('swaps').update({ note: note.trim().slice(0, 500) || null }).eq('id', swapId);
  return { ok: true };
}
