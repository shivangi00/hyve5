'use client';

import { useEffect, useState } from 'react';

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * Date (today or later) + start and end time, in the browser's own time zone.
 * Sends both as ISO times. An end time earlier than the start means it runs past midnight.
 */
export function EventTimeInputs({ defaults }: { defaults?: { starts_at: string | null; ends_at: string | null } }) {
  const [today, setToday] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    const now = new Date();
    setToday(ymd(now));
    if (defaults?.starts_at && defaults.ends_at && Date.parse(defaults.ends_at) > Date.now()) {
      const s = new Date(defaults.starts_at);
      setDate(ymd(s));
      setStart(hm(s));
      setEnd(hm(new Date(defaults.ends_at)));
      return;
    }
    setDate(ymd(now));
    // Evening default; if it's already evening, from now (rounded down to the half hour) for 3 hours.
    if (now.getHours() < 17) {
      setStart('18:00');
      setEnd('21:00');
    } else {
      const s = new Date(now);
      s.setMinutes(now.getMinutes() < 30 ? 0 : 30, 0, 0);
      const e = new Date(s.getTime() + 3 * 3600e3);
      setStart(hm(s));
      setEnd(e.getDate() !== s.getDate() ? '23:59' : hm(e));
    }
  }, [defaults?.starts_at, defaults?.ends_at]);

  let startIso = '';
  let endIso = '';
  let problem = '';
  if (date && start && end) {
    const s = new Date(`${date}T${start}`);
    const e = new Date(`${date}T${end}`);
    if (e <= s) e.setDate(e.getDate() + 1); // runs past midnight
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) problem = 'Pick a date and times.';
    else if (date < today) problem = "That date has passed. Pick today or a later date.";
    else if (e.getTime() <= Date.now()) problem = 'That event has already finished. Pick a later end time.';
    else {
      startIso = s.toISOString();
      endIso = e.toISOString();
    }
  }
  const overnight = !!(start && end && end <= start);

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="field">
        <label className="label" htmlFor="ev_date">Date</label>
        <input id="ev_date" type="date" className="input" min={today || undefined} value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="row" style={{ gap: 10 }}>
        <div className="field" style={{ flex: 1 }}>
          <label className="label" htmlFor="ev_start">Starts</label>
          <input id="ev_start" type="time" className="input" value={start} onChange={(e) => setStart(e.target.value)} required />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label className="label" htmlFor="ev_end">Ends</label>
          <input id="ev_end" type="time" className="input" value={end} onChange={(e) => setEnd(e.target.value)} required />
        </div>
      </div>
      {overnight && !problem && <p className="hint" style={{ margin: 0 }}>Ends after midnight, the next day.</p>}
      {problem && <p className="error" role="alert" style={{ margin: 0 }}>{problem}</p>}
      <input type="hidden" name="starts_at_iso" value={startIso} />
      <input type="hidden" name="ends_at_iso" value={endIso} />
    </div>
  );
}
