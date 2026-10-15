import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureProfile } from '@/lib/session';
import { safeNext } from '@/lib/util';

// Google's own sign-in button signs people in on the page (no redirect through Supabase).
// The page then comes here so we can make sure their card exists and send them onward.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get('next'));
  const origin = url.origin;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Google sign-in did not finish. Please try again.')}`);

  const profile = await ensureProfile(supabase, user);
  const dest = profile?.onboarded ? next : `/onboarding?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(`${origin}${dest}`);
}
