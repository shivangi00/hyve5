import Link from 'next/link';
import { requireProfile } from '@/lib/session';
import { Back } from '@/components/Icons';
import { Avatar } from '@/components/Avatar';
import { BellLink } from '@/components/BellLink';
import { SwipeStack, type StackCard } from './SwipeStack';
import { scoreMatch } from '@/lib/match';
import { APP_TZ, STATUS, fmtTime, timeLeft } from '@/lib/util';
import type { EventRow, Profile, Swap } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function RideHomePage() {
  const { supabase, profile: me } = await requireProfile('/ride-home');

  const { data: swapRows } = await supabase
    .from('swaps')
    .select('*')
    .eq('owner_id', me.id)
    .neq('decision', 'skip')
    .order('met_at', { ascending: false });
  const swaps = (swapRows as Swap[]) ?? [];

  const contactIds = [...new Set(swaps.map((s) => s.contact_id))];
  const eventIds = [...new Set(swaps.map((s) => s.event_id).filter(Boolean))] as string[];
  const [{ data: people }, { data: events }, { count: skipped }] = await Promise.all([
    contactIds.length ? supabase.from('profiles').select('*').in('id', contactIds) : Promise.resolve({ data: [] }),
    eventIds.length ? supabase.from('events').select('*').in('id', eventIds) : Promise.resolve({ data: [] }),
    supabase.from('swaps').select('id', { count: 'exact', head: true }).eq('owner_id', me.id).eq('decision', 'skip'),
  ]);
  const byId = new Map(((people ?? []) as Profile[]).map((p) => [p.id, p]));
  const evById = new Map(((events ?? []) as EventRow[]).map((e) => [e.id, e]));

  const pending: StackCard[] = swaps
    .filter((s) => s.decision === 'pending' && byId.has(s.contact_id))
    .map((s) => {
      const c = byId.get(s.contact_id)!;
      const m = scoreMatch(me, c, s.note);
      return {
        swapId: s.id,
        name: c.full_name,
        avatar: c.avatar_url,
        role: c.role_line,
        status: STATUS[c.status].label,
        statusColor: STATUS[c.status].color,
        note: s.note,
        metAt: fmtTime(s.met_at, APP_TZ),
        eventName: s.event_id ? evById.get(s.event_id)?.name ?? null : null,
        why: m.why,
        strong: m.strong,
        score: m.score,
        metMs: new Date(s.met_at).getTime(),
      };
    })
    .sort((a, b) => b.score - a.score || b.metMs - a.metMs);

  const following = swaps.filter((s) => s.decision === 'connect' && s.stage !== 'done' && byId.has(s.contact_id));
  const headerEvent = pending[0]?.eventName ?? (swaps[0]?.event_id ? evById.get(swaps[0].event_id)?.name : null) ?? 'Your swaps';
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: APP_TZ }).toUpperCase().split(' ');

  return (
    <main className="shell" style={{ gap: 12 }}>
      <div className="topbar">
        <Link href="/me" className="icon-btn" aria-label="Back to my card"><Back /></Link>
        <span className="topbar-title">Ride Home</span>
        <BellLink userId={me.id} />
      </div>

      <div className="glass row" style={{ borderRadius: 26, padding: '13px 14px', gap: 12 }}>
        <div className="round" style={{ width: 44, height: 44, borderRadius: 15, flexDirection: 'column', lineHeight: 1, display: 'flex', justifyContent: 'center' }}>
          <span className="mono" style={{ fontSize: 9, letterSpacing: '.08em', color: 'var(--ink-2)' }}>{today[1]}</span>
          <span style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>{today[0]}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{headerEvent}</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            {pending.length ? `${pending.length} to sort · best matches first` : 'All sorted'}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11.5, lineHeight: 1.5 }}>
          <div style={{ color: '#9FF0BC' }}>{following.length} to follow up</div>
          <div className="muted">{skipped ?? 0} archived</div>
        </div>
      </div>

      {pending.length > 0 ? (
        <SwipeStack cards={pending} />
      ) : swaps.length === 0 ? (
        <section className="glass sheet rise">
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>No swaps yet</h1>
          <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.45 }}>
            Show your QR to someone. When they scan it and swap, they land here, ready to sort on your way home.
          </p>
          <Link href="/me" className="btn btn-primary btn-block">Show my QR</Link>
        </section>
      ) : null}

      {following.length > 0 && (
        <section className="glass sheet" style={{ gap: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Follow up</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>Message within 3 hours, book a call within 7 days.</p>
          </div>
          {following.map((s) => {
            const c = byId.get(s.contact_id)!;
            const met = new Date(s.met_at).getTime();
            const deadline =
              s.stage === 'met'
                ? { text: `Message · ${timeLeft(new Date(met + 3 * 3600e3).toISOString())}`, hot: true }
                : s.stage === 'messaged'
                  ? { text: `Book call · ${timeLeft(new Date(met + 7 * 86400e3).toISOString())}`, hot: false }
                  : { text: 'Call booked', hot: false };
            return (
              <Link key={s.id} href={`/connect/${s.id}`} className="list-row">
                <Avatar name={c.full_name} url={c.avatar_url} size={42} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600 }}>{c.full_name}</span>
                  <span className="muted" style={{ display: 'block', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.role_line}</span>
                </span>
                <span style={{ fontSize: 12, color: deadline.hot ? '#FFC2B3' : 'var(--ink-2)', textAlign: 'right' }}>{deadline.text}</span>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}
