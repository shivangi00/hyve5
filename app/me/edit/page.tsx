import Link from 'next/link';
import { requireProfile } from '@/lib/session';
import { Back } from '@/components/Icons';
import { APP_TZ, STATUS, fmtDayDate, fmtTime } from '@/lib/util';
import { addSlot, deleteSlot, saveProfile, signOut } from './actions';
import { SlotInput } from './SlotInput';
import type { Slot, Status } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EditPage() {
  const { supabase, profile } = await requireProfile('/me/edit');
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
          <p className="hint" style={{ margin: '4px 0 0' }}>The next three open times show on your card as 15-minute calls.</p>
        </div>
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
