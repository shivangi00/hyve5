import Link from 'next/link';
import { requireProfile } from '@/lib/session';
import { Back } from '@/components/Icons';
import { Avatar } from '@/components/Avatar';
import { BellLink } from '@/components/BellLink';
import { APP_TZ, fmtDayDate } from '@/lib/util';
import { deleteContact, deleteForever, moveContact, restoreContact } from './actions';
import type { EventRow, Profile, Swap } from '@/lib/types';
import { SubmitButton } from '@/components/SubmitButton';

export const dynamic = 'force-dynamic';

const TABS = [
  { id: 'connect', label: 'To connect' },
  { id: 'later', label: 'Later' },
  { id: 'stack', label: 'Not sorted' },
  { id: 'deleted', label: 'Deleted' },
] as const;
type Tab = (typeof TABS)[number]['id'];

const STAGE: Record<Swap['stage'], string> = { met: 'Not messaged yet', messaged: 'Messaged', booked: 'Call booked', done: 'Done' };
const DONE_MSG: Record<string, string> = {
  moved: 'Contact moved.',
  deleted: 'Contact deleted. You can restore it here for 30 days.',
  restored: 'Contact restored.',
  purged: 'Contact permanently deleted.',
};

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ tab?: string; done?: string }> }) {
  const sp = await searchParams;
  const tab: Tab = (TABS.find((t) => t.id === sp.tab)?.id ?? 'connect') as Tab;
  const { supabase, profile: me } = await requireProfile('/contacts');

  const { data: rows } = await supabase.from('swaps').select('*').eq('owner_id', me.id).order('met_at', { ascending: false });
  const all = (rows as Swap[]) ?? [];
  const live = all.filter((s) => !s.deleted_at);
  const lists: Record<Tab, Swap[]> = {
    connect: live.filter((s) => s.decision === 'connect'),
    later: live.filter((s) => s.decision === 'skip'),
    stack: live.filter((s) => s.decision === 'pending'),
    deleted: all.filter((s) => s.deleted_at).sort((a, b) => (b.deleted_at ?? '').localeCompare(a.deleted_at ?? '')),
  };
  const shown = lists[tab];

  const ids = [...new Set(all.map((s) => s.contact_id))];
  const evIds = [...new Set(all.map((s) => s.event_id).filter(Boolean))] as string[];
  const [{ data: people }, { data: events }] = await Promise.all([
    ids.length ? supabase.from('profiles').select('*').in('id', ids) : Promise.resolve({ data: [] }),
    evIds.length ? supabase.from('events').select('id, name').in('id', evIds) : Promise.resolve({ data: [] }),
  ]);
  const byId = new Map(((people ?? []) as Profile[]).map((p) => [p.id, p]));
  const evName = new Map(((events ?? []) as Pick<EventRow, 'id' | 'name'>[]).map((e) => [e.id, e.name]));

  return (
    <main className="shell" style={{ gap: 12 }}>
      <div className="topbar">
        <Link href="/ride-home" className="icon-btn" aria-label="Back to Ride Home"><Back /></Link>
        <span className="topbar-title">Contacts</span>
        <BellLink userId={me.id} />
      </div>

      <nav className="seg" aria-label="Contact lists" style={{ alignSelf: 'stretch', overflowX: 'auto' }}>
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/contacts?tab=${t.id}`}
            aria-current={t.id === tab ? 'page' : undefined}
            className={`seg-link${t.id === tab ? ' on' : ''}`}
          >
            {t.label}
            {lists[t.id].length > 0 && <span className="seg-count">{lists[t.id].length}</span>}
          </Link>
        ))}
      </nav>

      {sp.done && DONE_MSG[sp.done] && (
        <p className="hint" role="status" style={{ margin: 0, color: '#9FF0BC' }}>{DONE_MSG[sp.done]}</p>
      )}

      {tab === 'stack' && lists.stack.length > 0 && (
        <Link href="/ride-home" className="btn btn-primary btn-block">Sort them in Ride Home</Link>
      )}

      <section className="glass sheet" style={{ gap: 8, borderRadius: 28, padding: 12 }}>
        {shown.length === 0 ? (
          <p className="muted" style={{ margin: 0, fontSize: 14, padding: 8, lineHeight: 1.45 }}>
            {tab === 'connect' && 'No one here yet. Swipe right in Ride Home to add people you want to follow up with.'}
            {tab === 'later' && 'People you swiped left on land here. Move them back any time.'}
            {tab === 'stack' && 'Everyone has been sorted.'}
            {tab === 'deleted' && 'Nothing deleted. Deleted contacts stay here for 30 days so you can restore them.'}
          </p>
        ) : (
          shown.map((s) => {
            const c = byId.get(s.contact_id);
            const name = c?.full_name ?? 'Unknown';
            const purgeOn = s.deleted_at ? new Date(new Date(s.deleted_at).getTime() + 30 * 86400e3).toISOString() : null;
            return (
              <div key={s.id} className="contact-row">
                <div className="row" style={{ gap: 12 }}>
                  <Avatar name={name} url={c?.avatar_url} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {tab === 'deleted' ? (
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{name}</div>
                    ) : (
                      <Link href={`/connect/${s.id}`} style={{ fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>{name}</Link>
                    )}
                    <div className="muted" style={{ fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c?.role_line ?? ''}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                      {tab === 'deleted' && purgeOn
                        ? `Deletes for good on ${fmtDayDate(purgeOn, APP_TZ)}`
                        : [`Met ${fmtDayDate(s.met_at, APP_TZ)}`, s.event_id ? evName.get(s.event_id) : null, tab === 'connect' ? STAGE[s.stage] : null].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>

                <div className="row contact-actions">
                  {tab === 'deleted' ? (
                    <>
                      <form action={restoreContact}><input type="hidden" name="id" value={s.id} /><SubmitButton className="btn btn-ghost btn-sm" pendingText="Restoring…">Restore</SubmitButton></form>
                      <form action={deleteForever}><input type="hidden" name="id" value={s.id} /><SubmitButton className="link-btn danger" pendingText="Deleting…">Delete now</SubmitButton></form>
                    </>
                  ) : (
                    <>
                      {tab !== 'connect' && <MoveButton id={s.id} to="connect" label="To connect" />}
                      {tab !== 'later' && <MoveButton id={s.id} to="later" label="Later" />}
                      {tab !== 'stack' && <MoveButton id={s.id} to="stack" label="Back to stack" />}
                      <form action={deleteContact}><input type="hidden" name="id" value={s.id} /><SubmitButton className="link-btn danger" pendingText="Deleting…">Delete</SubmitButton></form>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}

function MoveButton({ id, to, label }: { id: string; to: string; label: string }) {
  return (
    <form action={moveContact}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="to" value={to} />
      <SubmitButton className="btn btn-ghost btn-sm" pendingText="Moving…">{label}</SubmitButton>
    </form>
  );
}
