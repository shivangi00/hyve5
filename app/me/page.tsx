import Link from 'next/link';
import { requireProfile } from '@/lib/session';
import { BentoCard } from '@/components/BentoCard';
import { Pencil, Stack } from '@/components/Icons';
import { BrandMark } from '@/components/BrandMark';
import { ShareToggle } from './ShareToggle';
import { BellLink } from '@/components/BellLink';
import { PushPrompt } from '@/components/PushPrompt';
import { qrSvg } from '@/lib/qr';
import { isLive, siteUrl } from '@/lib/util';
import type { EventRow, Slot } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function MePage() {
  const { supabase, user, profile } = await requireProfile('/me');

  let event: EventRow | null = null;
  if (profile.active_event_id) {
    const { data } = await supabase.from('events').select('*').eq('id', profile.active_event_id).maybeSingle();
    event = (data as EventRow) ?? null;
  }

  const [{ data: slots }, { count: pending }, swappedHere, { data: priv }] = await Promise.all([
    supabase.from('slots').select('*').eq('owner_id', profile.id).gte('starts_at', new Date().toISOString()).order('starts_at'),
    supabase.from('swaps').select('id', { count: 'exact', head: true }).eq('owner_id', profile.id).is('deleted_at', null).eq('decision', 'pending'),
    event
      ? supabase.from('swaps').select('id', { count: 'exact', head: true }).eq('owner_id', profile.id).is('deleted_at', null).eq('event_id', event.id).then((r) => r.count ?? 0)
      : Promise.resolve(0),
    supabase.from('profile_private').select('email').eq('id', profile.id).maybeSingle(),
  ]);
  const { data: goingData } = event
    ? await supabase.from('profiles').select('id, full_name, avatar_url').eq('active_event_id', event.id).eq('onboarded', true).neq('id', profile.id).limit(50)
    : { data: [] };
  const going = (goingData ?? []) as { id: string; full_name: string; avatar_url: string | null }[];
  const email = (priv as { email: string | null } | null)?.email ?? user.email ?? null;

  // Swap requests waiting for you (sent from an event's Who's going list).
  const { data: incomingReqs } = await supabase.from('swap_requests').select('id, event_id').eq('to_id', profile.id).eq('status', 'pending');
  const waiting = (incomingReqs ?? []) as { id: string; event_id: string | null }[];
  let requestsHref = '/notifications';
  if (waiting.length && waiting[0]!.event_id) {
    const evId = waiting[0]!.event_id;
    const { data: evRow } = evId === event?.id ? { data: event } : await supabase.from('events').select('slug').eq('id', evId).maybeSingle();
    if (evRow?.slug) requestsHref = `/e/${evRow.slug}#requests`;
  }

  const cardUrl = `${siteUrl()}/c/${profile.slug}`;
  const svg = await qrSvg(cardUrl);
  const live = isLive(event);

  return (
    <main className="shell">
      <div className="topbar">
        <Link href="/me" className="brand"><BrandMark /></Link>
        <div className="row" style={{ gap: 8 }}>
          <Link href="/me/edit" className="icon-btn" aria-label="Edit my card"><Pencil /></Link>
          <BellLink userId={profile.id} />
          <Link href="/ride-home" className="icon-btn" aria-label={`Ride Home stack, ${pending ?? 0} to sort`}>
            <Stack />
            {!!pending && <span className="badge">{pending}</span>}
          </Link>
        </div>
      </div>

      <ShareToggle
        qrSvg={svg}
        cardUrl={cardUrl}
        eventName={live && event ? event.name : null}
        below={
          <>
            {waiting.length > 0 && (
              <Link href={requestsHref} className="glass row request-banner">
                <span className="badge static">{waiting.length}</span>
                <span style={{ flex: 1 }}>{waiting.length === 1 ? 'Someone wants to swap cards with you' : `${waiting.length} people want to swap cards with you`}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>View</span>
              </Link>
            )}
            <PushPrompt />
          </>
        }
        card={<BentoCard profile={profile} event={event} swappedHere={swappedHere} slots={(slots as Slot[]) ?? []} mode="owner" email={email} going={going} />}
      />
    </main>
  );
}
