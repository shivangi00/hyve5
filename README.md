# NetworkPulse

Swap bento cards at events, then follow up while it still counts.

- **Scan → swap in ~15 seconds.** Anyone scans your QR, taps *Swap with LinkedIn*, confirms one line, and gets their own card. No app install.
- **Event tagging.** While you're "attending" an event, everyone who swaps with you is tagged to it automatically.
- **Ride Home stack.** Swipe right to follow up, left to archive quietly. Best matches first, with the reason shown.
- **Follow-up screen.** A drafted message (Warm / Short / Direct), your booking link, one-tap LinkedIn / email / WhatsApp, and a progress strip: Met → Messaged → Call booked → Done.
- **Reminders.** Nudges at 3 hours (message them), day 3 and day 7 (get the call booked), delivered three ways: the in-app bell, phone push notifications, and (optionally) email. They clear themselves as you make progress.
- **Booking.** Your card shows your next three open 15-minute slots. Anyone can book one; the card owner gets notified.

Visual direction inspired by bento card work by Tran Mau Tri Tam for UI8 on Dribbble. No assets from that work are included.

---

## Setup (about 30–40 minutes the first time)

You need **Node.js 20 or newer** (`node -v` to check).

### 1. Install

```bash
cd networkpulse
npm install
cp .env.example .env.local
```

### 2. Supabase (database + sign-in)

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, paste all of `supabase/schema.sql`, click **Run**.
3. **Project Settings → API**: copy the URL, the `anon` key and the `service_role` key into `.env.local`.
4. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` for now (change it to your Vercel URL after deploying).
   - Redirect URLs: add `http://localhost:3000/**` and later `https://YOUR-APP.vercel.app/**`.

### 3. Sign-in providers

Your Supabase callback URL (you'll paste it into Google and LinkedIn) is:
`https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`

**Google (do this first, it's quickest)**
1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → OAuth consent screen → External. Fill in the app name and your email.
2. **Publish the app** (switch from *Testing* to *In production*). In Testing mode only listed test users can sign in, which would break the live demo. Basic name/email/photo access doesn't need Google review.
3. Credentials → Create credentials → OAuth client ID → Web application. Add the Supabase callback URL under *Authorized redirect URIs*.
4. Supabase → Authentication → Sign In / Providers → **Google**: paste the client ID and secret, enable.

**LinkedIn**
1. [LinkedIn Developers](https://www.linkedin.com/developers/apps) → Create app. LinkedIn asks you to link the app to a LinkedIn **Company Page**; create a simple page for NetworkPulse if you don't have one.
2. In the app: **Products → Sign In with LinkedIn using OpenID Connect → Request access** (approved instantly).
3. **Auth** tab: add the Supabase callback URL under *Authorized redirect URLs*. Copy the client ID and secret.
4. Supabase → Authentication → Sign In / Providers → **LinkedIn (OIDC)**: paste them, enable.

LinkedIn only shares name, email and photo. That's why onboarding asks for one line ("Product lead at Lumen Health"), pre-filled with the company from a work email when possible.

### 4. Run it

```bash
npm run dev
```

Open http://localhost:3000, sign in, make your card.

### 5. Deploy to Vercel (needed to test on phones)

1. Put the folder in a GitHub repo of your own and import it at [vercel.com/new](https://vercel.com/new).
2. Add every variable from `.env.local` under **Settings → Environment Variables**, with `NEXT_PUBLIC_SITE_URL` set to your Vercel URL (no trailing slash). Redeploy.
3. In Supabase, set the Site URL to the Vercel URL and add `https://YOUR-APP.vercel.app/**` to the Redirect URLs.

### 6. Optional: AI drafts and headlines

Add `ANTHROPIC_API_KEY` (from [console.anthropic.com](https://console.anthropic.com)). Without it, the app uses solid templates, so nothing breaks. If the default model name in `.env.example` is rejected, set `ANTHROPIC_MODEL` to a current Haiku model from Anthropic's docs.

### 7. Notifications and reminders

Reminders reach people three ways. The first two need no domain and no email service.

**a) In-app bell.** Works out of the box. Every screen's bell shows unread reminders, new swaps and bookings.

**b) Phone push notifications.**
1. Run `npm run vapid`. It prints a Public Key and a Private Key.
2. Put them in `.env.local` (and Vercel) as `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`. Set `VAPID_SUBJECT` to `mailto:` plus your email.
3. Redeploy. People turn notifications on from the prompt on their card, on the "Cards swapped" screen, or on the Notifications page.
   - **Android / desktop Chrome:** one tap on *Turn on notifications*, then *Allow*.
   - **iPhone:** push only works for web apps added to the home screen (iOS 16.4+). The prompt shows the steps: Share → Add to Home Screen → open it from the home screen → sign in once more (home-screen apps keep their own sign-in) → *Turn on notifications*.
   - Push only works on the real `https://` site, not on a phone pointed at `localhost`.

**c) Email (optional).** Add `RESEND_API_KEY` from [Resend](https://resend.com) to also send email copies. With the default sender (`onboarding@resend.dev`) Resend only delivers to your own Resend account email; verify a domain in Resend to email everyone.

**The schedule.** Reminders are checked every 10 minutes:
1. Set `CRON_SECRET` to a long random string (in Vercel too).
2. Supabase → Database → Extensions: enable **pg_cron** and **pg_net**. Then edit and run `supabase/reminders-cron.sql`.

To check it: open `https://YOUR-APP.vercel.app/api/cron/reminders` with header `Authorization: Bearer YOUR_CRON_SECRET`. It returns `{checked, sent, skipped}`.

If you already ran an older `schema.sql` before notifications were added, run `supabase/002-notifications.sql` once (or re-run `schema.sql`, which resets all data).

---

## Before the event

1. **Seed a demo stack.** Edit the email at the top of `supabase/seed-demo.sql`, run it. You get an "XYZ Summit" event and six sample people in your Ride Home stack, so the swipe and follow-up screens look full while you pitch. Change the event name in the SQL, or create a real event in the app.
2. **Set your event.** On your card, tap the event tile → enter the event name and end time.
3. **Rehearse the swap with a second phone** (or a private browser window): scan your QR → Swap with LinkedIn → one line → swapped.
4. **Rehearse a reminder.** Turn on notifications on your phone first. Then open someone in Ride Home → *Send me one now*. The reminder lands on your lock screen within seconds; tapping it opens the drafted message.
5. **For organisers:** the event page (`/e/<event-slug>`, linked from the event screen) shows a printable check-in QR. Scanning it checks people in and gives them a card.

## What's where

| Path | What it is |
|---|---|
| `/` | Landing |
| `/login` | LinkedIn / Google sign-in |
| `/onboarding` | One line + status → AI headline → card |
| `/me` | Your bento card, QR share, Ride Home badge |
| `/me/edit` | Edit card, links, bookable times, sign out |
| `/events/new` | Set the event you're attending |
| `/e/[slug]` | Event check-in page (+ printable QR for the host) |
| `/c/[slug]` | Public card: swap button, booking |
| `/c/[slug]/swap` | Performs the swap (bounces through login/onboarding) |
| `/ride-home` | Swipe stack + follow-up list |
| `/connect/[swapId]` | Draft, send, progress, reminders |
| `/notifications` | Bell list: reminders, new swaps, bookings; turn on push |
| `/api/push` | Saves / removes a device's push subscription |
| `/api/draft` | Rewrites the message in another tone |
| `/api/cron/reminders` | Sends due reminder emails |
| `supabase/schema.sql` | Tables, row-level security, `swap_cards` and `book_slot` functions |

## Known limits (fine for the demo, worth knowing)

- The app was written without a local test build, and `next.config.mjs` skips type errors during build so a small one can't block a deploy. Run `npx tsc --noEmit` to see any; send them over to be fixed.
- Times are displayed in UK time (`NEXT_PUBLIC_APP_TZ`, default `Europe/London`).
- LinkedIn doesn't allow apps to send connection requests, so *Copy and open LinkedIn* copies your message and opens their profile (or a LinkedIn search if they haven't added a profile URL).
- iPhone users must add the site to their home screen before push works (an Apple rule for web apps). Everyone still gets the in-app bell.
- Match ordering is a transparent heuristic (status fit, shared topics, whether you wrote a note), not AI.
