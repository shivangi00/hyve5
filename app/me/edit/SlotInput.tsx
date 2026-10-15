'use client';

import { useEffect, useState } from 'react';

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// datetime-local has no time zone; convert in the browser so the server stores the right instant.
// Past times are blocked: the picker greys them out (min) and we show a message if one is typed in.
export function SlotInput() {
  const [iso, setIso] = useState('');
  const [min, setMin] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setMin(toLocalInput(new Date(Date.now() + 5 * 60000)));
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <label className="sr-only" htmlFor="slot-local">New time</label>
      <input
        id="slot-local"
        type="datetime-local"
        className="input"
        required
        min={min}
        aria-describedby="slot-error"
        onChange={(e) => {
          const t = Date.parse(e.target.value);
          if (Number.isNaN(t)) {
            setIso('');
            setError(null);
          } else if (t <= Date.now()) {
            setIso('');
            setError('That time has already passed. Pick a future time.');
            e.target.setCustomValidity('Pick a future time');
          } else {
            setIso(new Date(t).toISOString());
            setError(null);
            e.target.setCustomValidity('');
          }
        }}
      />
      <input type="hidden" name="starts_at_iso" value={iso} />
      {error && (
        <p id="slot-error" className="error" role="alert" style={{ margin: 0 }}>
          {error}
        </p>
      )}
    </>
  );
}
