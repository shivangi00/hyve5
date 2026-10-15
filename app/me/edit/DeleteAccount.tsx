'use client';

import { useEffect, useRef, useState } from 'react';
import { deleteAccount } from './actions';
import { SubmitButton } from '@/components/SubmitButton';

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

/** Two steps: type "delete", then confirm in a popup by typing your full name. */
export function DeleteAccount({ fullName, error }: { fullName: string; error?: string }) {
  const [word, setWord] = useState('');
  const [wordError, setWordError] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const nameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    nameInput.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const matches = norm(name) === norm(fullName);

  return (
    <>
      <form
        className="stack"
        style={{ gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (norm(word) !== 'delete') return setWordError(true);
          setWordError(false);
          setName('');
          setOpen(true);
        }}
      >
        <label className="label" htmlFor="confirm">Type delete to confirm</label>
        <input id="confirm" className="input" autoComplete="off" autoCapitalize="off" placeholder="delete" value={word} onChange={(e) => setWord(e.target.value)} />
        {(wordError || error === 'confirm') && <p className="error" role="alert" style={{ margin: 0 }}>Type delete in the box to continue.</p>}
        {error === 'name' && <p className="error" role="alert" style={{ margin: 0 }}>The name didn't match, so nothing was deleted.</p>}
        <button type="submit" className="btn btn-block btn-danger">Delete my account</button>
      </form>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <form
            action={deleteAccount}
            className="glass sheet modal-sheet"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="del-title"
            aria-describedby="del-what"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="del-title" style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>Delete your account for good?</h2>
            <div id="del-what" className="stack" style={{ gap: 6, fontSize: 14, lineHeight: 1.45 }}>
              <span className="muted">This happens straight away and can't be undone:</span>
              <ul className="del-list">
                <li>Your card and its link stop working, including the QR code people have.</li>
                <li>All your contacts, notes, follow-ups and reminders are erased.</li>
                <li>You're removed from other people's contacts and event lists.</li>
                <li>Your bookable times are removed from your card.</li>
                <li>Your sign-in is removed. Signing in again starts a brand-new card.</li>
              </ul>
            </div>
            <input type="hidden" name="confirm" value="delete" />
            <div className="field">
              <label className="label" htmlFor="del-name">To confirm, type your full name: {fullName}</label>
              <input
                ref={nameInput}
                id="del-name"
                name="full_name"
                className="input"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={fullName}
              />
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setOpen(false)}>Cancel</button>
              {matches ? (
                <SubmitButton className="btn btn-danger" style={{ flex: 1, height: 48 }} pendingText="Deleting…">Delete for good</SubmitButton>
              ) : (
                <button type="button" className="btn btn-danger" style={{ flex: 1, height: 48, opacity: 0.45 }} disabled>Delete for good</button>
              )}
            </div>
          </form>
        </div>
      )}
    </>
  );
}
