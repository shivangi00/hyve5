import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { notify } from '@/lib/notify';
import { firstName } from '@/lib/util';

// "I'm going" / "Check in". Works from an invite link (?by=their-card-slug) before the event,
// or from the organiser's door QR during it. Login and onboarding bounce back here.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(request.url);
  const origin = url.origin;
  const by = url.searchParams.get('by');
  const here = `/e/${slug}/checkin${by ? `?by=${encodeURIComponent(by)}` : ''}`;
  const { supabase, user, profile } = await getSession();

  if (!user) return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(here)}`);
  if (!profile?.onboarded) return NextResponse.redirect(`${origin}/onboarding?next=${encodeURIComponent(here)}`);

  const { data: ev } = await supabase.from('events').select('id, name, slug, ends_at').eq('slug', slug).maybeSingle();
  if (!ev) return NextResponse.redirect(`${origin}/me`);
  if (ev.ends_at && Date.parse(ev.ends_at) < Date.now() - 30 * 60e3) return NextResponse.redirect(`${origin}/e/${slug}?ended=1`);

  const already = profile.active_event_id === ev.id;
  if (!already) {
    await supabase.from('profiles').update({ active_event_id: ev.id }).eq('id', user.id);

    // Let the person who shared the link know (once).
    if (by && by !== profile.slug) {
      const { data: inviter } = await supabase.from('profiles').select('id').eq('slug', by).maybeSingle();
      if (inviter && inviter.id !== user.id) {
        await notify(inviter.id, {
          kind: 'event_join',
          title: `${firstName(profile.full_name)} is going to ${ev.name}`,
          body: 'They joined from your invite link. Swap cards when you meet.',
          link: `/e/${ev.slug}`,
        });
      }
    }
  }
  return NextResponse.redirect(`${origin}/e/${slug}?joined=1`);
}
