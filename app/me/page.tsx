import Link from 'next/link';
import { requireProfile } from '@/lib/session';
import { BentoCard } from '@/components/BentoCard';
import { Pencil, Plus, Stack } from '@/components/Icons';
import { ShareToggle } from './ShareToggle';
import { BellLink } from '@/components/BellLink';
import { PushPrompt } from '@/components/PushPrompt';
import { qrSvg } from '@/lib/qr';
import { isLive, siteUrl } from '@/lib/util';
import type { EventRow, Slot } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function MePage() {
  const { supabase, profile } = await requireProfile('/me');

  let event: EventRow | null = null;
  if (profile.active_event_id) {
    const { data } = await supabase.from('events').select('*').eq('id', profile.active_event_id).maybeSingle();
    event = (data as EventRow) ?? null;
  }

  const [{ data: slots }, { count: pending }, swappedHere] = await Promise.all([
    supabase.from('slots').select('*').eq('owner_id', profile.id).gte('starts_at', new Date().toISOString()).order('starts_at'),
    supabase.from('swaps').select('id', { count: 'exact', head: true }).eq('owner_id', profile.id).eq('decision', 'pending'),
    event
      ? supabase.from('swaps').select('id', { count: 'exact', head: true }).eq('owner_id', profile.id).eq('event_id', event.id).then((r) => r.count ?? 0)
      : Promise.resolve(0),
  ]);

  const cardUrl = `${siteUrl()}/c/${profile.slug}`;
  const svg = await qrSvg(cardUrl);
  const live = isLive(event);

  return (
    <main className="shell">
      <div className="topbar">
        <Link href="/me" className="brand"><span className="brand-mark"><Plus size={14} /></span>NetworkPulse</Link>
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
        below={<PushPrompt />}
        card={<BentoCard profile={profile} event={event} swappedHere={swappedHere} slots={(slots as Slot[]) ?? []} mode="owner" />}
      />
    </main>
  );
}
