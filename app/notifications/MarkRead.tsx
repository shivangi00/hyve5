'use client';

import { useEffect } from 'react';
import { markAllRead } from './actions';

// Opening the list counts as reading it. Dots stay visible for this view, the badge clears next time.
export function MarkRead() {
  useEffect(() => {
    const t = setTimeout(() => {
      markAllRead().catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, []);
  return null;
}
