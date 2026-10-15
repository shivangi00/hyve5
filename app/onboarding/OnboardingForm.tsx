'use client';

import { useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { finishOnboarding } from './actions';
import { Avatar } from '@/components/Avatar';
import { Check } from '@/components/Icons';
import { LinkedInField } from '@/components/LinkedInField';
import { STATUS } from '@/lib/util';
import type { Status } from '@/lib/types';

/** Next three weekdays at 10:00, 14:30 and 11:00 in the person's own time zone. */
function defaultSlots() {
  const times: [number, number][] = [[10, 0], [14, 30], [11, 0]];
  const out: string[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < 3) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day === 0 || day === 6) continue;
    const [h, m] = times[out.length]!;
    const s = new Date(d);
    s.setHours(h, m, 0, 0);
    out.push(s.toISOString());
  }
  return out;
}

export function OnboardingForm(props: {
  next: string;
  name: string;
  first: string;
  avatar: string | null;
  guess: string;
  guessed: boolean;
  status: Status;
  topics: string;
  linkedin: string | null;
  viaLinkedIn: boolean;
}) {
  const [status, setStatus] = useState<Status>(props.status);
  const slots = useMemo(() => JSON.stringify(defaultSlots()), []);

  return (
    <form action={finishOnboarding} className="stack" style={{ flex: 1, gap: 14 }}>
      <input type="hidden" name="next" value={props.next} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="default_slots" value={slots} />
      <Body {...props} status={status} setStatus={setStatus} />
    </form>
  );
}

function Body(props: {
  first: string;
  name: string;
  avatar: string | null;
  guess: string;
  guessed: boolean;
  topics: string;
  linkedin: string | null;
  viaLinkedIn: boolean;
  status: Status;
  setStatus: (s: Status) => void;
}) {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <div className="stack" style={{ flex: 1, justifyContent: 'center', gap: 18 }}>
        <div className="glass build-grid" aria-hidden="true">
          <div style={{ gridColumn: 'span 3', animationDelay: '.1s', background: 'linear-gradient(90deg, rgba(255,255,255,.04), rgba(255,255,255,.12), rgba(255,255,255,.04))', backgroundSize: '400px 100%', animationName: 'fill, shimmer', animationDuration: '.5s, 1.2s', animationIterationCount: '1, infinite', animationTimingFunction: 'ease, linear' }} />
          <div style={{ gridColumn: 'span 2', animationDelay: '.45s' }} />
          <div style={{ animationDelay: '.7s' }} />
          <div style={{ animationDelay: '.95s' }} />
          <div style={{ gridColumn: 'span 2', animationDelay: '1.2s' }} />
        </div>
        <div role="status" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600, textShadow: '0 1px 12px rgba(0, 0, 0,.4)' }}>Building your card</div>
          <div style={{ fontSize: 13, color: 'rgba(243, 241, 234,.85)', marginTop: 4 }}>Writing your headline and picking tiles</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="glass sheet rise" style={{ gap: 16, marginTop: 8 }}>
        <div className="row" style={{ gap: 12 }}>
          <Avatar name={props.name} url={props.avatar} size={56} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Hi {props.first}</div>
            <div className="row muted" style={{ gap: 6, fontSize: 12.5, marginTop: 3 }}>
              <Check size={14} color="#4ADE80" /> Name and photo imported
            </div>
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="role_line">Role and company</label>
          <input
            id="role_line"
            name="role_line"
            className="input"
            required
            autoFocus
            maxLength={120}
            defaultValue={props.guess}
            placeholder="e.g. Product lead at Lumen Health"
          />
          <span className="hint">{props.guessed ? 'Company guessed from your work email; add your role in front. ' : ''}One line is all we need.</span>
        </div>

        <div className="field">
          <span className="label" id="status-label">Right now I'm</span>
          <div className="chips" role="group" aria-labelledby="status-label">
            {(Object.keys(STATUS) as Status[]).map((s) => (
              <button key={s} type="button" className="choice" aria-pressed={props.status === s} onClick={() => props.setStatus(s)}>
                <span className="dot" style={{ background: STATUS[s].color }} />
                {STATUS[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="topics">Ask me about (optional)</label>
          <input id="topics" name="topics" className="input" defaultValue={props.topics} placeholder="e.g. Fintech, hiring, design systems" />
          <span className="hint">Leave it blank and we'll suggest a few.</span>
        </div>

        <LinkedInField value={props.linkedin} signedInWithLinkedIn={props.viaLinkedIn} />
      </section>
      <div className="bottom">
        <button className="btn btn-primary btn-block" type="submit">Make my card</button>
      </div>
    </>
  );
}
