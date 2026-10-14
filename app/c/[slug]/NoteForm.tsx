'use client';

import { useState, useTransition } from 'react';
import { saveSwapNote } from './actions';

export function NoteForm({ swapId, initial, about }: { swapId: string; initial: string; about: string }) {
  const [note, setNote] = useState(initial);
  const [saved, setSaved] = useState(!!initial);
  const [pending, start] = useTransition();

  return (
    <form
      className="stack"
      style={{ gap: 8 }}
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await saveSwapNote(swapId, note);
          setSaved(true);
        });
      }}
    >
      <label className="label" htmlFor="note">Quick note about {about}</label>
      <textarea
        id="note"
        className="textarea"
        style={{ minHeight: 76 }}
        placeholder="What did you talk about? Only you see this."
        value={note}
        maxLength={500}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
      />
      <button className="btn btn-ghost btn-block" disabled={pending || saved || !note.trim()}>
        {pending ? 'Saving…' : saved ? 'Note saved' : 'Save note'}
      </button>
    </form>
  );
}
