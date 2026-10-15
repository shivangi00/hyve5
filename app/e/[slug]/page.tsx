import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { qrSvg } from '@/lib/qr';
import { APP_TZ, fmtTime, isLive, siteUrl } from '@/lib/util';
import { BrandMark } from '@/components/BrandMark';
import type { EventRow } from '@/lib/types';

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, user } = await getSession();
  const { data } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle();
  const event = data as EventRow | null;
  if (!event) notFound();

  const isHost = user?.id === event.created_by;
  const live = isLive(event);
  const svg = isHost ? await qrSvg(`${siteUrl()}/e/${event.slug}`) : null;

  return (
    <main className="shell">
      <div className="topbar">
        <Link href="/" className="brand"><BrandMark /></Link>
      </div>
      <section className="glass sheet rise" style={{ alignItems: 'center', textAlign: 'center', gap: 14 }}>
        <span className="label row" style={{ gap: 7 }}>{live && <span className="live-dot" />}{live ? 'Happening now' : 'Event'}</span>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>{event.name}</h1>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>
          {[event.venue, event.ends_at ? `until ${fmtTime(event.ends_at, APP_TZ)}` : null].filter(Boolean).join(' · ')}
        </p>
        {svg && (
          <>
            <div className="qr-wrap" role="img" aria-label="Event check-in QR code" dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="hint" style={{ margin: 0 }}>Print this for tables and the door. Scanning checks people in and gives them a card.</p>
          </>
        )}
      </section>
      <div className="bottom">
        <section className="glass sheet">
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45 }}>
            Check in to get your own bento card. Everyone you swap with tonight is saved to a follow-up stack for the ride home.
          </p>
          <a href={`/e/${event.slug}/checkin`} className="btn btn-primary btn-block">Check in</a>
        </section>
      </div>
    </main>
  );
}
