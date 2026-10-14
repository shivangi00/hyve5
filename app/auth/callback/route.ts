import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureProfile } from '@/lib/session';
import { safeNext } from '@/lib/util';

// OAuth lands here. We exchange the code for a session, make sure a card exists
// (name + photo from LinkedIn/Google), then send people to onboarding or onward.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));
  const origin = url.origin;

  if (!code) return NextResponse.redirect(`${origin}/login?error=missing_code`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const profile = await ensureProfile(supabase, user);
  const dest = profile?.onboarded ? next : `/onboarding?next=${encodeURIComponent(next)}`;

  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocal = process.env.NODE_ENV === 'development';
  const base = !isLocal && forwardedHost ? `https://${forwardedHost}` : origin;
  return NextResponse.redirect(`${base}${dest}`);
}
