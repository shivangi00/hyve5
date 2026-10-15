import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import type { Profile } from './types';
import { slugify } from './util';

/** Current user + their profile (either may be null). */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    profile = (data as Profile) ?? null;
  }
  return { supabase, user, profile };
}

/** Creates the card row from LinkedIn/Google data if it doesn't exist yet. */
export async function ensureProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }
): Promise<Profile | null> {
  const { data: existing } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const avatar = meta.avatar_url || meta.picture || null;
  if (existing) {
    if (!existing.avatar_url && avatar) await supabase.from('profiles').update({ avatar_url: avatar }).eq('id', user.id);
    // Older accounts may have no saved email yet; add it without replacing one the person chose.
    if (user.email) await supabase.from('profile_private').upsert({ id: user.id, email: user.email }, { onConflict: 'id', ignoreDuplicates: true });
    return existing as Profile;
  }
  const fullName =
    meta.full_name || meta.name || [meta.given_name, meta.family_name].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'New friend';
  const { data: created } = await supabase
    .from('profiles')
    .insert({ id: user.id, slug: slugify(fullName), full_name: fullName, avatar_url: avatar })
    .select('*')
    .single();
  await supabase.from('profile_private').upsert({ id: user.id, email: user.email ?? null });
  return (created as Profile) ?? null;
}

/** For pages that need a finished card. Sends people to login/onboarding otherwise. */
export async function requireProfile(here: string) {
  const s = await getSession();
  if (!s.user) redirect(`/login?next=${encodeURIComponent(here)}`);
  if (!s.profile || !s.profile.onboarded) redirect(`/onboarding?next=${encodeURIComponent(here)}`);
  return { supabase: s.supabase, user: s.user!, profile: s.profile! };
}
