'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/** Adds a second sign-in method (Google or LinkedIn) to the same hyve5 account. */
export function ConnectAccount({ provider, label }: { provider: 'google' | 'linkedin_oidc'; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/me/edit#accounts')}`;
    const { error } = await supabase.auth.linkIdentity({ provider, options: { redirectTo } });
    if (error) {
      setBusy(false);
      setError(
        /manual linking/i.test(error.message)
          ? 'Connecting accounts is switched off. In Supabase, turn on "Allow manual linking" (see README).'
          : error.message
      );
    }
  }

  return (
    <div className="stack" style={{ gap: 6 }}>
      <button type="button" className="btn btn-ghost btn-sm" onClick={connect} disabled={busy}>
        {busy ? 'Opening…' : `Connect ${label}`}
      </button>
      {error && <p className="error" role="alert" style={{ margin: 0 }}>{error}</p>}
    </div>
  );
}
