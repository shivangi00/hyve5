'use client';

import { useState, useTransition } from 'react';
import { markBooked, markDone, markMessaged, sendTestReminder } from '../actions';
import { Bell, Check, Clock, Sparkle } from '@/components/Icons';
import type { Tone } from '@/lib/types';

export type ReminderView = { kind: string; title: string; when: string; state: 'set' | 'sent' | 'cleared' };
type Stage = 'met' | 'messaged' | 'booked' | 'done';
const STAGES: { id: Stage; label: string }[] = [
  { id: 'met', label: 'Met' },
  { id: 'messaged', label: 'Messaged' },
  { id: 'booked', label: 'Call booked' },
  { id: 'done', label: 'Done' },
];
const ORDER: Stage[] = ['met', 'messaged', 'booked', 'done'];

export function FollowUp(props: {
  swapId: string;
  initialStage: Stage;
  contact: { name: string; first: string; linkedin: string | null; email: string | null };
  bookingUrl: string;
  initialDraft: string;
  aiUsed: boolean;
  deadlines: { message: string; call: string; messagePct: number; callPct: number };
  reminders: ReminderView[];
}) {
  const [stage, setStage] = useState<Stage>(props.initialStage);
  const [tone, setTone] = useState<Tone>('warm');
  const [drafts, setDrafts] = useState<Partial<Record<Tone, string>>>({ warm: props.initialDraft });
  const [text, setText] = useState(props.initialDraft);
  const [withLink, setWithLink] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [reminders, setReminders] = useState(props.reminders);
  const [, start] = useTransition();
  const si = ORDER.indexOf(stage);

  const full = withLink ? `${text}\n\nPick a time that suits you: ${props.bookingUrl}` : text;

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function pickTone(t: Tone) {
    setTone(t);
    if (drafts[t]) return setText(drafts[t]!);
    setLoading(true);
    try {
      const res = await fetch('/api/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ swapId: props.swapId, tone: t }) });
      const data = await res.json();
      if (data.text) {
        setDrafts((d) => ({ ...d, [t]: data.text }));
        setText(data.text);
      }
    } finally {
      setLoading(false);
    }
  }

  function sent(channel: string) {
    if (stage === 'met') {
      setStage('messaged');
      setReminders((rs) => rs.map((r) => (r.kind === 'message_3h' && r.state === 'set' ? { ...r, state: 'cleared' } : r)));
      start(async () => {
        await markMessaged(props.swapId);
      });
    }
    flash(channel);
  }

  function openLinkedIn() {
    navigator.clipboard?.writeText(full).catch(() => {});
    const url = props.contact.linkedin || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(props.contact.name)}`;
    window.open(url, '_blank', 'noopener');
    sent('Message copied. Paste it into LinkedIn.');
  }

  const deadline =
    stage === 'met'
      ? { title: 'Message within 3 hours', sub: props.deadlines.message === 'overdue' ? 'Past 3 hours, but tonight still counts. Send it now.' : `${props.deadlines.message} left, while the conversation is still fresh.`, pct: props.deadlines.messagePct, color: '#FF7A59', hot: true }
      : stage === 'messaged'
        ? { title: 'Get a call booked this week', sub: props.deadlines.call === 'overdue' ? 'The week is up. One last nudge?' : `${props.deadlines.call} left. We'll nudge you if there's no reply.`, pct: props.deadlines.callPct, color: '#FFB86B', hot: false }
        : { title: stage === 'booked' ? 'Call booked' : 'All done', sub: 'Nice work. Follow-up reminders are cleared.', pct: 100, color: '#4ADE80', hot: false };

  return (
    <>
      <section className="glass" style={{ borderRadius: 26, padding: 12 }}>
        <ol className="progress" aria-label="Follow-up progress">
          {STAGES.map((s, i) => (
            <li key={s.id} className={i <= si ? 'on' : ''} aria-current={i === si ? 'step' : undefined}>{s.label}</li>
          ))}
        </ol>
      </section>

      <section className="glass row" style={{ borderRadius: 28, padding: '12px 14px', gap: 14, borderColor: deadline.hot ? 'rgba(255,122,89,.45)' : undefined }}>
        <span className="ring" style={{ background: `conic-gradient(${deadline.color} ${deadline.pct}%, rgba(255,255,255,.1) 0)` }}>
          <span><Clock /></span>
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600 }}>{deadline.title}</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 3, lineHeight: 1.35 }}>{deadline.sub}</div>
        </div>
      </section>

      {stage === 'met' || stage === 'messaged' ? (
        <section className="glass sheet" style={{ borderRadius: 32, padding: 14 }}>
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span className="label row" style={{ gap: 7 }}>
              <Sparkle size={14} color="#FFB09C" />
              {stage === 'messaged' ? 'Nudge, ready to send' : props.aiUsed ? 'Drafted from your note' : 'Drafted for you'}
            </span>
            <div className="seg" role="group" aria-label="Tone">
              {(['warm', 'short', 'direct'] as Tone[]).map((t) => (
                <button key={t} type="button" aria-pressed={tone === t} onClick={() => pickTone(t)}>
                  {t[0]!.toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <label className="sr-only" htmlFor="msg">Message to {props.contact.first}</label>
          <textarea id="msg" className="textarea" rows={7} value={loading ? 'Rewriting…' : text} disabled={loading} onChange={(e) => setText(e.target.value)} style={{ minHeight: 170 }} />
          <label className="row" style={{ gap: 10, fontSize: 13.5, minHeight: 32 }}>
            <input type="checkbox" checked={withLink} onChange={(e) => setWithLink(e.target.checked)} style={{ width: 20, height: 20, margin: 0, accentColor: '#F5EEEC' }} />
            Add my booking link
          </label>
          <button className="btn btn-primary btn-block" onClick={openLinkedIn}>
            <span className="in-mark">in</span> Copy and open LinkedIn
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {props.contact.email ? (
              <a
                className="btn btn-ghost btn-sm"
                href={`mailto:${props.contact.email}?subject=${encodeURIComponent('Great meeting you')}&body=${encodeURIComponent(full)}`}
                onClick={() => sent('Opening your email…')}
              >
                Email
              </a>
            ) : (
              <button className="btn btn-ghost btn-sm" disabled title="No email shared" style={{ opacity: 0.45 }}>Email</button>
            )}
            <a className="btn btn-ghost btn-sm" href={`https://wa.me/?text=${encodeURIComponent(full)}`} target="_blank" rel="noreferrer" onClick={() => sent('Opening WhatsApp…')}>
              WhatsApp
            </a>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                navigator.clipboard?.writeText(full).then(() => sent('Copied'), () => flash('Could not copy'));
              }}
            >
              Copy
            </button>
          </div>
          {stage === 'messaged' && (
            <button
              className="btn btn-ghost btn-block"
              onClick={() => {
                setStage('booked');
                setReminders((rs) => rs.map((r) => (r.state === 'set' ? { ...r, state: 'cleared' } : r)));
                start(async () => { await markBooked(props.swapId); });
              }}
            >
              <Check size={16} /> We've booked a call
            </button>
          )}
        </section>
      ) : (
        <section className="glass sheet rise" style={{ borderRadius: 32 }}>
          <div className="row" style={{ gap: 10 }}>
            <Check color="#4ADE80" />
            <span style={{ fontSize: 15, fontWeight: 600 }}>{stage === 'booked' ? 'Call booked' : 'Done'}</span>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.45 }}>
            {stage === 'booked' ? `You met ${props.contact.first} and booked a call within the week. That's the whole point.` : 'This one is wrapped up.'}
          </p>
          {stage === 'booked' && (
            <button className="btn btn-ghost btn-block" onClick={() => { setStage('done'); start(async () => { await markDone(props.swapId); }); }}>
              Mark as done
            </button>
          )}
        </section>
      )}

      <section className="glass sheet" style={{ borderRadius: 32, padding: 14, gap: 6 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="label" style={{ padding: '2px 4px' }}>Reminders</span>
          <button
            className="link-btn"
            style={{ minHeight: 32, fontSize: 12.5 }}
            onClick={() => start(async () => { const r = await sendTestReminder(props.swapId); flash(r.text); })}
          >
            <Bell size={13} /> Send me one now
          </button>
        </div>
        {reminders.map((r) => (
          <div key={r.kind} className="row" style={{ gap: 12, padding: '8px 4px' }}>
            <span
              style={{
                width: 10, height: 10, flex: 'none', borderRadius: 5,
                ...(r.state === 'set' ? { background: 'var(--accent)', animation: 'pulse 1.8s ease-out infinite' } : { border: '1.5px solid rgba(245,238,236,.4)' }),
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, ...(r.state === 'cleared' ? { textDecoration: 'line-through', color: 'var(--ink-3)' } : {}) }}>{r.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{r.when}</div>
            </div>
            <span className="label" style={{ fontSize: 10 }}>{r.state}</span>
          </div>
        ))}
      </section>

      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
