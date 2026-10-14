import Link from 'next/link';
import { requireProfile } from '@/lib/session';
import { Back } from '@/components/Icons';
import { createEvent, leaveEvent } from '../actions';
import { EndTimeInput } from './EndTimeInput';

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const { supabase, profile } = await requireProfile('/events/new');
  let current: { name: string; slug: string; created_by: string | null } | null = null;
  if (profile.active_event_id) {
    const { data } = await supabase.from('events').select('name, slug, created_by').eq('id', profile.active_event_id).maybeSingle();
    current = data;
  }

  return (
    <main className="shell">
      <div className="topbar">
        <Link href="/me" className="icon-btn" aria-label="Back to my card"><Back /></Link>
        <span className="topbar-title">Where are you tonight?</span>
        <span style={{ width: 44 }} />
      </div>

      {current && (
        <section className="glass sheet" style={{ gap: 10 }}>
          <span className="label">Currently attending</span>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{current.name}</div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <Link href={`/e/${current.slug}`} style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>Event check-in QR (for organisers)</Link>
            <form action={leaveEvent}><button className="link-btn">Leave</button></form>
          </div>
        </section>
      )}

      <form action={createEvent} className="glass sheet" style={{ gap: 14 }}>
        <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.45 }}>
          Everyone who scans your card until the event ends gets tagged to it, so your follow-up stack is grouped by event.
        </p>
        <div className="field">
          <label className="label" htmlFor="name">Event name</label>
          <input id="name" name="name" className="input" required placeholder="e.g. XYZ Summit" maxLength={80} />
        </div>
        <div className="field">
          <label className="label" htmlFor="venue">Venue (optional)</label>
          <input id="venue" name="venue" className="input" placeholder="e.g. Shoreditch, London" maxLength={80} />
        </div>
        <EndTimeInput />
        {sp.error && <p className="error" style={{ margin: 0 }}>{sp.error}</p>}
        <button className="btn btn-primary btn-block">I'm attending</button>
      </form>
    </main>
  );
}
