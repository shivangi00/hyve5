'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { answerSwapRequest, sendSwapRequest, swapUpdates, type ReqResult } from './actions';

export type Person = {
  id: string;
  name: string;
  avatar: string | null;
  role: string | null;
  state: 'none' | 'sent' | 'incoming' | 'swapped';
  requestId?: string;
};

type Job =
  | { kind: 'request'; to: string; ev: string; slug: string }
  | { kind: 'answer'; req: string; accept: boolean; slug: string; from: string };

type RowStatus = 'none' | 'sent' | 'incoming' | 'swapped' | 'declined' | 'queued' | 'working';

const OUTBOX = 'hyve5-outbox';

function readOutbox(): Job[] {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX) || '[]') as Job[];
  } catch {
    return [];
  }
}
function writeOutbox(jobs: Job[]) {
  try {
    localStorage.setItem(OUTBOX, JSON.stringify(jobs));
  } catch {}
}

/**
 * Who's going, with instant search and swap requests that work on weak signal:
 * taps update the screen straight away, and anything that can't reach the server
 * waits in this phone's outbox and sends itself when the connection comes back.
 */
export function WhoIsGoing({ people, eventId, eventSlug }: { people: Person[]; eventId: string; eventSlug: string }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<Record<string, RowStatus>>(() => Object.fromEntries(people.map((p) => [p.id, p.state])));
  const [reqIds, setReqIds] = useState<Record<string, string>>(() => Object.fromEntries(people.filter((p) => p.requestId).map((p) => [p.id, p.requestId!])));
  const [online, setOnline] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);
  const flushing = useRef(false);

  const run = useCallback(async (job: Job) => {
    if (job.kind === 'request') return sendSwapRequest(job.to, job.ev, job.slug);
    return answerSwapRequest(job.req, job.accept, job.slug);
  }, []);

  const apply = useCallback((job: Job, result: string) => {
    const id = job.kind === 'request' ? job.to : job.from;
    const next: RowStatus = result === 'swapped' || result === 'already' ? 'swapped' : result === 'requested' ? 'sent' : result === 'declined' ? 'declined' : 'none';
    setStatus((s) => ({ ...s, [id]: next }));
    if (result === 'not_going') setProblem("That person (or you) isn't marked as going to this event any more, so the request wasn't sent.");
    if (result === 'gone') setProblem('That request was withdrawn.');
  }, []);

  // The server answered but said no (not a connection problem): show why instead of queuing.
  const fail = useCallback((job: Job, r: ReqResult) => {
    const id = job.kind === 'request' ? job.to : job.from;
    setStatus((s) => ({ ...s, [id]: job.kind === 'answer' ? 'incoming' : 'none' }));
    setProblem(r.result === 'signed_out' ? 'You were signed out. Sign in again and try once more.' : r.message || "Couldn't send that. Try again.");
  }, []);

  // Send anything waiting in the outbox (from this page or an earlier visit).
  const flush = useCallback(async () => {
    if (flushing.current || !navigator.onLine) return;
    flushing.current = true;
    try {
      let jobs = readOutbox();
      for (const job of [...jobs]) {
        try {
          const r = await run(job);
          jobs = jobs.filter((j) => j !== job);
          writeOutbox(jobs);
          if (job.slug !== eventSlug) continue;
          if (r.ok) apply(job, r.result);
          else fail(job, r); // reached the server but it refused: don't keep retrying
        } catch {
          break; // still offline or the request timed out
        }
      }
    } finally {
      flushing.current = false;
    }
  }, [apply, eventSlug, fail, run]);

  useEffect(() => {
    setOnline(navigator.onLine);
    // Show queued jobs from an earlier visit as queued.
    const queued = readOutbox().filter((j) => j.slug === eventSlug);
    if (queued.length) setStatus((s) => ({ ...s, ...Object.fromEntries(queued.map((j) => [j.kind === 'request' ? j.to : j.from, 'queued' as RowStatus])) }));
    flush();
    const up = () => {
      setOnline(true);
      flush();
    };
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    const timer = window.setInterval(flush, 15000);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
      window.clearInterval(timer);
    };
  }, [eventSlug, flush]);

  async function act(job: Job, id: string) {
    setProblem(null);
    setStatus((s) => ({ ...s, [id]: 'working' }));
    const queue = () => {
      writeOutbox([...readOutbox(), job]);
      setStatus((s) => ({ ...s, [id]: 'queued' }));
    };
    if (!navigator.onLine) return queue();
    const call = run(job);
    let timedOut = false;
    // If the original call still lands after we gave up waiting, use its answer and drop the queued copy.
    call
      .then((r) => {
        if (!timedOut) return;
        writeOutbox(readOutbox().filter((j) => JSON.stringify(j) !== JSON.stringify(job)));
        if (r.ok) apply(job, r.result);
        else fail(job, r);
      })
      .catch(() => {});
    try {
      // Weak signal: stop waiting after 12 seconds and queue it instead.
      const r = await Promise.race([call, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000))]);
      if (r.ok) apply(job, r.result);
      else fail(job, r);
    } catch {
      timedOut = true;
      queue(); // no connection or no reply: keep it and send later
    }
  }

  // Live updates: every few seconds, pick up new requests for you and accepted ones, without reloading.
  useEffect(() => {
    const ids = people.map((p) => p.id);
    if (!ids.length) return;
    let stop = false;
    const tick = async () => {
      if (stop || document.hidden || !navigator.onLine) return;
      try {
        const live = await swapUpdates(ids);
        if (!live || stop) return;
        const incoming = new Map(live.incoming.map((r) => [r.from, r.id]));
        const swapped = new Set(live.swapped);
        const sent = new Set(live.sent);
        setReqIds((m) => ({ ...m, ...Object.fromEntries(incoming) }));
        setStatus((cur) => {
          const next = { ...cur };
          for (const id of ids) {
            const mine = cur[id];
            if (mine === 'working' || mine === 'queued') continue; // this phone is mid-send
            next[id] = swapped.has(id) ? 'swapped' : incoming.has(id) ? 'incoming' : sent.has(id) ? 'sent' : mine === 'declined' ? 'declined' : 'none';
          }
          return next;
        });
      } catch {
        /* offline or slow: try again next tick */
      }
    };
    const timer = window.setInterval(tick, 6000);
    const onShow = () => !document.hidden && tick();
    document.addEventListener('visibilitychange', onShow);
    return () => {
      stop = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onShow);
    };
  }, [people]);

  const needle = q.trim().toLowerCase();
  const shown = useMemo(
    () => (needle ? people.filter((p) => `${p.name} ${p.role ?? ''}`.toLowerCase().includes(needle)) : people),
    [people, needle]
  );
  const incoming = people.filter((p) => status[p.id] === 'incoming');

  return (
    <>
      {incoming.length > 0 && (
        <section id="requests" className="glass sheet" style={{ gap: 8, scrollMarginTop: 80 }}>
          <span className="label">Want to swap with you · {incoming.length}</span>
          {incoming.map((p) => (
            <div key={p.id} className="row" style={{ gap: 12 }}>
              <Avatar name={p.name} url={p.avatar} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.name}</div>
                {p.role && <div className="muted ellipsis" style={{ fontSize: 12.5 }}>{p.role}</div>}
              </div>
              <button type="button" className="btn btn-primary btn-sm" style={{ height: 38 }} onClick={() => act({ kind: 'answer', req: reqIds[p.id]!, accept: true, slug: eventSlug, from: p.id }, p.id)}>Accept</button>
              <button type="button" className="link-btn" style={{ minHeight: 38 }} onClick={() => act({ kind: 'answer', req: reqIds[p.id]!, accept: false, slug: eventSlug, from: p.id }, p.id)}>Not now</button>
            </div>
          ))}
        </section>
      )}

      <section className="glass sheet" style={{ gap: 8 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="label">Who's going · {people.length}</span>
          {!online && <span className="pill" style={{ height: 24, fontSize: 11 }}>Offline · swaps will send later</span>}
        </div>
        {problem && (
          <p className="error" role="alert" style={{ margin: 0 }}>
            {problem}{' '}
            <button type="button" className="link-btn" style={{ minHeight: 0, padding: 0, fontSize: 12.5 }} onClick={() => setProblem(null)}>Dismiss</button>
          </p>
        )}

        {people.length > 0 && (
          <input
            type="search"
            className="input"
            placeholder="Search by name or role"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search people going"
            autoComplete="off"
            enterKeyHint="search"
          />
        )}

        {people.length === 0 && <p className="muted" style={{ margin: 0, fontSize: 14 }}>No one else yet. Share the invite and they'll appear here.</p>}
        {people.length > 0 && shown.length === 0 && <p className="muted" style={{ margin: 0, fontSize: 14 }}>No one called "{q}" yet.</p>}

        {shown.map((p) => {
          const st = status[p.id] ?? 'none';
          return (
            <div key={p.id} className="row" style={{ gap: 12, padding: '4px 0' }}>
              <Avatar name={p.name} url={p.avatar} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.name}</div>
                {p.role && <div className="muted ellipsis" style={{ fontSize: 12.5 }}>{p.role}</div>}
              </div>
              {st === 'swapped' ? (
                <span className="pill" style={{ height: 30, fontSize: 12 }}>Swapped ✓</span>
              ) : st === 'sent' ? (
                <span className="pill" style={{ height: 30, fontSize: 12 }}>Requested</span>
              ) : st === 'queued' ? (
                <span className="pill" style={{ height: 30, fontSize: 12 }} title="Sends when you're back online">Queued</span>
              ) : st === 'working' ? (
                <span className="pill" style={{ height: 30, fontSize: 12 }}><span className="spinner" aria-hidden="true" />Sending</span>
              ) : st === 'incoming' ? (
                <button type="button" className="btn btn-primary btn-sm" style={{ height: 36 }} onClick={() => act({ kind: 'answer', req: reqIds[p.id]!, accept: true, slug: eventSlug, from: p.id }, p.id)}>Accept</button>
              ) : (
                <button type="button" className="btn btn-ghost btn-sm" style={{ height: 36 }} onClick={() => act({ kind: 'request', to: p.id, ev: eventId, slug: eventSlug }, p.id)}>Swap</button>
              )}
            </div>
          );
        })}
        {people.length > 0 && (
          <p className="hint" style={{ margin: '4px 0 0' }}>
            Swap sends a request; once they accept you're in each other's stack for this event. Met someone who isn't on the list? Scan their QR.
          </p>
        )}
      </section>
    </>
  );
}
