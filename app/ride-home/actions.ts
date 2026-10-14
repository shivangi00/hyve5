'use server';

import { createClient } from '@/lib/supabase/server';

export async function decideSwap(swapId: string, decision: 'connect' | 'skip') {
  const supabase = await createClient();
  await supabase.from('swaps').update({ decision }).eq('id', swapId);
  if (decision === 'skip') {
    // Archived quietly: no more nudges about this person.
    await supabase.from('reminders').update({ cleared_at: new Date().toISOString() }).eq('swap_id', swapId).is('cleared_at', null);
  }
  return { ok: true };
}

export async function undoDecision(swapId: string) {
  const supabase = await createClient();
  await supabase.from('swaps').update({ decision: 'pending' }).eq('id', swapId);
  await supabase.from('reminders').update({ cleared_at: null }).eq('swap_id', swapId).is('sent_at', null);
  return { ok: true };
}
