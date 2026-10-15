'use client';

import { useEffect, useState } from 'react';

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Defaults to 21:00 today (or 3 hours from now if it's already evening), in the browser's time zone.
export function EndTimeInput() {
  const [local, setLocal] = useState('');
  useEffect(() => {
    const d = new Date();
    d.setHours(d.getHours() < 18 ? 21 : Math.min(23, d.getHours() + 3), d.getHours() < 18 ? 0 : 59, 0, 0);
    setLocal(toLocalInput(d));
  }, []);
  const t = local ? Date.parse(local) : NaN;
  const iso = Number.isNaN(t) ? '' : new Date(t).toISOString();
  return (
    <div className="field">
      <label className="label" htmlFor="ends_local">Ends at</label>
      <input
        id="ends_local"
        type="datetime-local"
        className="input"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
      />
      {local && !Number.isNaN(t) && t <= Date.now() && (
        <p className="error" role="alert" style={{ margin: 0 }}>That time has already passed. Pick when the event ends.</p>
      )}
      <input type="hidden" name="ends_at_iso" value={iso} />
    </div>
  );
}
