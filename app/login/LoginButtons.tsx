'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Provider = 'linkedin_oidc' | 'google';
const LAST_KEY = 'hyve5-last-provider';

export function LoginButtons({ next }: { next: string }) {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [last, setLast] = useState<Provider | null>(null);

  // Remember which button this browser used last time (per device, nothing stored on the server).
  useEffect(() => {
    try {
      const v = localStorage.getItem(LAST_KEY);
      if (v === 'linkedin_oidc' || v === 'google') setLast(v);
    } catch {}
  }, []);

  async function go(provider: Provider) {
    setBusy(provider);
    try {
      localStorage.setItem(LAST_KEY, provider);
    } catch {}
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) {
      setBusy(null);
      alert(error.message);
    }
  }

  // Last-used provider goes first as the main button; first-timers get LinkedIn, marked Recommended.
  const primary: Provider = last ?? 'linkedin_oidc';
  const secondary: Provider = primary === 'google' ? 'linkedin_oidc' : 'google';
  const tag = (p: Provider) => (last === p ? 'Last used' : !last && p === 'linkedin_oidc' ? 'Recommended' : null);

  const label = (p: Provider) =>
    busy === p ? (p === 'google' ? 'Opening Google…' : 'Opening LinkedIn…') : p === 'google' ? 'Continue with Google' : 'Continue with LinkedIn';

  return (
    <div className="stack" style={{ gap: 10 }}>
      <button className="btn btn-primary btn-block" onClick={() => go(primary)} disabled={!!busy}>
        {primary === 'linkedin_oidc' ? <span className="in-mark">in</span> : <span className="g-mark">G</span>}
        {label(primary)}
        {tag(primary) && <span className="tag-chip">{tag(primary)}</span>}
      </button>
      <button className="btn btn-ghost btn-block" onClick={() => go(secondary)} disabled={!!busy}>
        {label(secondary)}
        {tag(secondary) && <span className="tag-chip ghost">{tag(secondary)}</span>}
      </button>
      {!last && (
        <p className="hint" style={{ margin: 0, textAlign: 'center' }}>
          LinkedIn fills in your name, photo and email in one step.
        </p>
      )}
    </div>
  );
}
