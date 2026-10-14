'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function LoginButtons({ next }: { next: string }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function go(provider: 'linkedin_oidc' | 'google') {
    setBusy(provider);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) {
      setBusy(null);
      alert(error.message);
    }
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      <button className="btn btn-primary btn-block" onClick={() => go('linkedin_oidc')} disabled={!!busy}>
        <span className="in-mark">in</span>
        {busy === 'linkedin_oidc' ? 'Opening LinkedIn…' : 'Continue with LinkedIn'}
      </button>
      <button className="btn btn-ghost btn-block" onClick={() => go('google')} disabled={!!busy}>
        {busy === 'google' ? 'Opening Google…' : 'Use Google instead'}
      </button>
    </div>
  );
}
