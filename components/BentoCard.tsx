import Link from 'next/link';
import type { EventRow, Profile, Slot } from '@/lib/types';
import { APP_TZ, fmtDay, fmtTime, isLive } from '@/lib/util';
import { Avatar } from './Avatar';
import { StatusPill } from './StatusPill';
import { Globe, Mail, Plus } from './Icons';
import { BookingTile } from './BookingTile';

type Props = {
  profile: Profile;
  event: EventRow | null;
  swappedHere?: number;
  slots: Slot[];
  mode: 'owner' | 'public';
  viewer?: { name: string; email: string } | null;
};

export function BentoCard({ profile, event, swappedHere = 0, slots, mode, viewer }: Props) {
  const live = isLive(event);
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
      {live && event ? (
        <div className="tile stack" style={{ justifyContent: 'space-between', minHeight: 150 }}>
          <div className="label row" style={{ gap: 7 }}>
            <span className="live-dot" />
            Attending now
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{event.name}</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
              {event.ends_at ? `Today · until ${fmtTime(event.ends_at, APP_TZ)}` : event.venue || 'Today'}
            </div>
          </div>
          {mode === 'owner' ? (
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-2)' }}>
              <span>{swappedHere} swapped</span>
              <Link href="/events/new" style={{ fontSize: 12 }}>Change</Link>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>Swap to be tagged here too</div>
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

      {/* Socials orbit */}
      <div className="tile orbit">
        <svg className="lines" viewBox="0 0 160 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <path d="M80 75 Q 55 60 44 40 M80 75 Q 105 60 116 40 M80 75 Q 55 90 44 110 M80 75 Q 105 90 116 110" stroke="rgba(255,255,255,.14)" strokeWidth="1" fill="none" />
        </svg>
        <span className="orb"><Plus /></span>
        <Sat cls="tl" href={profile.linkedin_url} label="LinkedIn">in</Sat>
        <Sat cls="tr" href={profile.x_url} label="X">X</Sat>
        <Sat cls="bl" href="#book" label="Book a call"><Mail /></Sat>
        <Sat cls="br" href={profile.website_url} label="Website"><Globe /></Sat>
      </div>

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

function Sat({ cls, href, label, children }: { cls: string; href: string | null; label: string; children: React.ReactNode }) {
  if (!href) return <span className={`sat ${cls} off`} aria-hidden="true">{children}</span>;
  const external = href.startsWith('http');
  return (
    <a className={`sat ${cls}`} href={href} aria-label={label} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
      {children}
    </a>
  );
}
