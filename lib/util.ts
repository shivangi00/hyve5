import type { EventRow, Status } from './types';

export const STATUS: Record<Status, { label: string; color: string }> = {
  open: { label: 'Open to work', color: '#4ADE80' },
  hiring: { label: 'Hiring', color: '#B79CFF' },
  collab: { label: 'Open to collabs', color: '#FFB86B' },
};

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export function firstName(name: string) {
  return name.split(/\s+/)[0] || name;
}

export function slugify(text: string) {
  const base = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  return `${base || 'card'}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Safe redirect target: only same-site paths. */
export function safeNext(next: string | null | undefined, fallback = '/me') {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback;
  return next;
}

const FREE_MAIL = ['gmail', 'googlemail', 'outlook', 'hotmail', 'live', 'yahoo', 'icloud', 'me', 'proton', 'protonmail', 'aol', 'gmx', 'msn'];

/** "priya@lumenhealth.com" → "at Lumenhealth". Empty for personal email providers. */
export function companyFromEmail(email: string | null | undefined) {
  if (!email || !email.includes('@')) return '';
  const domain = email.split('@')[1]!.toLowerCase();
  const name = domain.split('.')[0]!;
  if (FREE_MAIL.includes(name)) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Matches the database: an event counts as "on" from 30 minutes before it starts to 30 minutes after it ends. */
const EVENT_GRACE = 30 * 60e3;

export function isLive(ev: Pick<EventRow, 'starts_at' | 'ends_at'> | null | undefined) {
  if (!ev) return false;
  const now = Date.now();
  const started = !ev.starts_at || new Date(ev.starts_at).getTime() - EVENT_GRACE <= now;
  const notEnded = !ev.ends_at || new Date(ev.ends_at).getTime() + EVENT_GRACE >= now;
  return started && notEnded;
}

/** Later today or on a future date, not started yet. */
export function isUpcoming(ev: Pick<EventRow, 'starts_at' | 'ends_at'> | null | undefined) {
  if (!ev?.starts_at) return false;
  return new Date(ev.starts_at).getTime() - EVENT_GRACE > Date.now();
}

/** "Today · 18:00–21:00" or "Sat 18 Oct · 18:00–21:00" */
export function fmtEventWhen(ev: Pick<EventRow, 'starts_at' | 'ends_at'>, tz?: string) {
  const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { timeZone: tz });
  const start = ev.starts_at ? new Date(ev.starts_at) : null;
  const label = start ? (day(start.toISOString()) === day(new Date().toISOString()) ? 'Today' : fmtDayDate(start.toISOString(), tz)) : 'Today';
  const range = [start ? fmtTime(start.toISOString(), tz) : null, ev.ends_at ? fmtTime(ev.ends_at, tz) : null].filter(Boolean).join('–');
  return range ? `${label} · ${range}` : label;
}

export function fmtTime(iso: string, tz?: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz });
}

export function fmtDay(iso: string, tz?: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', timeZone: tz });
}

export function fmtDayDate(iso: string, tz?: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz });
}

/** "2h 14m" / "6 days" / "overdue" */
export function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'overdue';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ${mins % 60}m`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? '' : 's'}`;
}

export const APP_TZ = process.env.NEXT_PUBLIC_APP_TZ || 'Europe/London';

/**
 * Turns whatever someone pastes into a clean LinkedIn profile link.
 * "linkedin.com/in/jane-doe", "https://uk.linkedin.com/in/jane-doe/?trk=x", "in/jane-doe", "jane-doe"
 *   → "https://www.linkedin.com/in/jane-doe". Returns null for empty input.
 */
export function normaliseLinkedIn(input: string | null | undefined): string | null {
  const raw = (input ?? '').trim();
  if (!raw) return null;
  const m = raw.match(/linkedin\.com\/(in|company)\/([^/?#\s]+)/i);
  if (m) return `https://www.linkedin.com/${m[1]!.toLowerCase()}/${m[2]}`;
  const short = raw.replace(/^@/, '').replace(/^\/?in\//i, '').replace(/\/+$/, '');
  if (/^[a-z0-9-_%.]{3,100}$/i.test(short)) return `https://www.linkedin.com/in/${short}`;
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}
