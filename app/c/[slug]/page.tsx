import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { BentoCard } from '@/components/BentoCard';
import { Avatar } from '@/components/Avatar';
import { StatusPill } from '@/components/StatusPill';
import { Check, Pin } from '@/components/Icons';
import { BrandMark } from '@/components/BrandMark';
import { NoteForm } from './NoteForm';
import { PushPrompt } from '@/components/PushPrompt';
import { APP_TZ, firstName, fmtDayDate, fmtEventWhen, isLive } from '@/lib/util';
import { answerSameEvent } from './actions';
import { SubmitButton } from '@/components/SubmitButton';
import type { EventRow, Profile, Slot, Swap } from '@/lib/types';
import { PendingLink } from '@/components/PendingLink';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { supabase } = await getSession();
  const { data } = await supabase.from('profiles').select('full_name, role_line').eq('slug', slug).maybeSingle();
  return data ? { title: `${data.full_name} · hyve5`, description: data.role_line ?? undefined } : { title: 'hyve5' };
}

export default async function PublicCard({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ swapped?: string; error?: string; ev?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase, user, profile: viewer } = await getSession();

  const { data: hostData } = await supabase.from('profiles').select('*').eq('slug', slug).maybeSingle();
  const host = hostData as Profile | null;
  if (!host) notFound();

  const [{ data: ev }, { data: slots }, { data: swapData }] = await Promise.all([
    host.active_event_id ? supabase.from('events').select('*').eq('id', host.active_event_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('slots').select('*').eq('owner_id', host.id).is('booked_at', null).gte('starts_at', new Date().toISOString()).order('starts_at').limit(3),
    user ? supabase.from('swaps').select('*').eq('owner_id', user.id).eq('contact_id', host.id).is('deleted_at', null).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const event = (ev as EventRow | null) ?? null;
  const swap = swapData as Swap | null;
  const isOwner = user?.id === host.id;
  // Email is only readable by the owner and people who've swapped with them (database rules enforce this).
  const { data: hostPriv } = swap || isOwner ? await supabase.from('profile_private').select('email').eq('id', host.id).maybeSingle() : { data: null };
  const hostEmail = (hostPriv as { email: string | null } | null)?.email ?? null;
  const first = firstName(host.full_name);

  let swapEvent: EventRow | null = null;
  if (swap?.event_id) {
    swapEvent = swap.event_id === event?.id ? event : ((await supabase.from('events').select('*').eq('id', swap.event_id).maybeSingle()).data as EventRow | null);
  }

  // The host is at an event right now and this swap isn't tagged to it yet: ask the guest.
  const askEvent = !!(swap && !isOwner && event && isLive(event) && swap.event_id !== event.id && sp.ev !== 'no');

  // ── Just swapped: show the guest their new card and the shared event ──
  if (sp.swapped && swap && viewer) {
    return (
      <main className="shell">
        <div className="pill rise" style={{ alignSelf: 'center', height: 34, fontSize: 13, background: 'rgba(18, 18, 20,.7)', marginTop: 6 }}>
          <Check size={15} color="#4ADE80" /> Cards swapped with {first}
        </div>

        <section className="glass bento rise" aria-label="Your card">
          <div className="tile span-2 row" style={{ padding: 16, gap: 14 }}>
            <Avatar name={viewer.full_name} url={viewer.avatar_url} size={66} />
            <div className="stack" style={{ gap: 5, minWidth: 0 }}>
              <div className="name" style={{ fontSize: 19 }}>{viewer.full_name}</div>
              {viewer.role_line && <div className="muted" style={{ fontSize: 13 }}>{viewer.role_line}</div>}
              <div><StatusPill status={viewer.status} /></div>
            </div>
          </div>
          {viewer.headline && viewer.headline !== viewer.role_line && (
            <div className="tile span-2" style={{ fontSize: 14, lineHeight: 1.45 }}>
              <div className="label" style={{ marginBottom: 6 }}>Your headline</div>
              {viewer.headline}
            </div>
          )}
        </section>

        {askEvent && event ? (
          <section className="glass sheet rise" style={{ gap: 12 }} aria-labelledby="same-event">
            <div className="row" style={{ gap: 12 }}>
              <span className="round" style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,200,61,.16)', border: '1px solid rgba(255,200,61,.4)', flex: 'none' }}>
                <Pin color="#FFD24D" />
              </span>
              <div>
                <h2 id="same-event" style={{ margin: 0, fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>Are you attending {event.name} too?</h2>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{first} is there now · {fmtEventWhen(event, APP_TZ)}{event.venue ? ` · ${event.venue}` : ''}</div>
              </div>
            </div>
            <form action={answerSameEvent} className="row" style={{ gap: 8 }}>
              <input type="hidden" name="slug" value={host.slug} />
              <SubmitButton className="btn btn-primary" style={{ flex: 1, height: 48 }} name="answer" value="yes" pendingText="Joining…">Yes, I'm there</SubmitButton>
              <SubmitButton className="btn btn-ghost" style={{ flex: 1 }} name="answer" value="no" pendingText="Saving…">No</SubmitButton>
            </form>
            <p className="hint" style={{ margin: 0 }}>Yes puts you both in the {event.name} stack and tags your card to it. No saves {first} under today's date.</p>
          </section>
        ) : (
          <div className="glass row" style={{ borderRadius: 26, padding: '14px 16px', gap: 12 }}>
            <span className="round" style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,200,61,.16)', border: '1px solid rgba(255,200,61,.4)', flex: 'none' }}>
              <Pin color="#FFD24D" />
            </span>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.4 }}>
              {swapEvent ? (
                <>
                  <strong>You're both at {swapEvent.name}.</strong>{' '}
                  <span className="muted">{first} is in your {swapEvent.name} stack.</span>
                </>
              ) : (
                <span className="muted">{first} is saved to your stack under {fmtDayDate(swap.met_at, APP_TZ)}. We'll remind you to message them within 3 hours.</span>
              )}
            </p>
          </div>
        )}

        <section className="glass sheet">
          <NoteForm swapId={swap.id} initial={swap.note ?? ''} about={first} />
        </section>

        <PushPrompt context="swap" showWhenOn />

        <div className="bottom">
          <Link href="/me" className="btn btn-primary btn-block">Show my card to the next person</Link>
          <Link href="/ride-home" className="link-btn" style={{ textAlign: 'center' }}>Open my follow-up stack</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="topbar">
        <Link href={user ? '/me' : '/'} className="brand"><BrandMark /></Link>
        {isOwner && <Link href="/me" className="pill" style={{ textDecoration: 'none' }}>This is your public card</Link>}
      </div>

      <BentoCard
        profile={host}
        event={event}
        slots={(slots as Slot[]) ?? []}
        mode="public"
        email={hostEmail}
        swapped={!!swap || isOwner}
        viewer={user && viewer ? { name: viewer.full_name, email: user.email ?? '' } : null}
      />

      {!isOwner && (
        <div className="bottom">
          <section className="glass sheet">
            {swap ? (
              <>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>You've swapped with {first}</h2>
                <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>They're in your follow-up stack{swapEvent ? ` under ${swapEvent.name}` : ''}.</p>
                <Link href={`/connect/${swap.id}`} className="btn btn-primary btn-block">Write to {first}</Link>
                <a href={`/c/${host.slug}/vcard`} className="btn btn-ghost btn-block">Save to my phone contacts</a>
              </>
            ) : (
              <>
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 }}>Swap cards with {first}</h2>
                  <p className="muted" style={{ margin: '6px 0 0', fontSize: 13.5, lineHeight: 1.4 }}>
                    Get your own card in about 15 seconds. You'll both find each other in your follow-up stack.
                  </p>
                </div>
                {/* Plain <a>, not <Link>: prefetching this URL would perform the swap. */}
                <PendingLink href={`/c/${host.slug}/swap`} className="btn btn-primary btn-block" pendingText={user ? 'Swapping cards…' : 'Opening LinkedIn…'}>
                  {user ? 'Swap cards' : <><span className="in-mark">in</span>Swap with LinkedIn</>}
                </PendingLink>
                {sp.error && <p className="error" style={{ margin: 0 }}>That didn't work. Try again?</p>}
                <p className="hint" style={{ margin: 0, textAlign: 'center' }}>No app to install · only your name and photo are imported</p>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
