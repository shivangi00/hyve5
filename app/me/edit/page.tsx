import Link from 'next/link';
import { requireProfile } from '@/lib/session';
import { Back } from '@/components/Icons';
import { APP_TZ, STATUS, fmtDayDate, fmtTime } from '@/lib/util';
import { addSlot, chooseIdentity, deleteSlot, saveProfile, signOut } from './actions';
import { DeleteAccount } from './DeleteAccount';
import { LinkedInField } from '@/components/LinkedInField';
import { ConnectAccount } from './ConnectAccount';
import { Avatar } from '@/components/Avatar';
import { SlotInput } from './SlotInput';
import type { Slot, Status } from '@/lib/types';
import { SubmitButton } from '@/components/SubmitButton';

export const dynamic = 'force-dynamic';

const PROVIDERS = [
  { id: 'linkedin_oidc' as const, label: 'LinkedIn' },
  { id: 'google' as const, label: 'Google' },
];

export default async function EditPage({ searchParams }: { searchParams: Promise<{ slot?: string; source?: string; account?: string }> }) {
  const sp = await searchParams;
  const { supabase, user, profile } = await requireProfile('/me/edit');
  const accounts = PROVIDERS.map((p) => {
    const identity = user.identities?.find((i) => i.provider === p.id);
    const d = (identity?.identity_data ?? {}) as Record<string, string | undefined>;
    const name = d.full_name || d.name || [d.given_name, d.family_name].filter(Boolean).join(' ') || null;
    const photo = d.avatar_url || d.picture || null;
    return { ...p, connected: !!identity, name, photo, email: d.email ?? null };
  });
  const { data: priv } = await supabase.from('profile_private').select('email').eq('id', profile.id).maybeSingle();
  const emailInUse: string | null = priv?.email ?? user.email ?? null;
  const signedInWithLinkedIn = accounts.some((a) => a.id === 'linkedin_oidc' && a.connected);
  const { data } = await supabase
    .from('slots')
    .select('*')
    .eq('owner_id', profile.id)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at');
  const slots = (data as (Slot & { booked_by_name: string | null })[]) ?? [];

  return (
    <main className="shell">
      <div className="topbar">
        <Link href="/me" className="icon-btn" aria-label="Back to my card"><Back /></Link>
        <span className="topbar-title">Edit card</span>
        <span style={{ width: 44 }} />
      </div>

      <form action={saveProfile} className="glass sheet" style={{ gap: 14 }}>
        <Field label="Name" name="full_name" value={profile.full_name} required />
        <Field label="Role and company" name="role_line" value={profile.role_line} placeholder="Product lead at Lumen Health" />
        <div className="field">
          <label className="label" htmlFor="headline">Headline</label>
          <textarea id="headline" name="headline" className="textarea" style={{ minHeight: 80 }} defaultValue={profile.headline ?? ''} maxLength={140} />
        </div>
        <div className="field">
          <label className="label" htmlFor="status">Right now I'm</label>
          <select id="status" name="status" className="input" defaultValue={profile.status}>
            {(Object.keys(STATUS) as Status[]).map((s) => (
              <option key={s} value={s}>{STATUS[s].label}</option>
            ))}
          </select>
        </div>
        <Field label="Ask me about (comma separated)" name="topics" value={profile.topics.join(', ')} />
        <span id="links" style={{ scrollMarginTop: 80 }} />
        <p className="hint" style={{ margin: 0 }}>Add GitHub, Behance, Substack, Instagram or any other link with the <strong style={{ color: 'var(--ink)' }}>+</strong> in the link circle on your card.</p>
        <LinkedInField value={profile.linkedin_url} signedInWithLinkedIn={signedInWithLinkedIn} />
        <Field label="X / Twitter URL" name="x_url" value={profile.x_url} placeholder="x.com/yourname" />
        <Field label="Website or portfolio" name="website_url" value={profile.website_url} placeholder="yoursite.com" />
        <SubmitButton pendingText="Saving…">Save card</SubmitButton>
      </form>

      <section id="times" className="glass sheet" style={{ gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Bookable times</h2>
          <p className="hint" style={{ margin: '4px 0 0' }}>The next three open times show on your card as 15-minute calls. Only future times can be added.</p>
        </div>
        {sp.slot === 'past' && <p className="error" role="alert" style={{ margin: 0 }}>That time has already passed, so it wasn't added. Pick a future time.</p>}
        {sp.slot === 'invalid' && <p className="error" role="alert" style={{ margin: 0 }}>Choose a date and time first.</p>}
        {sp.slot === 'added' && <p className="hint" role="status" style={{ margin: 0, color: '#9FF0BC' }}>Time added.</p>}
        {slots.length === 0 && <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>No upcoming times.</p>}
        {slots.map((s) => (
          <form key={s.id} action={deleteSlot} className="list-row" style={{ justifyContent: 'space-between' }}>
            <input type="hidden" name="id" value={s.id} />
            <span style={{ fontSize: 14 }}>
              {fmtDayDate(s.starts_at, APP_TZ)} · {fmtTime(s.starts_at, APP_TZ)}
              {s.booked_at && <span className="muted"> · booked by {s.booked_by_name}</span>}
            </span>
            {!s.booked_at && <SubmitButton className="link-btn" style={{ minHeight: 32 }} pendingText="Removing…">Remove</SubmitButton>}
          </form>
        ))}
        <form action={addSlot} className="stack" style={{ gap: 8 }}>
          <SlotInput />
          <SubmitButton className="btn btn-ghost btn-block" pendingText="Adding…">Add time</SubmitButton>
        </form>
      </section>

      <section id="accounts" className="glass sheet" style={{ gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Sign-in accounts</h2>
          <p className="hint" style={{ margin: '4px 0 0' }}>Choose where your card's name, photo and email come from. Signing in again never overwrites them.</p>
          {emailInUse && <p className="hint" style={{ margin: '4px 0 0' }}>Email in use: <strong style={{ color: 'var(--ink)' }}>{emailInUse}</strong></p>}
        </div>
        {sp.source === 'updated' && <p className="hint" role="status" style={{ margin: 0, color: '#9FF0BC' }}>Card updated.</p>}
        {accounts.map((a) => (
          <div key={a.id} className="list-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 10 }}>
            <div className="row" style={{ gap: 12, width: '100%' }}>
              {a.connected ? <Avatar name={a.name || a.label} url={a.photo} size={42} /> : <span className="round" style={{ width: 42, height: 42, borderRadius: 14, fontWeight: 700 }}>{a.id === 'google' ? 'G' : 'in'}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{a.label}</div>
                <div className="muted" style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.connected ? [a.name, a.email].filter(Boolean).join(' · ') : 'Not connected'}
                </div>
              </div>
              {a.connected && (() => {
                const used = [
                  a.name && a.name === profile.full_name ? 'name' : null,
                  a.photo && a.photo === profile.avatar_url ? 'photo' : null,
                  a.email && a.email === emailInUse ? 'email' : null,
                ].filter(Boolean);
                return used.length ? <span className="pill" style={{ height: 24, fontSize: 11 }}>Using {used.join(', ')}</span> : null;
              })()}
            </div>
            {a.connected ? (
              <form action={chooseIdentity} className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                <input type="hidden" name="provider" value={a.id} />
                <SubmitButton className="btn btn-ghost btn-sm" name="take_all" value="1" pendingText="Updating…">Use all</SubmitButton>
                {a.name && <SubmitButton className="btn btn-ghost btn-sm" name="take_name" value="1" pendingText="Updating…">Name</SubmitButton>}
                {a.photo && <SubmitButton className="btn btn-ghost btn-sm" name="take_photo" value="1" pendingText="Updating…">Photo</SubmitButton>}
                {a.email && <SubmitButton className="btn btn-ghost btn-sm" name="take_email" value="1" pendingText="Updating…">Email</SubmitButton>}
              </form>
            ) : (
              <ConnectAccount provider={a.id} label={a.label} />
            )}
          </div>
        ))}
      </section>

      <form action={signOut} style={{ textAlign: 'center' }}>
        <SubmitButton className="link-btn" pendingText="Signing out…">Sign out</SubmitButton>
      </form>

      <section id="danger" className="glass sheet" style={{ gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Delete account</h2>
          <p className="hint" style={{ margin: '4px 0 0' }}>
            Permanently deletes your card, contacts, notes, bookable times and reminders, and removes you from other people's contacts. This can't be undone.
          </p>
        </div>
        {sp.account === 'unavailable' && <p className="error" role="alert" style={{ margin: 0 }}>Account deletion isn't set up on this server yet (missing service key). Nothing was deleted.</p>}
        <DeleteAccount fullName={profile.full_name} error={sp.account} />
      </section>
    </main>
  );
}

function Field({ label, name, value, placeholder, required }: { label: string; name: string; value: string | null; placeholder?: string; required?: boolean }) {
  return (
    <div className="field">
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} className="input" defaultValue={value ?? ''} placeholder={placeholder} required={required} />
    </div>
  );
}
