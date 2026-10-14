'use client';

import { useState, useTransition } from 'react';
import { bookSlot } from '@/app/c/[slug]/actions';
import { firstName } from '@/lib/util';

type SlotView = { id: string; day: string; time: string };

export function BookingTile({
  slots,
  ownerSlug,
  ownerName,
  viewer,
}: {
  slots: SlotView[];
  ownerSlug: string;
  ownerName: string;
  viewer: { name: string; email: string } | null;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [name, setName] = useState(viewer?.name ?? '');
  const [email, setEmail] = useState(viewer?.email ?? '');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (!slots.length) {
    return <p className="muted" style={{ margin: 0, fontSize: 13 }}>No open times right now. Swap cards and {firstName(ownerName)} will reach out.</p>;
  }

  if (msg?.ok) {
    return <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45 }}>{msg.text}</p>;
  }

  const slot = slots.find((s) => s.id === picked);

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="slots">
        {slots.map((s) => (
          <button key={s.id} type="button" className="slot" aria-pressed={picked === s.id} onClick={() => setPicked(s.id)}>
            <small>{s.day}</small>
            <b>{s.time}</b>
          </button>
        ))}
      </div>
      {slot && (
        <form
          className="stack rise"
          style={{ gap: 8 }}
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await bookSlot(slot.id, name.trim(), email.trim(), ownerSlug);
              setMsg(res);
            });
          }}
        >
          <label className="sr-only" htmlFor="bk-name">Your name</label>
          <input id="bk-name" className="input" required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <label className="sr-only" htmlFor="bk-email">Your email</label>
          <input id="bk-email" className="input" required type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <button className="btn btn-primary btn-block" disabled={pending}>
            {pending ? 'Booking…' : `Book ${slot.day} ${slot.time}`}
          </button>
          {msg && !msg.ok && <p className="error" style={{ margin: 0 }}>{msg.text}</p>}
        </form>
      )}
    </div>
  );
}
