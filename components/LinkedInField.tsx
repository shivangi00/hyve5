'use client';

import { useState } from 'react';

/**
 * LinkedIn sign-in shares name, photo and email, but not the profile link.
 * This opens the person's own profile (linkedin.com/in/me redirects there) so they can copy it,
 * and accepts anything they paste: a full link, "in/handle" or just the handle.
 */
export function LinkedInField({ value, signedInWithLinkedIn }: { value: string | null; signedInWithLinkedIn?: boolean }) {
  const [v, setV] = useState(value ?? '');
  const [opened, setOpened] = useState(false);

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setV(text.trim());
    } catch {
      /* clipboard blocked: they can paste by hand */
    }
  }

  return (
    <div className="field">
      <label className="label" htmlFor="linkedin_url">LinkedIn profile link</label>
      <input
        id="linkedin_url"
        name="linkedin_url"
        className="input"
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="linkedin.com/in/yourname"
        autoComplete="url"
        inputMode="url"
      />
      {!v && (
        <div className="stack" style={{ gap: 6 }}>
          <p className="hint" style={{ margin: 0 }}>
            {signedInWithLinkedIn
              ? "LinkedIn doesn't share your profile link at sign-in. Open your profile, copy the link from the address bar, then come back and paste it."
              : 'Open your LinkedIn profile, copy the link from the address bar, then paste it here.'}
          </p>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <a
              className="btn btn-ghost btn-sm"
              href="https://www.linkedin.com/in/me/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpened(true)}
            >
              Find my LinkedIn link
            </a>
            {opened && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={pasteFromClipboard}>
                Paste link
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
