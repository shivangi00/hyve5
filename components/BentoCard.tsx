import Link from 'next/link';
import type { EventRow, Profile, Slot } from '@/lib/types';
import { APP_TZ, fmtDay, fmtEventWhen, fmtTime, isLive, isUpcoming } from '@/lib/util';
import { Avatar } from './Avatar';
import { StatusPill } from './StatusPill';
import { Plus } from './Icons';
import { LinksOrbit } from './LinksOrbit';
import { cardLinks } from '@/lib/links';
import { BookingTile } from './BookingTile';

type Props = {
  profile: Profile;
  event: EventRow | null;
  swappedHere?: number;
  slots: Slot[];
  mode: 'owner' | 'public';
  viewer?: { name: string; email: string } | null;
  /** The card owner's email. Shown to the owner and to people they've swapped with. */
  email?: string | null;
  /** Public card only: has the viewer already swapped with this person? */
  swapped?: boolean;
  /** Owner card: other people attending the same event. */
  going?: { id: string; full_name: string; avatar_url: string | null }[];
};

export function BentoCard({ profile, event, swappedHere = 0, slots, mode, viewer, email, swapped, going = [] }: Props) {
  const live = isLive(event);
  const upcoming = !live && isUpcoming(event);
  const openSlots = slots
    .filter((s) => !s.booked_at && new Date(s.starts_at).getTime() > Date.now())
    .slice(0, 3)
    .map((s) => ({ id: s.id, day: fmtDay(s.starts_at, APP_TZ), time: fmtTime(s.starts_at, APP_TZ) }));

  return (
    <section className="glass bento rise" aria-label={`${profile.full_name}'s card`}>
      <div className="tile span-2 row" style={{ padding: 16, gap: 14 }}>
        <Avatar name={profile.full_name} url={profile.avatar_url} size={74} />
        <div className="stack" style={{ gap: 6, minWidth: 0 }}>
          <h1 className="name" style={{ margin: 0 }}>{profile.full_name}</h1>
          {profile.role_line && <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.3 }}>{profile.role_line}</div>}
          <div><StatusPill status={profile.status} /></div>
        </div>
      </div>

      {profile.headline && profile.headline !== profile.role_line && (
        <div className="tile span-2" style={{ fontSize: 14.5, lineHeight: 1.45 }}>
          {profile.headline}
        </div>
      )}

      {/* Event tile */}
      {(live || upcoming) && event ? (
        <div className="tile stack" style={{ justifyContent: 'space-between', minHeight: 150 }}>
          <div className="label row" style={{ gap: 7 }}>
            {live && <span className="live-dot" />}
            {live ? 'Attending now' : 'Attending'}
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{event.name}</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.35 }}>
              {fmtEventWhen(event, APP_TZ)}
              {event.venue && <><br />{event.venue}</>}
            </div>
          </div>
          {mode === 'owner' ? (
            <div className="stack" style={{ gap: 8, fontSize: 12, color: 'var(--ink-2)' }}>
              {/* Who's going (from invites or check-in) — tap for the list and the invite link. */}
              <Link href={`/e/${event.slug}`} className="row" style={{ gap: 8, textDecoration: 'none', color: 'inherit' }}>
                {going.length > 0 ? (
                  <>
                    <span className="avatar-stack">
                      {going.slice(0, 3).map((p) => <Avatar key={p.id} name={p.full_name} url={p.avatar_url} size={22} />)}
                    </span>
                    <span>{going.length} going</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--accent)' }}>Invite people going</span>
                )}
              </Link>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span>{live ? `${swappedHere} swapped` : 'Coming up'}</span>
                <Link href="/events/new" style={{ fontSize: 12 }}>Change</Link>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{live ? 'Swap to join the same stack' : 'See you there'}</div>
          )}
        </div>
      ) : mode === 'owner' ? (
        <Link href="/events/new" className="tile stack" style={{ minHeight: 150, justifyContent: 'space-between', textDecoration: 'none' }}>
          <span className="label">At an event?</span>
          <span style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.25 }}>Add it, so everyone you meet is tagged</span>
          <span className="orb" style={{ position: 'static', transform: 'none', width: 34, height: 34 }}><Plus /></span>
        </Link>
      ) : (
        <div className="tile stack" style={{ minHeight: 150, justifyContent: 'space-between' }}>
          <span className="label">Ask me about</span>
          <span style={{ fontSize: 14, lineHeight: 1.35 }}>{profile.topics.slice(0, 3).join(', ') || 'Say hello'}</span>
        </div>
      )}

      {/* Links circle: centre button adds links (owner) or opens the full list (visitors) */}
      {(() => {
        const { linked, empty } = cardLinks(profile, email ?? null);
        return (
          <LinksOrbit
            mode={mode}
            linked={linked}
            empty={empty}
            name={profile.full_name}
            vcardHref={mode === 'public' && swapped ? `/c/${profile.slug}/vcard` : null}
          />
        );
      })()}

      {/* Booking */}
      <div id="book" className="tile span-2 stack" style={{ gap: 10 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>15-min call this week</span>
          {mode === 'owner' ? (
            <Link href="/me/edit#times" style={{ fontSize: 12, color: 'var(--ink-2)' }}>Edit times</Link>
          ) : (
            <span className="label">Video</span>
          )}
        </div>
        {mode === 'public' ? (
          <BookingTile slots={openSlots} ownerSlug={profile.slug} ownerName={profile.full_name} viewer={viewer ?? null} />
        ) : openSlots.length ? (
          <div className="slots">
            {openSlots.map((s) => (
              <div key={s.id} className="slot"><small>{s.day}</small><b>{s.time}</b></div>
            ))}
          </div>
        ) : (
          <Link href="/me/edit#times" className="muted" style={{ fontSize: 13 }}>Add a few open times so people can book you.</Link>
        )}
      </div>

      {profile.topics.length > 0 && (mode === 'owner' || (live && event)) && (
        <div className="tile span-2 stack" style={{ gap: 10 }}>
          <span className="label">Ask me about</span>
          <div className="chips">
            {profile.topics.map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
        </div>
      )}
    </section>
  );
}

