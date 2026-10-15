'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { decideSwap, undoDecision } from './actions';
import { saveSwapNote } from '@/app/c/[slug]/actions';
import { Avatar } from '@/components/Avatar';
import { Chat, Check, Cross, Sparkle } from '@/components/Icons';

export type StackCard = {
  swapId: string;
  name: string;
  avatar: string | null;
  role: string | null;
  status: string;
  statusColor: string;
  note: string | null;
  metAt: string;
  eventName: string | null;
  why: string;
  strong: boolean;
  score: number;
  metMs: number;
};

const THRESHOLD = 90;

export function SwipeStack({ cards }: { cards: StackCard[] }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [last, setLast] = useState<{ id: string; dir: 1 | -1 } | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [, start] = useTransition();
  const startX = useRef(0);
  const startY = useRef(0);

  const top = cards[idx];
  const done = idx >= cards.length;

  function decide(dir: 1 | -1) {
    if (!top || leaving) return;
    const id = top.swapId;
    setLeaving(true);
    setDragging(false);
    setDx(dir * 560);
    setLast({ id, dir });
    const isLast = idx + 1 >= cards.length;
    start(async () => {
      await decideSwap(id, dir === 1 ? 'connect' : 'skip');
      // Re-render the page once the last decision is saved, so "Follow up" fills in.
      if (isLast) router.refresh();
    });
    setTimeout(() => {
      setIdx((i) => i + 1);
      setDx(0);
      setLeaving(false);
    }, 260);
  }

  function undo() {
    if (!last || idx === 0) return;
    const id = last.id;
    start(async () => {
      await undoDecision(id);
    });
    setIdx((i) => i - 1);
    setLast(null);
  }

  if (done) {
    return (
      <section className="glass sheet rise">
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>All sorted</h1>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>Updating your follow-ups…</p>
      </section>
    );
  }

  const rot = dx / 18;
  const noteVal = notes[top.swapId] ?? top.note ?? '';

  return (
    <>
      <div className="deck">
        {cards[idx + 2] && <div className="deck-shadow" style={{ left: 18, right: 18, top: 28, bottom: 28 }} />}
        {cards[idx + 1] && (
          <div className="deck-shadow" style={{ left: 9, right: 9, top: 14, bottom: 14, background: 'rgba(22, 22, 24,.72)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 14 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Next: {cards[idx + 1]!.name}</span>
          </div>
        )}

        <article
          key={top.swapId}
          className="deck-card"
          aria-label={`${top.name}. Swipe right to follow up, left to archive.`}
          style={{
            transform: `translateX(${dx}px) rotate(${rot}deg)`,
            transition: dragging ? 'none' : 'transform .26s cubic-bezier(.2,.8,.2,1)',
          }}
          onPointerDown={(e) => {
            const target = e.target as HTMLElement;
            if (leaving || target.closest('textarea, a, button')) return;
            startX.current = e.clientX;
            startY.current = e.clientY;
            setDragging(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!dragging) return;
            const ddx = e.clientX - startX.current;
            if (Math.abs(e.clientY - startY.current) > Math.abs(ddx) * 1.5 && Math.abs(ddx) < 20) return;
            setDx(ddx);
          }}
          onPointerUp={() => {
            if (!dragging) return;
            if (dx > THRESHOLD) decide(1);
            else if (dx < -THRESHOLD) decide(-1);
            else {
              setDragging(false);
              setDx(0);
            }
          }}
          onPointerCancel={() => {
            setDragging(false);
            setDx(0);
          }}
        >
          <span className="stamp yes" style={{ opacity: Math.max(0, Math.min(1, dx / THRESHOLD)) }}>CONNECT</span>
          <span className="stamp no" style={{ opacity: Math.max(0, Math.min(1, -dx / THRESHOLD)) }}>SKIP</span>

          <div className="tile stack" style={{ padding: 18, alignItems: 'center', textAlign: 'center', gap: 8 }}>
            <Avatar name={top.name} url={top.avatar} size={84} />
            <h2 style={{ margin: '4px 0 0', fontSize: 23, fontWeight: 600, letterSpacing: '-0.02em' }}>{top.name}</h2>
            {top.role && <div className="muted" style={{ fontSize: 14 }}>{top.role}</div>}
            <span className="pill"><span className="dot" style={{ background: top.statusColor }} />{top.status}</span>
          </div>

          <div className="tile stack" style={{ gap: 6 }}>
            <label className="label" htmlFor={`note-${top.swapId}`}>
              Your note · met {top.metAt}{top.eventName ? ` · ${top.eventName}` : ''}
            </label>
            <textarea
              id={`note-${top.swapId}`}
              className="textarea"
              style={{ minHeight: 64, background: 'transparent', border: 'none', padding: 0, fontSize: 14.5, resize: 'none' }}
              placeholder="Add a note: what did you talk about?"
              value={noteVal}
              onChange={(e) => setNotes((n) => ({ ...n, [top.swapId]: e.target.value }))}
              onBlur={() => {
                if (notes[top.swapId] !== undefined) start(async () => { await saveSwapNote(top.swapId, notes[top.swapId]!); });
              }}
            />
          </div>

          <div className="why">
            <Sparkle color="#FFD66B" />
            <span>{top.strong ? 'Strong match: ' : ''}{top.why}</span>
          </div>
        </article>
      </div>

      <div className="row" style={{ justifyContent: 'center', gap: 18, paddingTop: 4 }}>
        <button className="round md" aria-label="Skip: archive quietly" onClick={() => decide(-1)}>
          <Cross color="#FFB3A3" />
        </button>
        <Link href={`/connect/${top.swapId}`} className="round sm" aria-label={`Write to ${top.name} now`}>
          <Chat />
        </Link>
        <button className="round lg" aria-label="Connect: add to follow-ups" onClick={() => decide(1)}>
          <Check size={26} color="#121214" />
        </button>
      </div>
      <div style={{ textAlign: 'center', fontSize: 11.5, color: 'rgba(243, 241, 234,.8)' }}>
        Swipe right to follow up · left to archive quietly
        {last && idx > 0 && (
          <>
            {' · '}
            <button className="link-btn" style={{ minHeight: 0, fontSize: 11.5, padding: 0 }} onClick={undo}>Undo</button>
          </>
        )}
      </div>
    </>
  );
}
