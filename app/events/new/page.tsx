import Link from 'next/link';
import { requireProfile } from '@/lib/session';
import { Back } from '@/components/Icons';
import { createEvent, leaveEvent } from '../actions';
import { EventTimeInputs } from './EventTimeInputs';
import { APP_TZ, fmtEventWhen, isLive } from '@/lib/util';
import type { EventRow } from '@/lib/types';
import { SubmitButton } from '@/components/SubmitButton';

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const { supabase, profile } = await requireProfile('/events/new');
  let current: EventRow | null = null;
  if (profile.active_event_id) {
    const { data } = await supabase.from('events').select('*').eq('id', profile.active_event_id).maybeSingle();
    current = (data as EventRow | null) ?? null;
    // A finished event no longer counts as "attending".
    if (current?.ends_at && Date.parse(current.ends_at) < Date.now() - 30 * 60e3) current = null;
  }

  return (
    <main className="shell">
      <div className="topbar">
        <Link href="/me" className="icon-btn" aria-label="Back to my card"><Back /></Link>
        <span className="topbar-title">Attending an event</span>
        <span style={{ width: 44 }} />
      </div>

      {current && (
        <section className="glass sheet" style={{ gap: 10 }}>
          <span className="label">{isLive(current) ? 'Attending now' : 'Attending'}</span>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{current.name}</div>
          <div className="muted" style={{ fontSize: 13 }}>{fmtEventWhen(current, APP_TZ)}{current.venue ? ` · ${current.venue}` : ''}</div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            {current.organised && current.created_by === profile.id ? (
              <Link href={`/e/${current.slug}`} style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>Check-in QR for your guests</Link>
            ) : (
              <span />
            )}
            <form action={leaveEvent}><SubmitButton className="link-btn" pendingText="Leaving…">Leave</SubmitButton></form>
          </div>
        </section>
      )}

      <form action={createEvent} className="glass sheet" style={{ gap: 14 }}>
        <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.45 }}>
          {current ? 'Adding a new event replaces the one above. ' : ''}While the event is on, anyone who scans your card is asked if they're there too. If they are, you both land in the same stack for it; if not, they're saved under the date.
        </p>
        <fieldset className="field" style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="label" style={{ marginBottom: 6 }}>I'm</legend>
          <div className="chips">
            <label className="choice"><input type="radio" name="role" value="attending" defaultChecked className="sr-only" />Attending</label>
            <label className="choice"><input type="radio" name="role" value="organising" className="sr-only" />Organising</label>
          </div>
          <span className="hint">Organisers also get a check-in QR to print for the door and tables.</span>
        </fieldset>
        <div className="field">
          <label className="label" htmlFor="name">Event name</label>
          <input id="name" name="name" className="input" required placeholder="e.g. XYZ Summit" maxLength={80} />
        </div>
        <div className="field">
          <label className="label" htmlFor="venue">Location (optional)</label>
          <input id="venue" name="venue" className="input" placeholder="e.g. Shoreditch, London" maxLength={80} />
        </div>
        <EventTimeInputs />
        {sp.error && <p className="error" style={{ margin: 0 }}>{sp.error}</p>}
        <SubmitButton pendingText="Saving…">Add to my card</SubmitButton>
      </form>
    </main>
  );
}
