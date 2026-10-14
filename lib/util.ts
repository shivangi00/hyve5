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

export function isLive(ev: Pick<EventRow, 'ends_at'> | null | undefined) {
  if (!ev) return false;
  return !ev.ends_at || new Date(ev.ends_at).getTime() > Date.now();
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
