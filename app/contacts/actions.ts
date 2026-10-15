'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/contacts');
  return { supabase, uid: user!.id };
}

function refresh() {
  revalidatePath('/contacts');
  revalidatePath('/ride-home');
  revalidatePath('/me');
}

const now = () => new Date().toISOString();

/** Pause or resume the nudges for a contact (only reminders that haven't been sent yet). */
async function setReminders(supabase: Awaited<ReturnType<typeof createClient>>, swapId: string, on: boolean) {
  if (on) {
    await supabase.from('reminders').update({ cleared_at: null }).eq('swap_id', swapId).is('sent_at', null).gt('due_at', now());
  } else {
    await supabase.from('reminders').update({ cleared_at: now() }).eq('swap_id', swapId).is('sent_at', null).is('cleared_at', null);
  }
}

/** Move a contact between lists: to = connect | later | stack */
export async function moveContact(formData: FormData) {
  const { supabase, uid } = await me();
  const id = String(formData.get('id'));
  const to = String(formData.get('to'));
  const decision = to === 'connect' ? 'connect' : to === 'later' ? 'skip' : 'pending';
  await supabase.from('swaps').update({ decision }).eq('id', id).eq('owner_id', uid);
  await setReminders(supabase, id, decision !== 'skip');
  refresh();
  redirect(`/contacts?tab=${to === 'stack' ? 'stack' : to}&done=moved`);
}

/** Soft delete: hidden everywhere, restorable for 30 days, then removed for good. */
export async function deleteContact(formData: FormData) {
  const { supabase, uid } = await me();
  const id = String(formData.get('id'));
  await supabase.from('swaps').update({ deleted_at: now() }).eq('id', id).eq('owner_id', uid);
  await setReminders(supabase, id, false);
  refresh();
  redirect(`/contacts?tab=deleted&done=deleted`);
}

export async function restoreContact(formData: FormData) {
  const { supabase, uid } = await me();
  const id = String(formData.get('id'));
  const { data } = await supabase.from('swaps').update({ deleted_at: null }).eq('id', id).eq('owner_id', uid).select('decision').maybeSingle();
  if (data && data.decision !== 'skip') await setReminders(supabase, id, true);
  refresh();
  redirect(`/contacts?tab=deleted&done=restored`);
}

export async function deleteForever(formData: FormData) {
  const { supabase, uid } = await me();
  const id = String(formData.get('id'));
  await supabase.from('swaps').delete().eq('id', id).eq('owner_id', uid).not('deleted_at', 'is', null);
  refresh();
  redirect(`/contacts?tab=deleted&done=purged`);
}
