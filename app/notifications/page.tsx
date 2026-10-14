import Link from 'next/link';
import { requireProfile } from '@/lib/session';
import { Back, Bell, Clock } from '@/components/Icons';
import { PushPrompt } from '@/components/PushPrompt';
import { APP_TZ, fmtDayDate, fmtTime, timeLeft } from '@/lib/util';
import { MarkRead } from './MarkRead';

export const dynamic = 'force-dynamic';

type Row = { id: string; kind: string; title: string; body: string | null; link: string | null; created_at: string; read_at: string | null };

function ago(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${fmtDayDate(iso, APP_TZ)}, ${fmtTime(iso, APP_TZ)}`;
}

export default async function NotificationsPage() {
  const { supabase, profile } = await requireProfile('/notifications');

  const [{ data: rows }, { data: upcoming }] = await Promise.all([
    supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(50),
    supabase
      .from('reminders')
      .select('id, kind, due_at, swap_id')
      .eq('owner_id', profile.id)
      .is('sent_at', null)
      .is('cleared_at', null)
      .order('due_at')
      .limit(5),
  ]);
  const list = (rows as Row[]) ?? [];
  const unread = list.filter((r) => !r.read_at).length;

  // Names for the "coming up" list.
  const swapIds = (upcoming ?? []).map((u) => u.swap_id);
  const { data: swaps } = swapIds.length ? await supabase.from('swaps').select('id, contact_id').in('id', swapIds) : { data: [] as { id: string; contact_id: string }[] };
  const contactIds = (swaps ?? []).map((s) => s.contact_id);
  const { data: people } = contactIds.length ? await supabase.from('profiles').select('id, full_name').in('id', contactIds) : { data: [] as { id: string; full_name: string }[] };
  const nameBySwap = new Map((swaps ?? []).map((s) => [s.id, (people ?? []).find((p) => p.id === s.contact_id)?.full_name ?? 'someone']));
  const LABEL: Record<string, string> = { message_3h: 'Message', followup_d3: 'Nudge', lastcall_d7: 'Last call:' };

  return (
    <main className="shell" style={{ gap: 12 }}>
      <div className="topbar">
        <Link href="/me" className="icon-btn" aria-label="Back to my card"><Back /></Link>
        <span className="topbar-title">Notifications</span>
        <span style={{ width: 44 }} />
      </div>

      <PushPrompt showWhenOn />

      {(upcoming ?? []).length > 0 && (
        <section className="glass sheet" style={{ gap: 4, borderRadius: 28, padding: 14 }}>
          <span className="label" style={{ padding: '2px 4px 6px' }}>Coming up</span>
          {(upcoming ?? []).map((u) => (
            <Link key={u.id} href={`/connect/${u.swap_id}`} className="row" style={{ gap: 12, padding: '8px 4px', textDecoration: 'none' }}>
              <Clock size={16} color="#FFB09C" />
              <span style={{ flex: 1, fontSize: 14 }}>{LABEL[u.kind] ?? 'Follow up with'} {nameBySwap.get(u.swap_id)}</span>
              <span className="muted" style={{ fontSize: 12 }}>in {timeLeft(u.due_at)}</span>
            </Link>
          ))}
        </section>
      )}

      <section className="glass sheet" style={{ gap: 8, borderRadius: 28, padding: 14 }}>
        {list.length === 0 ? (
          <div className="stack" style={{ alignItems: 'center', textAlign: 'center', padding: '18px 8px', gap: 8 }}>
            <Bell size={22} />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Nothing yet</p>
            <p className="muted" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.45 }}>
              When someone swaps with you, books a call, or a follow-up is due, it shows up here.
            </p>
          </div>
        ) : (
          list.map((n) => {
            const inner = (
              <>
                <span
                  aria-hidden="true"
                  style={{ width: 8, height: 8, borderRadius: 4, flex: 'none', marginTop: 7, background: n.read_at ? 'transparent' : 'var(--accent)' }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: n.read_at ? 500 : 600 }}>{n.title}</span>
                  {n.body && <span className="muted" style={{ display: 'block', fontSize: 13, lineHeight: 1.4, marginTop: 2 }}>{n.body}</span>}
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4 }}>{ago(n.created_at)}</span>
                </span>
              </>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} className="list-row" style={{ alignItems: 'flex-start' }}>{inner}</Link>
            ) : (
              <div key={n.id} className="list-row" style={{ alignItems: 'flex-start' }}>{inner}</div>
            );
          })
        )}
      </section>

      {unread > 0 && <MarkRead />}
    </main>
  );
}
