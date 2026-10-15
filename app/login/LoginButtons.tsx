'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GoogleButton } from './GoogleButton';

// When set, Google sign-in uses Google's own button: the popup names your site, not your-project.supabase.co.
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

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

  const rememberGoogle = useCallback(() => {
    try {
      localStorage.setItem(LAST_KEY, 'google');
    } catch {}
  }, []);

  // Last-used provider goes first as the main button; first-timers get LinkedIn, marked Recommended.
  const primary: Provider = last ?? 'linkedin_oidc';
  const secondary: Provider = primary === 'google' ? 'linkedin_oidc' : 'google';
  const tag = (p: Provider) => (last === p ? 'Last used' : !last && p === 'linkedin_oidc' ? 'Recommended' : null);

  const label = (p: Provider) =>
    busy === p ? (p === 'google' ? 'Opening Google…' : 'Opening LinkedIn…') : p === 'google' ? 'Continue with Google' : 'Continue with LinkedIn';

  return (
    <div className="stack" style={{ gap: 10 }}>
      {[primary, secondary].map((p, i) => {
        const isPrimary = i === 0;
        const redirectButton = (
          <button key={p} className={`btn ${isPrimary ? 'btn-primary' : 'btn-ghost'} btn-block`} onClick={() => go(p)} disabled={!!busy}>
            {isPrimary && (p === 'linkedin_oidc' ? <span className="in-mark">in</span> : <span className="g-mark">G</span>)}
            {label(p)}
            {tag(p) && <span className={`tag-chip${isPrimary ? '' : ' ghost'}`}>{tag(p)}</span>}
          </button>
        );
        if (p === 'google' && GOOGLE_CLIENT_ID) {
          return (
            <div key={p} className="stack" style={{ gap: 4 }}>
              <GoogleButton clientId={GOOGLE_CLIENT_ID} next={next} primary={isPrimary} onChosen={rememberGoogle} fallback={redirectButton} />
              {tag(p) && <span className="hint" style={{ margin: 0, textAlign: 'center', fontSize: 11.5 }}>{tag(p)}</span>}
            </div>
          );
        }
        return redirectButton;
      })}
      {!last && (
        <p className="hint" style={{ margin: 0, textAlign: 'center' }}>
          LinkedIn fills in your name, photo and email in one step.
        </p>
      )}
    </div>
  );
}
