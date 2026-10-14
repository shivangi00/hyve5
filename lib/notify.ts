import webpush from 'web-push';
import { createAdminClient } from './supabase/admin';
import { sendEmail } from './email';
import { siteUrl } from './util';

export type NotifyInput = {
  kind: string;
  title: string;
  body?: string;
  /** Same-site path, e.g. /connect/123 */
  link?: string;
  /** Also send the email version when email is configured (reminders only). */
  email?: { subject: string; html: string };
};

let vapidReady: boolean | null = null;
function pushReady() {
  if (vapidReady !== null) return vapidReady;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (vapidReady = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:hello@example.com', pub, priv);
  return (vapidReady = true);
}

/**
 * One call, three channels:
 *  1. In-app: always saved to the notifications table (the bell).
 *  2. Push: sent to every device the person turned reminders on for.
 *  3. Email: only if RESEND_API_KEY is set and `email` is given.
 * Never throws: a failed channel is logged and the others still go out.
 */
export async function notify(userId: string, n: NotifyInput) {
  const result = { inApp: false, push: 0, email: false };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('notify(): SUPABASE_SERVICE_ROLE_KEY is not set, skipping');
    return result;
  }
  const admin = createAdminClient();

  const { error } = await admin.from('notifications').insert({
    user_id: userId,
    kind: n.kind,
    title: n.title,
    body: n.body ?? null,
    link: n.link ?? null,
  });
  if (error) console.error('notify(): insert failed', error);
  else result.inApp = true;

  if (pushReady()) {
    const { data: subs } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', userId);
    const payload = JSON.stringify({ title: n.title, body: n.body ?? '', url: n.link ?? '/notifications', tag: n.kind });
    await Promise.all(
      (subs ?? []).map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24 });
          result.push++;
        } catch (e: unknown) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) {
            await admin.from('push_subscriptions').delete().eq('id', s.id); // device unsubscribed
          } else {
            console.error('notify(): push failed', code, e);
          }
        }
      })
    );
  }

  if (n.email && process.env.RESEND_API_KEY) {
    const { data: priv } = await admin.from('profile_private').select('email').eq('id', userId).maybeSingle();
    if (priv?.email) result.email = (await sendEmail(priv.email, n.email.subject, n.email.html)).ok;
  }

  return result;
}

export function absolute(path: string) {
  return `${siteUrl()}${path}`;
}

/** Short copy for reminder notifications (fits a lock-screen banner). */
export function reminderCopy(kind: string, contactName: string, eventName: string | null) {
  const first = contactName.split(/\s+/)[0] || contactName;
  const where = eventName ? ` from ${eventName}` : '';
  switch (kind) {
    case 'followup_d3':
      return { title: `No call booked with ${first} yet`, body: `Send a quick nudge with your booking link. It's ready to go.` };
    case 'lastcall_d7':
      return { title: `Last day to book ${first}`, body: `A week since you met. Book the call today, or archive them.` };
    default:
      return { title: `${first} is still fresh`, body: `You met${where} a few hours ago. Your message is drafted. Tap to send.` };
  }
}
