'use client';

import { useState } from 'react';

/** A plain link (no prefetch) that shows it's working as soon as it's tapped and ignores repeat taps. */
export function PendingLink({
  href,
  children,
  pendingText,
  className,
  style,
}: {
  href: string;
  children: React.ReactNode;
  pendingText: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <a
      href={href}
      className={className}
      style={{ ...style, ...(busy ? { pointerEvents: 'none' } : null) }}
      aria-busy={busy || undefined}
      aria-disabled={busy || undefined}
      onClick={(e) => {
        if (busy) {
          e.preventDefault();
          return;
        }
        setBusy(true);
        // If the person comes back with the browser's back button, make the link usable again.
        window.addEventListener('pageshow', () => setBusy(false), { once: true });
      }}
    >
      {busy ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </a>
  );
}
