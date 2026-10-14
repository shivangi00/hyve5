import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const origin = new URL(request.url).origin;
  const here = `/e/${slug}/checkin`;
  const { supabase, user, profile } = await getSession();

  if (!user) return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(here)}`);
  if (!profile?.onboarded) return NextResponse.redirect(`${origin}/onboarding?next=${encodeURIComponent(here)}`);

  const { data: ev } = await supabase.from('events').select('id').eq('slug', slug).maybeSingle();
  if (!ev) return NextResponse.redirect(`${origin}/me`);

  await supabase.from('profiles').update({ active_event_id: ev.id }).eq('id', user.id);
  return NextResponse.redirect(`${origin}/me`);
}
