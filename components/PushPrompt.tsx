'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, Cross } from './Icons';

type State = 'loading' | 'unsupported' | 'ios-install' | 'ask' | 'denied' | 'on' | 'hidden';

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function isIOS() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

const DISMISS_KEY = 'np-push-dismissed';

/**
 * "Turn on reminders" card.
 *  - Android / desktop: one tap → browser permission → subscribed.
 *  - iPhone in Safari: push only works from the home screen, so it shows the 2-step install guide.
 *  - Already on / not supported / dismissed: renders nothing (or a small "on" line when `showWhenOn`).
 */
export function PushPrompt({ context = 'default', showWhenOn = false }: { context?: 'swap' | 'default'; showWhenOn?: boolean }) {
  const [state, setState] = useState<State>('loading');
  const [busy, setBusy] = useState(false);
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    (async () => {
      try {
        if (context !== 'swap' && localStorage.getItem(DISMISS_KEY)) return setState('hidden');
      } catch {}
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      if (isIOS() && !isStandalone()) return setState('ios-install');
      if (!supported || !vapid) return setState('unsupported');
      if (Notification.permission === 'denied') return setState('denied');
      const reg = await navigator.serviceWorker.register('/sw.js');
      const existing = await reg.pushManager.getSubscription();
      if (existing && Notification.permission === 'granted') {
        // Re-save in case it was created on a different account.
        fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(existing) }).catch(() => {});
        return setState('on');
      }
      setState('ask');
    })().catch(() => setState('unsupported'));
  }, [context, vapid]);

  async function turnOn() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return setState(permission === 'denied' ? 'denied' : 'ask');
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapid!) }));
      const res = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      setState(res.ok ? 'on' : 'ask');
    } catch (e) {
      console.error(e);
      setState('ask');
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {}
    setState('hidden');
  }

  if (state === 'loading' || state === 'hidden' || state === 'unsupported') return null;

  if (state === 'on') {
    if (!showWhenOn) return null;
    return (
      <div className="row muted" style={{ gap: 8, fontSize: 13, justifyContent: 'center' }}>
        <Check size={15} color="#4ADE80" /> Reminders are on for this phone
      </div>
    );
  }

  const lead = context === 'swap' ? 'Get a nudge in 3 hours' : 'Turn on reminders';
  const sub =
    context === 'swap'
      ? "We'll remind you to message them tonight, and again if no call is booked this week."
      : 'A nudge 3 hours after you meet someone, and again if no call is booked within the week.';

  return (
    <section className="glass sheet rise" style={{ gap: 12, borderRadius: 28, position: 'relative' }} aria-live="polite">
      {context !== 'swap' && (
        <button className="round" onClick={dismiss} aria-label="Not now" style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32 }}>
          <Cross size={14} />
        </button>
      )}
      <div className="row" style={{ gap: 12, alignItems: 'flex-start', paddingRight: 30 }}>
        <span className="round" style={{ width: 40, height: 40, borderRadius: 14, flex: 'none', background: 'rgba(255,122,89,.16)', border: '1px solid rgba(255,122,89,.4)' }}>
          <Bell color="#FF9A80" />
        </span>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 600 }}>{lead}</div>
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.4, marginTop: 3 }}>{sub}</div>
        </div>
      </div>

      {state === 'ask' && (
        <button className="btn btn-primary btn-block" onClick={turnOn} disabled={busy}>
          <Bell color="#1d1114" /> {busy ? 'Turning on…' : 'Turn on notifications'}
        </button>
      )}

      {state === 'ios-install' && (
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, lineHeight: 1.6 }}>
          <li>
            Tap the <b>Share</b> button{' '}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Share icon" role="img" style={{ verticalAlign: '-2px' }}>
              <path d="M12 3v12M8 7l4-4 4 4" />
              <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
            </svg>{' '}
            at the bottom of Safari.
          </li>
          <li>Choose <b>Add to Home Screen</b>.</li>
          <li>Open NetworkPulse from your home screen, sign in again with one tap, and turn on notifications.</li>
        </ol>
      )}

      {state === 'denied' && (
        <p className="hint" style={{ margin: 0 }}>
          Notifications are blocked for this site. You can allow them in your browser's site settings. Your reminders will still show under the bell.
        </p>
      )}
    </section>
  );
}
