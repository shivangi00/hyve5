import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireProfile } from '@/lib/session';
import { Back } from '@/components/Icons';
import { Avatar } from '@/components/Avatar';
import { BellLink } from '@/components/BellLink';
import { FollowUp, type ReminderView } from './FollowUp';
import { draftMessage } from '@/lib/ai';
import { APP_TZ, fmtDayDate, fmtTime, firstName, siteUrl, timeLeft } from '@/lib/util';
import type { EventRow, Profile, Reminder, Swap } from '@/lib/types';

export const dynamic = 'force-dynamic';

const TITLES: Record<Reminder['kind'], string> = {
  message_3h: 'Nudge if not messaged',
  followup_d3: 'Follow-up if no call booked',
  lastcall_d7: 'Last call for a meeting',
};

export default async function ConnectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile: me } = await requireProfile(`/connect/${id}`);

  const { data: swapData } = await supabase.from('swaps').select('*').eq('id', id).eq('owner_id', me.id).maybeSingle();
  const swap = swapData as Swap | null;
  if (!swap) notFound();

  const [{ data: c }, { data: priv }, { data: ev }, { data: rem }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', swap.contact_id).single(),
    supabase.from('profile_private').select('email').eq('id', swap.contact_id).maybeSingle(),
    swap.event_id ? supabase.from('events').select('*').eq('id', swap.event_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('reminders').select('*').eq('swap_id', swap.id).order('due_at'),
  ]);
  const contact = c as Profile;
  const event = ev as EventRow | null;

  const draft = await draftMessage({
    myName: me.full_name,
    myTopics: me.topics,
    contactName: contact.full_name,
    contactRole: contact.role_line,
    eventName: event?.name ?? null,
    note: swap.note,
    tone: 'warm',
  });

  const met = new Date(swap.met_at).getTime();
  const deadlines = {
    message: timeLeft(new Date(met + 3 * 3600e3).toISOString()),
    call: timeLeft(new Date(met + 7 * 86400e3).toISOString()),
    messagePct: Math.max(0, Math.min(100, Math.round(100 - ((Date.now() - met) / (3 * 3600e3)) * 100))),
    callPct: Math.max(0, Math.min(100, Math.round(100 - ((Date.now() - met) / (7 * 86400e3)) * 100))),
  };

  const reminders: ReminderView[] = ((rem as Reminder[]) ?? []).map((r) => ({
    kind: r.kind,
    title: TITLES[r.kind],
    when: `${fmtDayDate(r.due_at, APP_TZ)}, ${fmtTime(r.due_at, APP_TZ)}`,
    state: r.cleared_at ? 'cleared' : r.sent_at ? 'sent' : 'set',
  }));

  return (
    <main className="shell" style={{ gap: 12 }}>
      <div className="topbar">
        <Link href="/ride-home" className="icon-btn" aria-label="Back to Ride Home"><Back /></Link>
        <span className="topbar-title">Follow up</span>
        <BellLink userId={me.id} />
      </div>

      <section className="glass" style={{ borderRadius: 32, padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="row" style={{ gap: 12, padding: 4 }}>
          <Avatar name={contact.full_name} url={contact.avatar_url} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{contact.full_name}</h1>
            {contact.role_line && <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{contact.role_line}</div>}
          </div>
          <div className="label" style={{ textAlign: 'right', lineHeight: 1.4, fontSize: 10 }}>
            Met {fmtTime(swap.met_at, APP_TZ)}
            {event && <><br />{event.name}</>}
          </div>
        </div>
      </section>

      <FollowUp
        swapId={swap.id}
        initialStage={swap.stage}
        contact={{
          name: contact.full_name,
          first: firstName(contact.full_name),
          linkedin: contact.linkedin_url,
          email: (priv as { email: string | null } | null)?.email ?? null,
        }}
        bookingUrl={`${siteUrl()}/c/${me.slug}#book`}
        initialDraft={draft.text}
        aiUsed={draft.ai}
        deadlines={deadlines}
        reminders={reminders}
      />
    </main>
  );
}
