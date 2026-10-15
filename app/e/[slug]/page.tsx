import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { qrSvg } from '@/lib/qr';
import { APP_TZ, firstName, fmtEventWhen, isLive, siteUrl } from '@/lib/util';
import { BrandMark } from '@/components/BrandMark';
import { Avatar } from '@/components/Avatar';
import { InviteToEvent } from '@/components/InviteToEvent';
import { PendingLink } from '@/components/PendingLink';
import { Back } from '@/components/Icons';
import type { EventRow, Profile } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { supabase } = await getSession();
  const { data } = await supabase.from('events').select('name, venue').eq('slug', slug).maybeSingle();
  return data ? { title: `${data.name} · hyve5`, description: `Going to ${data.name}? Set up your card and swap when you meet.` } : { title: 'hyve5' };
}

type Attendee = Pick<Profile, 'id' | 'slug' | 'full_name' | 'avatar_url' | 'role_line'>;

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ by?: string; joined?: string; ended?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase, user, profile } = await getSession();
  const { data } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle();
  const event = data as EventRow | null;
  if (!event) notFound();

  const live = isLive(event);
  const ended = !!event.ends_at && Date.parse(event.ends_at) < Date.now() - 30 * 60e3;
  const attending = !!profile && profile.active_event_id === event.id;
  const isOrganiser = user?.id === event.created_by && !!event.organised;

  const [{ data: people }, { data: inviterData }] = await Promise.all([
    supabase.from('profiles').select('id, slug, full_name, avatar_url, role_line').eq('active_event_id', event.id).eq('onboarded', true).limit(100),
    sp.by ? supabase.from('profiles').select('id, slug, full_name, avatar_url, role_line').eq('slug', sp.by).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const going = ((people ?? []) as Attendee[]).filter((p) => p.id !== profile?.id);
  const inviter = inviterData as Attendee | null;

  const when = fmtEventWhen(event, APP_TZ);
  // The invite carries your card, so people who join show up for you (and you get a heads-up).
  const inviteLink = `${siteUrl()}/e/${event.slug}${profile ? `?by=${profile.slug}` : ''}`;
  const joinHref = `/e/${event.slug}/checkin${sp.by ? `?by=${encodeURIComponent(sp.by)}` : ''}`;
  const svg = isOrganiser ? await qrSvg(`${siteUrl()}/e/${event.slug}`) : null;

  return (
    <main className="shell">
      <div className="topbar">
        {user ? <Link href="/me" className="icon-btn" aria-label="Back to my card"><Back /></Link> : <Link href="/" className="brand"><BrandMark /></Link>}
        {user && <span className="topbar-title">Event</span>}
        {user && <span style={{ width: 44 }} />}
      </div>

      {sp.joined && attending && (
        <p className="pill rise" role="status" style={{ alignSelf: 'center', height: 34, fontSize: 13, background: 'rgba(18, 18, 20,.7)', margin: 0 }}>
          You're going. See you there!
        </p>
      )}

      <section className="glass sheet rise" style={{ gap: 12 }}>
        {inviter && inviter.id !== profile?.id && !attending && (
          <div className="row" style={{ gap: 10 }}>
            <Avatar name={inviter.full_name} url={inviter.avatar_url} size={34} />
            <span style={{ fontSize: 13.5 }}><strong>{firstName(inviter.full_name)}</strong> <span className="muted">invited you</span></span>
          </div>
        )}
        <span className="label row" style={{ gap: 7 }}>
          {live && <span className="live-dot" />}
          {ended ? 'Finished' : live ? 'Happening now' : 'Upcoming event'}
        </span>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{event.name}</h1>
        <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.45 }}>
          {when}
          {event.venue && <><br />{event.venue}</>}
        </p>

        {/* Who's going: attendees see names; everyone else sees faces and a count. */}
        {going.length > 0 && !attending && (
          <div className="row" style={{ gap: 10 }}>
            <div className="avatar-stack">
              {going.slice(0, 5).map((p) => <Avatar key={p.id} name={p.full_name} url={p.avatar_url} size={30} />)}
            </div>
            <span className="muted" style={{ fontSize: 13 }}>{going.length} {going.length === 1 ? 'person is' : 'people are'} going</span>
          </div>
        )}
      </section>

      {attending && !ended && (
        <section className="glass sheet" style={{ gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Know anyone going?</h2>
            <p className="hint" style={{ margin: '4px 0 0' }}>Send them this. They set up their card before the event and show up here, so you can find each other and swap when you meet.</p>
          </div>
          <InviteToEvent link={inviteLink} eventName={event.name} when={when} />
        </section>
      )}

      {attending && (
        <section className="glass sheet" style={{ gap: 6 }}>
          <span className="label">Who's going · {going.length}</span>
          {going.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>No one else yet. Share the invite and they'll appear here.</p>
          ) : (
            going.map((p) => (
              <div key={p.id} className="row" style={{ gap: 12, padding: '6px 0' }}>
                <Avatar name={p.full_name} url={p.avatar_url} size={40} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.full_name}</div>
                  {p.role_line && <div className="muted" style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.role_line}</div>}
                </div>
              </div>
            ))
          )}
          {going.length > 0 && <p className="hint" style={{ margin: '4px 0 0' }}>When you meet, scan each other's card QR to swap. You'll both land in this event's stack.</p>}
        </section>
      )}

      {svg && (
        <section className="glass sheet" style={{ alignItems: 'center', textAlign: 'center', gap: 10 }}>
          <span className="label">Door check-in QR (organiser)</span>
          <div className="qr-wrap" role="img" aria-label="Event check-in QR code" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="hint" style={{ margin: 0 }}>Print this for tables and the door. Scanning marks people as attending and gives them a card.</p>
        </section>
      )}

      {!attending && (
        <div className="bottom">
          <section className="glass sheet">
            {ended || sp.ended ? (
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45 }}>This event has finished.</p>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45 }}>
                  {user ? 'Say you\'re going and you\'ll see who else is. ' : 'Set up your card in about a minute (no app). '}
                  When you meet people there, scan and swap cards, and everyone lands in one follow-up stack.
                </p>
                <PendingLink href={joinHref} className="btn btn-primary btn-block" pendingText={user ? 'Joining…' : 'Opening…'}>
                  {live ? "I'm here" : "I'm going"}
                </PendingLink>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
