import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { notify } from '@/lib/notify';

// The "Swap cards" button lands here. Login and onboarding bounce back to this URL,
// so the whole flow is: scan → tap → LinkedIn → one line → swapped.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const origin = new URL(request.url).origin;
  const here = `/c/${slug}/swap`;
  const { supabase, user, profile } = await getSession();

  if (!user) return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(here)}`);
  if (!profile?.onboarded) return NextResponse.redirect(`${origin}/onboarding?next=${encodeURIComponent(here)}`);

  const { data: host } = await supabase.from('profiles').select('id').eq('slug', slug).maybeSingle();
  const { count: before } = host
    ? await supabase.from('swaps').select('id', { count: 'exact', head: true }).eq('owner_id', user.id).eq('contact_id', host.id).is('deleted_at', null)
    : { count: 0 };

  const { error } = await supabase.rpc('swap_cards', { host_slug: slug });
  if (error) {
    console.error('swap_cards failed', error);
    return NextResponse.redirect(`${origin}/c/${slug}?error=swap`);
  }

  // Tell the host (only the first time these two swap).
  if (host && host.id !== user.id && !before) {
    await notify(host.id, {
      kind: 'swap',
      title: `${profile.full_name} swapped cards with you`,
      body: profile.role_line ?? 'Saved to your Ride Home stack.',
      link: '/ride-home',
    });
  }

  return NextResponse.redirect(`${origin}/c/${slug}?swapped=1`);
}
