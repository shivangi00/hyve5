import Link from 'next/link';
import { requireProfile } from '@/lib/session';
import { Back } from '@/components/Icons';
import { APP_TZ, STATUS, fmtDayDate, fmtTime } from '@/lib/util';
import { addSlot, chooseIdentity, deleteSlot, saveProfile, signOut } from './actions';
import { ConnectAccount } from './ConnectAccount';
import { Avatar } from '@/components/Avatar';
import { SlotInput } from './SlotInput';
import type { Slot, Status } from '@/lib/types';

export const dynamic = 'force-dynamic';

const PROVIDERS = [
  { id: 'linkedin_oidc' as const, label: 'LinkedIn' },
  { id: 'google' as const, label: 'Google' },
];

export default async function EditPage({ searchParams }: { searchParams: Promise<{ slot?: string; source?: string }> }) {
  const sp = await searchParams;
  const { supabase, user, profile } = await requireProfile('/me/edit');
  const accounts = PROVIDERS.map((p) => {
    const identity = user.identities?.find((i) => i.provider === p.id);
    const d = (identity?.identity_data ?? {}) as Record<string, string | undefined>;
    const name = d.full_name || d.name || [d.given_name, d.family_name].filter(Boolean).join(' ') || null;
    const photo = d.avatar_url || d.picture || null;
    return { ...p, connected: !!identity, name, photo, email: d.email ?? null, photoInUse: !!photo && photo === profile.avatar_url, nameInUse: !!name && name === profile.full_name };
  });
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
        <Field label="LinkedIn profile URL" name="linkedin_url" value={profile.linkedin_url} placeholder="linkedin.com/in/yourname" />
        <Field label="X / Twitter URL" name="x_url" value={profile.x_url} placeholder="x.com/yourname" />
        <Field label="Website or portfolio" name="website_url" value={profile.website_url} placeholder="yoursite.com" />
        <button className="btn btn-primary btn-block">Save card</button>
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
            {!s.booked_at && <button className="link-btn" style={{ minHeight: 32 }}>Remove</button>}
          </form>
        ))}
        <form action={addSlot} className="stack" style={{ gap: 8 }}>
          <SlotInput />
          <button className="btn btn-ghost btn-block">Add time</button>
        </form>
      </section>

      <section id="accounts" className="glass sheet" style={{ gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Sign-in accounts</h2>
          <p className="hint" style={{ margin: '4px 0 0' }}>Choose where your card's name and photo come from. Signing in again never overwrites them.</p>
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
              {(a.photoInUse || a.nameInUse) && <span className="pill" style={{ height: 24, fontSize: 11 }}>In use</span>}
            </div>
            {a.connected ? (
              <form action={chooseIdentity} className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                <input type="hidden" name="provider" value={a.id} />
                <button className="btn btn-ghost btn-sm" name="take_both" value="1">Use name + photo</button>
                {a.photo && <button className="btn btn-ghost btn-sm" name="take_photo" value="1">Photo only</button>}
                {a.name && <button className="btn btn-ghost btn-sm" name="take_name" value="1">Name only</button>}
              </form>
            ) : (
              <ConnectAccount provider={a.id} label={a.label} />
            )}
          </div>
        ))}
      </section>

      <form action={signOut} style={{ textAlign: 'center' }}>
        <button className="link-btn">Sign out</button>
      </form>
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
