'use client';

import { useState } from 'react';
import { LinkIcon, Qr } from '@/components/Icons';

export function ShareToggle({
  card,
  qrSvg,
  cardUrl,
  eventName,
  below,
}: {
  card: React.ReactNode;
  below?: React.ReactNode;
  qrSvg: string;
  cardUrl: string;
  eventName: string | null;
}) {
  const [showQr, setShowQr] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function shareLink() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My NetworkPulse card', url: cardUrl });
        return;
      }
      await navigator.clipboard.writeText(cardUrl);
      setToast('Link copied');
    } catch {
      // Share sheet dismissed: nothing to do.
    }
    setTimeout(() => setToast(null), 1800);
  }

  return (
    <>
      {showQr ? (
        <section className="glass rise stack" style={{ padding: '22px 20px', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Scan to swap cards</h1>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>No app needed · opens in their camera</p>
          </div>
          <div className="qr-wrap" role="img" aria-label="QR code for my card" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          {eventName ? (
            <span className="pill" style={{ height: 32, fontSize: 12.5 }}>
              <span className="dot" style={{ background: 'var(--accent)' }} />
              Everyone who scans is tagged to {eventName}
            </span>
          ) : (
            <span className="hint">Add the event you're at, so swaps are grouped by it.</span>
          )}
          <a href={cardUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--ink-2)', textUnderlineOffset: 3 }}>
            Preview what they see
          </a>
        </section>
      ) : (
        card
      )}

      {!showQr && below}

      <div className="bottom" style={{ flexDirection: 'row', gap: 10 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowQr((v) => !v)}>
          <Qr color="#1d1114" />
          {showQr ? 'Back to my card' : 'Share my card'}
        </button>
        <button className="round" style={{ width: 56, height: 56 }} aria-label="Share or copy my card link" onClick={shareLink}>
          <LinkIcon />
        </button>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
