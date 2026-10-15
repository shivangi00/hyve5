'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type GoogleId = {
  initialize: (o: Record<string, unknown>) => void;
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
  prompt: () => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const SCRIPT = 'https://accounts.google.com/gsi/client';

function loadScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    const s = existing ?? document.createElement('script');
    s.addEventListener('load', () => resolve());
    s.addEventListener('error', () => reject(new Error('Could not load Google sign-in')));
    if (!existing) {
      s.src = SCRIPT;
      s.async = true;
      document.head.appendChild(s);
    }
  });
}

/** Random nonce: the raw one goes to Supabase, its SHA-256 (hex) goes to Google. */
async function makeNonce() {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return { raw, hashed };
}

/**
 * Google's own "Continue with Google" button (and One Tap). Signing in happens in a Google popup
 * that names this site, instead of redirecting through your-project.supabase.co.
 * Falls back to the normal redirect button if Google's script can't load.
 */
export function GoogleButton({
  clientId,
  next,
  primary,
  onChosen,
  fallback,
}: {
  clientId: string;
  next: string;
  primary: boolean;
  onChosen: () => void;
  fallback: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'busy' | 'failed'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadScript();
        const nonce = await makeNonce();
        if (cancelled || !box.current || !window.google) return;
        const gid = window.google.accounts.id;
        gid.initialize({
          client_id: clientId,
          nonce: nonce.hashed,
          use_fedcm_for_prompt: true,
          itp_support: true,
          callback: async (res: { credential?: string }) => {
            if (!res.credential) return;
            onChosen();
            setState('busy');
            const supabase = createClient();
            const { error: err } = await supabase.auth.signInWithIdToken({ provider: 'google', token: res.credential, nonce: nonce.raw });
            if (err) {
              setError(err.message);
              setState('ready');
              return;
            }
            window.location.href = `/auth/finish?next=${encodeURIComponent(next)}`;
          },
        });
        const width = Math.min(400, Math.max(200, Math.round(box.current.getBoundingClientRect().width)));
        gid.renderButton(box.current, {
          type: 'standard',
          theme: primary ? 'outline' : 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'center',
          width,
        });
        gid.prompt(); // One Tap for people already signed in to Google on this device
        setState('ready');
      } catch {
        if (!cancelled) setState('failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, next, primary, onChosen]);

  if (state === 'failed') return <>{fallback}</>;

  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className={`gsi-box${state === 'busy' ? ' busy' : ''}`} aria-busy={state !== 'ready' || undefined}>
        <div ref={box} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
        {state !== 'ready' && (
          <div className="gsi-cover">
            <span className="spinner" aria-hidden="true" />
            {state === 'busy' ? 'Signing you in…' : 'Loading Google…'}
          </div>
        )}
      </div>
      {error && <p className="error" style={{ margin: 0, textAlign: 'center' }}>Google sign-in didn't work: {error}</p>}
    </div>
  );
}
