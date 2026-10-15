'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { addLink, removeLink, type LinkState } from '@/app/me/links-actions';
import { detectLink, cleanUrl, faviconUrl, type CardLink, type LinkKind } from '@/lib/links';
import { Cross, Globe, Mail, Plus } from './Icons';
import { SubmitButton } from './SubmitButton';

const MAX_IN_CIRCLE = 8;
/** Visitors: up to 5 links sit in the circle; beyond that the centre opens the full list. */
const MAX_PUBLIC = 5;

function Mark({ kind, url, size = 15 }: { kind: LinkKind; url?: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (kind.id === 'email') return <Mail size={size} />;
  // eslint-disable-next-line @next/next/no-img-element
  if (kind.id === 'hyve5') return <img src="/icon-192.png" alt="" width={size + 5} height={size + 5} className="favicon" />;
  // Every link shows the site's own icon (YouTube, GitHub, a portfolio…). If it can't load, fall back to lettering or a globe.
  const icon = !broken && url && /^https?:/i.test(url) ? faviconUrl(url) : null;
  if (icon) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon} alt="" width={size + 3} height={size + 3} className="favicon" loading="lazy" onError={() => setBroken(true)} />;
  }
  if (!kind.mark) return <Globe size={size} />;
  return <span className={`mark len-${Math.min(kind.mark.length, 3)}`}>{kind.mark}</span>;
}

/** Evenly spaced spots on a circle, ordered top to bottom so greyed-out ones end up underneath. */
function spots(n: number) {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n + (n % 2 === 0 ? Math.PI / n : 0);
    out.push({ x: 50 + 35 * Math.cos(a), y: 50 + 35 * Math.sin(a) });
  }
  return out.sort((p, q) => (Math.abs(p.y - q.y) < 0.5 ? p.x - q.x : p.y - q.y));
}

export function LinksOrbit({
  mode,
  linked,
  empty,
  name,
  vcardHref,
}: {
  mode: 'owner' | 'public';
  linked: CardLink[];
  empty: CardLink[];
  name: string;
  /** Public card after a swap: "Save to contacts" in the sheet. */
  vcardHref?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState('');

  // Visitors only see links that are set; the owner also sees greyed-out defaults as prompts.
  const all = mode === 'owner' ? [...linked, ...empty] : linked;
  const cap = mode === 'owner' ? MAX_IN_CIRCLE : MAX_PUBLIC;
  let items = all;
  let more = 0;
  if (all.length > cap) {
    // Owner: last spot becomes "+n". Visitors: all spots stay links; the centre shows "+n" and opens the rest.
    items = mode === 'owner' ? all.slice(0, cap - 1) : all.slice(0, cap);
    more = all.length - items.length;
  }
  const ownerMore = mode === 'owner' && more > 0;
  const count = items.length + (ownerMore ? 1 : 0);
  const pos = useMemo(() => spots(Math.max(count, mode === 'owner' ? 4 : 1)), [count, mode]);

  function openSheet(prefill = '') {
    setPreset(prefill);
    setOpen(true);
  }

  // Centre: owner adds links. For visitors it's just the hub, unless there are more links than fit.
  const centreActs = mode === 'owner' || more > 0;
  const centreLabel = mode === 'owner' ? 'Add a link' : `See all ${linked.length} links`;

  return (
    <>
      <div className="tile orbit">
        <svg className="lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {pos.slice(0, count).map((p, i) => (
            <line key={i} x1="50" y1="50" x2={p.x} y2={p.y} stroke="rgba(255,255,255,.12)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>

        {centreActs ? (
          <button type="button" className="orb" aria-label={centreLabel} title={centreLabel} aria-haspopup="dialog" onClick={() => openSheet()}>
            {mode === 'public' ? <span className="mark len-2">+{more}</span> : <Plus />}
          </button>
        ) : (
          <span className="orb hub" aria-hidden="true" />
        )}

        {items.map((l, i) => {
          const p = pos[i]!;
          const style = { left: `${p.x}%`, top: `${p.y}%` };
          if (l.href) {
            const external = l.href.startsWith('http');
            return (
              <a key={l.key} className="sat" style={style} href={l.href} aria-label={`${l.kind.name}: ${l.display}`} title={l.kind.name} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
                <Mark kind={l.kind} url={l.href} />
              </a>
            );
          }
          return mode === 'owner' ? (
            <button
              key={l.key}
              type="button"
              className="sat off"
              style={style}
              aria-label={`Add ${l.kind.name}`}
              title={`Add ${l.kind.name}`}
              onClick={() => (l.kind.id === 'email' ? (window.location.href = '/me/edit#accounts') : openSheet(l.kind.id === 'linkedin' ? 'linkedin.com/in/' : l.kind.id === 'x' ? 'x.com/' : ''))}
            >
              <Mark kind={l.kind} url={l.href} />
            </button>
          ) : (
            <span key={l.key} className="sat off" style={style} aria-hidden="true"><Mark kind={l.kind} url={l.href} /></span>
          );
        })}
        {ownerMore && (
          <button type="button" className="sat" style={{ left: `${pos[count - 1]!.x}%`, top: `${pos[count - 1]!.y}%` }} aria-label={`${more} more links`} onClick={() => openSheet()}>
            <span className="mark len-2">+{more}</span>
          </button>
        )}
      </div>

      {open && (
        <LinksSheet mode={mode} linked={linked} empty={empty} name={name} preset={preset} vcardHref={vcardHref} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function LinksSheet({
  mode,
  linked,
  empty,
  name,
  preset,
  vcardHref,
  onClose,
}: {
  mode: 'owner' | 'public';
  linked: CardLink[];
  empty: CardLink[];
  name: string;
  preset: string;
  vcardHref?: string | null;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(preset);
  const [state, action] = useActionState<LinkState | null, FormData>(addLink, null);
  const input = useRef<HTMLInputElement>(null);
  const lastAt = useRef(0);

  // Close on Escape; focus the box when adding.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    if (mode === 'owner') input.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mode, onClose]);

  // Clear the box after a successful add.
  useEffect(() => {
    if (state?.ok && state.at !== lastAt.current) {
      lastAt.current = state.at;
      setUrl('');
    }
  }, [state]);

  const valid = !!cleanUrl(url) && !/\/in\/?$|^x\.com\/?$/i.test(url.trim());
  const kind = valid ? detectLink(url) : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass sheet modal-sheet" role="dialog" aria-modal="true" aria-label={mode === 'owner' ? 'Your links' : `${name}'s links`} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{mode === 'owner' ? 'Your links' : `${name.split(/\s+/)[0]}'s links`}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Cross size={18} /></button>
        </div>

        {mode === 'owner' && (
          <form action={action} className="stack" style={{ gap: 8 }}>
            <label className="label" htmlFor="new-link">Add a link</label>
            <div className="link-input">
              <span className="sat static" aria-hidden="true">{kind ? <Mark key={cleanUrl(url) ?? ""} kind={kind} url={cleanUrl(url)} /> : <Plus />}</span>
              <input
                ref={input}
                id="new-link"
                name="url"
                className="input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="github.com/you, behance.net/you, you.substack.com…"
                inputMode="url"
                autoComplete="url"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
            <span className="hint" aria-live="polite">
              {kind ? `Shows as ${kind.name} on your card.` : 'Paste any link: GitHub, Behance, Substack, Instagram, a portfolio…'}
            </span>
            {state && <span className={state.ok ? 'hint ok' : 'error'} role="status">{state.message}</span>}
            <SubmitButton className="btn btn-primary btn-block" pendingText="Adding…">Add to my card</SubmitButton>
          </form>
        )}

        <div className="stack" style={{ gap: 4 }}>
          {mode === 'owner' && linked.length > 0 && <span className="label">On your card</span>}
          {linked.length === 0 && mode === 'public' && <p className="muted" style={{ margin: 0, fontSize: 14 }}>No links yet.</p>}
          {linked.map((l) => (
            <div key={l.key} className="link-row">
              <a href={l.href!} {...(l.href!.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})} className="row" style={{ gap: 12, flex: 1, minWidth: 0, textDecoration: 'none' }}>
                <span className="sat static"><Mark kind={l.kind} url={l.href} /></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600 }}>{l.kind.name}</span>
                  <span className="muted" style={{ display: 'block', fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.display}</span>
                </span>
              </a>
              {mode === 'owner' && l.key !== 'email' && (
                <form action={removeLink}>
                  <input type="hidden" name="key" value={l.key} />
                  <SubmitButton className="link-btn danger" pendingText="…">Remove</SubmitButton>
                </form>
              )}
            </div>
          ))}
        </div>

        {mode === 'owner' && empty.length > 0 && (
          <div className="stack" style={{ gap: 4 }}>
            <span className="label">Not linked yet</span>
            {empty.map((l) => (
              <button
                key={l.key}
                type="button"
                className="link-row off"
                onClick={() => {
                  if (l.kind.id === 'email') window.location.href = '/me/edit#accounts';
                  else if (l.kind.id === 'website') { setUrl(''); input.current?.focus(); }
                  else { setUrl(l.kind.id === 'linkedin' ? 'linkedin.com/in/' : 'x.com/'); input.current?.focus(); }
                }}
              >
                <span className="sat static off"><Mark kind={l.kind} url={l.href} /></span>
                <span style={{ fontSize: 14 }}>{l.display}</span>
              </button>
            ))}
          </div>
        )}

        {mode === 'public' && vcardHref && (
          <a href={vcardHref} className="btn btn-ghost btn-block">Save to my phone contacts</a>
        )}
      </div>
    </div>
  );
}
