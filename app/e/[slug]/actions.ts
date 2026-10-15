'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notify } from '@/lib/notify';
import { firstName } from '@/lib/util';

export type ReqResult = { ok: boolean; result: string; message?: string };

/** Turns a database error into something the person (or you, setting up) can act on. */
function explain(error: { message?: string; code?: string }): ReqResult {
  const msg = error.message ?? '';
  if (error.code === 'PGRST202' || /could not find the function|does not exist|schema cache/i.test(msg)) {
    return { ok: false, result: 'setup', message: 'Swap requests need a database update: run supabase/006-swap-requests.sql in Supabase.' };
  }
  return { ok: false, result: 'error', message: msg || 'Something went wrong. Try again.' };
}

async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function nameOf(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data } = await supabase.from('profiles').select('full_name').eq('id', id).maybeSingle();
  return firstName(data?.full_name ?? 'Someone');
}

/** "Swap" on the Who's going list: sends a request (or swaps at once if they already asked you). */
export async function sendSwapRequest(toId: string, eventId: string, eventSlug: string): Promise<ReqResult> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, result: 'signed_out' };
  const { data, error } = await supabase.rpc('request_swap', { to_user: toId, ev: eventId });
  if (error) {
    console.error('request_swap failed', error);
    return explain(error);
  }
  const result = String(data);
  // Notify after replying, so a slow push or email never holds up the person tapping Swap.
  const mine = await nameOf(supabase, user.id);
  after(async () => {
    if (result === 'requested') {
      await notify(toId, { kind: 'swap_request', title: `${mine} wants to swap cards`, body: "Tap to accept. You can also just scan each other's QR when you meet.", link: `/e/${eventSlug}#requests` });
    } else if (result === 'swapped') {
      await notify(toId, { kind: 'swap', title: `You swapped cards with ${mine}`, body: "They're in your Ride Home stack.", link: '/ride-home' });
    }
  });
  revalidatePath(`/e/${eventSlug}`);
  revalidatePath('/ride-home');
  return { ok: true, result };
}

/** Accept or decline a request someone sent you. */
export async function answerSwapRequest(requestId: string, accept: boolean, eventSlug: string): Promise<ReqResult> {
  const { supabase, user } = await me();
  if (!user) return { ok: false, result: 'signed_out' };
  const { data: req } = await supabase.from('swap_requests').select('from_id').eq('id', requestId).maybeSingle();
  const { data, error } = await supabase.rpc('respond_swap_request', { req: requestId, accept });
  if (error) {
    console.error('respond_swap_request failed', error);
    return explain(error);
  }
  const result = String(data);
  if (result === 'swapped' && req?.from_id) {
    const to = req.from_id;
    const mine = await nameOf(supabase, user.id);
    after(async () => {
      await notify(to, { kind: 'swap', title: `${mine} accepted your swap`, body: "You're in each other's Ride Home stack.", link: '/ride-home' });
    });
  }
  revalidatePath(`/e/${eventSlug}`);
  revalidatePath('/ride-home');
  revalidatePath('/me');
  return { ok: true, result };
}

export type Live = { incoming: { id: string; from: string }[]; swapped: string[]; sent: string[] };

/** Small, cheap check the event page runs every few seconds: new requests for me, and which of mine were accepted. */
export async function swapUpdates(personIds: string[]): Promise<Live | null> {
  const { supabase, user } = await me();
  if (!user || !personIds.length) return null;
  const [{ data: reqs, error }, { data: swaps }] = await Promise.all([
    supabase.from('swap_requests').select('id, from_id, to_id, status').or(`from_id.eq.${user.id},to_id.eq.${user.id}`).eq('status', 'pending'),
    supabase.from('swaps').select('contact_id').eq('owner_id', user.id).is('deleted_at', null).in('contact_id', personIds),
  ]);
  if (error) return null;
  const rows = (reqs ?? []) as { id: string; from_id: string; to_id: string }[];
  return {
    incoming: rows.filter((r) => r.to_id === user.id).map((r) => ({ id: r.id, from: r.from_id })),
    sent: rows.filter((r) => r.from_id === user.id).map((r) => r.to_id),
    swapped: ((swaps ?? []) as { contact_id: string }[]).map((r) => r.contact_id),
  };
}
