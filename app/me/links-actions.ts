'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { cleanUrl, detectLink } from '@/lib/links';
import { normaliseLinkedIn } from '@/lib/util';

export type LinkState = { ok: boolean; message: string; at: number };

const MAX_LINKS = 12;

function done(ok: boolean, message: string): LinkState {
  return { ok, message, at: Date.now() };
}

/** Adds any link. LinkedIn and X go into their own slots; everything else joins the list. */
export async function addLink(_prev: LinkState | null, formData: FormData): Promise<LinkState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return done(false, 'Please sign in again.');

  const url = cleanUrl(String(formData.get('url') || ''));
  if (!url) return done(false, "That doesn't look like a link. Try something like github.com/yourname.");
  const kind = detectLink(url);

  if (kind.id === 'linkedin') {
    await supabase.from('profiles').update({ linkedin_url: normaliseLinkedIn(url) }).eq('id', user.id);
  } else if (kind.id === 'x') {
    await supabase.from('profiles').update({ x_url: url }).eq('id', user.id);
  } else {
    const { data } = await supabase.from('profiles').select('links, website_url').eq('id', user.id).single();
    const links: string[] = (data?.links as string[] | null) ?? [];
    const same = (a: string) => a.toLowerCase() === url.toLowerCase();
    if (links.some(same) || (data?.website_url && same(data.website_url))) return done(false, 'That link is already on your card.');
    if (links.length >= MAX_LINKS) return done(false, `You can add up to ${MAX_LINKS} links. Remove one first.`);
    await supabase.from('profiles').update({ links: [...links, url] }).eq('id', user.id);
  }
  revalidatePath('/me');
  revalidatePath('/me/edit');
  return done(true, `${kind.name} added.`);
}

/** key = 'linkedin' | 'x' | 'website' | the link itself */
export async function removeLink(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const key = String(formData.get('key') || '');
  if (key === 'linkedin') await supabase.from('profiles').update({ linkedin_url: null }).eq('id', user.id);
  else if (key === 'x') await supabase.from('profiles').update({ x_url: null }).eq('id', user.id);
  else if (key === 'website') await supabase.from('profiles').update({ website_url: null }).eq('id', user.id);
  else {
    const { data } = await supabase.from('profiles').select('links').eq('id', user.id).single();
    const links = ((data?.links as string[] | null) ?? []).filter((l) => l !== key);
    await supabase.from('profiles').update({ links }).eq('id', user.id);
  }
  revalidatePath('/me');
  revalidatePath('/me/edit');
}
