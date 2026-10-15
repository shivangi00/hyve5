'use client';

import { useState } from 'react';

/** Share an event invite: the phone's share sheet where available, otherwise copy the message. */
export function InviteToEvent({ link, eventName, when, compact }: { link: string; eventName: string; when: string; compact?: boolean }) {
  const [status, setStatus] = useState<string | null>(null);
  const message = `Hey! I'm going to ${eventName} (${when}) 👋 I'm trying hyve5 to swap contacts there. Tap to say you're going and set up your card before, it takes a minute and there's no app: ${link}\nThen we just scan and swap when we meet!`;

  function flash(t: string) {
    setStatus(t);
    setTimeout(() => setStatus(null), 2200);
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      flash(label);
    } catch {
      flash("Couldn't copy. Press and hold the link to copy it.");
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: eventName, text: message });
        return;
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
      }
    }
    copy(message, 'Message copied. Paste it in your group chat.');
  }

  if (compact) {
    return (
      <button type="button" className="link-btn" style={{ minHeight: 0, padding: 0, fontSize: 12 }} onClick={share}>
        {status ? 'Copied' : 'Invite'}
      </button>
    );
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="invite-preview" aria-label="Invite message">{message}</div>
      <div className="row" style={{ gap: 8 }}>
        <button type="button" className="btn btn-primary" style={{ flex: 1, height: 48 }} onClick={share}>Share invite</button>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => copy(link, 'Link copied.')}>Copy link</button>
      </div>
      {status && <p className="hint ok" role="status" style={{ margin: 0 }}>{status}</p>}
    </div>
  );
}
