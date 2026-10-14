'use client';

import { useState } from 'react';

// datetime-local has no time zone; convert in the browser so the server stores the right instant.
export function SlotInput() {
  const [iso, setIso] = useState('');
  return (
    <>
      <label className="sr-only" htmlFor="slot-local">New time</label>
      <input
        id="slot-local"
        type="datetime-local"
        className="input"
        required
        onChange={(e) => {
          const t = Date.parse(e.target.value);
          setIso(Number.isNaN(t) ? '' : new Date(t).toISOString());
        }}
      />
      <input type="hidden" name="starts_at_iso" value={iso} />
    </>
  );
}
