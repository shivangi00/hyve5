'use client';

import { useFormStatus } from 'react-dom';

/**
 * A form button that reacts the moment it's tapped: it shows what's happening ("Saving…")
 * and every button in the same form is disabled until the server answers, so double taps do nothing.
 * When several buttons share one form (name/value), only the one tapped shows the busy text.
 */
export function SubmitButton({
  children,
  pendingText,
  className = 'btn btn-primary btn-block',
  name,
  value,
  style,
  title,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  const { pending, data } = useFormStatus();
  const mine = pending && (!name || data?.get(name) === (value ?? ''));
  return (
    <button
      type="submit"
      className={className}
      name={name}
      value={value}
      style={style}
      title={title}
      disabled={pending}
      aria-busy={mine || undefined}
      aria-disabled={pending || undefined}
    >
      {mine ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
