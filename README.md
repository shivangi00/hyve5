# hyve5

Swap bento cards at events, then follow up while it still counts.

- **Scan → swap in about 15 seconds.** Anyone scans your QR code, taps *Swap with LinkedIn*, confirms one line, and gets their own card. Nothing to install.
- **Event tagging.** While you're "attending" an event, everyone who swaps with you is tagged to it automatically.
- **Ride Home stack.** Swipe right to follow up, left to archive quietly. Best matches come first, with the reason shown.
- **Follow-up screen.** A drafted message (Warm / Short / Direct), your booking link, one tap to LinkedIn / email / WhatsApp, and a progress strip: Met → Messaged → Call booked → Done.
- **Reminders.** Nudges at 3 hours (send the message), day 3 and day 7 (get the call booked). They arrive in the in-app bell and as phone notifications, plus optional email, and clear themselves as you make progress.
- **Booking.** Your card shows your next three open 15-minute slots. Anyone can book one; you get notified.

Visual direction inspired by bento card work by Tran Mau Tri Tam for UI8 on Dribbble. No assets from that work are included.

---

## Contents

- [Before you start](#before-you-start)
- [Step 1 — Install Node.js, a code editor, and open a terminal](#step-1--install-nodejs-a-code-editor-and-open-a-terminal)
- [Step 2 — Unzip the project and install its packages](#step-2--unzip-the-project-and-install-its-packages)
- [Step 3 — Create the Supabase database](#step-3--create-the-supabase-database)
- [Step 4 — Create the settings file and generate secrets](#step-4--create-the-settings-file-and-generate-secrets)
- [Step 5 — Set up "Continue with Google" (testing mode)](#step-5--set-up-continue-with-google-testing-mode)
- [Step 6 — Get the latest code and put it on GitHub](#step-6--get-the-latest-code-and-put-it-on-github)
- [Step 7 — Set up "Continue with LinkedIn"](#step-7--set-up-continue-with-linkedin)
- [Step 8 — Run it on your laptop and test](#step-8--run-it-on-your-laptop-and-test)
- [Step 9 — Put it online with Vercel](#step-9--put-it-online-with-vercel)
- [Step 10 — Publish Google sign-in so anyone can use it](#step-10--publish-google-sign-in-so-anyone-can-use-it)
- [Step 11 — Switch on the reminder schedule](#step-11--switch-on-the-reminder-schedule)
- [Step 12 — Optional: AI-written messages and email copies](#step-12--optional-ai-written-messages-and-email-copies)
- [Step 13 — Prepare the demo](#step-13--prepare-the-demo)
- [Making changes later](#making-changes-later)
- [Renaming an existing setup to hyve5](#renaming-an-existing-setup-to-hyve5)
- [Troubleshooting](#troubleshooting)
- [Project reference](#project-reference)

---

## Before you start

By the end you will have hyve5 live at a public web address (like `hyve5.vercel.app`), its code on GitHub, Google and LinkedIn sign-in, phone notifications, and a demo stack ready to show. Plan for **2–3 hours** the first time.

**You need:** a Mac or Windows laptop with about 1 GB free, your phone for testing, and the latest **hyve5.zip**.

**Free accounts you'll create along the way:**

| Service | What it does for the app | Needed? |
| --- | --- | --- |
| [Supabase](https://supabase.com) | Database and sign-in | Yes |
| [Google Cloud](https://console.cloud.google.com) | "Continue with Google" | Yes |
| [GitHub](https://github.com) | Stores the code; Vercel deploys from it | Yes |
| [LinkedIn Developers](https://www.linkedin.com/developers/apps) | "Continue with LinkedIn" | Yes |
| [Vercel](https://vercel.com) | Puts the app on the internet | Yes |
| [Anthropic Console](https://console.anthropic.com) | AI-written headlines and messages | Optional (needs prepaid credit) |
| [Resend](https://resend.com) | Email copies of reminders | Optional |

**How to read this guide**

- Text in `grey boxes` is typed or pasted exactly. Replace anything in CAPITALS (like `YOUR_VERCEL_URL`) with your own value.
- **Bold words** are buttons or menu names. Websites rename menus sometimes; pick the closest match.
- Do the steps in order. Each ends with a **Check** so you know it worked.

**Keys note.** Keep a private note (Notes / Notepad) called *hyve5 keys*. Never commit it, post it, or screenshot it. Template:

```
SUPABASE URL:
SUPABASE PUBLISHABLE KEY:
SUPABASE SECRET KEY:
SUPABASE DATABASE PASSWORD:
SUPABASE CALLBACK URL:
GOOGLE CLIENT ID:
GOOGLE CLIENT SECRET:
LINKEDIN CLIENT ID:
LINKEDIN CLIENT SECRET:
VAPID PUBLIC KEY:
VAPID PRIVATE KEY:
CRON SECRET:
GITHUB REPO URL:
VERCEL URL:
```

---

## Step 1 — Install Node.js, a code editor, and open a terminal

*About 15 minutes.* Node.js runs the app on your laptop; the terminal is where you type commands.

**1.1 Check for Node**

1. Open a terminal. **Mac:** Cmd + Space → type `Terminal` → Enter. **Windows:** Windows key → type `PowerShell` → **Windows PowerShell**.
2. Run:
   ```
   node -v
   ```
3. A version of **v20 or higher** means skip to 1.3. "Command not found", "not recognized" or a lower number means do 1.2.

**1.2 Install Node**

1. Go to [nodejs.org](https://nodejs.org) and download the **LTS** version.
2. Run the installer with the default options. On Windows, leave "Automatically install the necessary tools" **unticked**.
3. **Close the terminal and open a new one.**
4. **Check:** `node -v` shows v20+ and `npm -v` shows a number like `10.x.x`.

**1.3 Install VS Code**

Download **Visual Studio Code** from [code.visualstudio.com](https://code.visualstudio.com) and install it. Word processors (Word, Pages, rich-text TextEdit) add hidden formatting, so don't use them for the settings file.

**Terminal tips:** paste with **Cmd + V** (Mac) or **right-click / Ctrl + V** (PowerShell). Stop a running command with **Ctrl + C** (Ctrl on Mac too). A command with no output is usually still working; wait for the prompt to return.

---

## Step 2 — Unzip the project and install its packages

*About 10 minutes.*

**2.1 Unzip**

1. Find **hyve5.zip** (usually in **Downloads**).
2. **Mac:** double-click it. **Windows:** right-click → **Extract All…** → **Extract**.
3. Move the `hyve5` folder into **Documents**.
4. Open it and check you see `package.json`, `README.md` and folders `app`, `lib`, `supabase`. On Windows you may get a folder inside a folder; use the inner one that contains `package.json`.

**2.2 Open it in VS Code**

1. VS Code → **File** → **Open Folder…** → the `hyve5` folder with `package.json` → **Open**. If asked, click **Yes, I trust the authors**.
2. Menu **Terminal** → **New Terminal**. It opens at the bottom, already inside the project.

From now on, **every command goes into this VS Code terminal** unless a step says otherwise.

**2.3 Install packages**

```
npm install
```

Takes 1–4 minutes. Yellow `npm warn` lines and a "vulnerabilities" summary are normal. Do **not** run `npm audit fix --force`.

**Check:** it ends with something like `added 3xx packages`. Red `npm error` lines → see [Troubleshooting](#troubleshooting).

---

## Step 3 — Create the Supabase database

*About 20 minutes.*

**3.1 Account and project**

1. [supabase.com](https://supabase.com) → **Start your project** → sign up. Confirm your email if asked.
2. If asked to create an **organization**: any name, type **Personal**, plan **Free**.
3. **New project:** name `hyve5`; **Database password** → **Generate a password** and save it in your keys note; **Region** closest to your event (e.g. **West EU (London)**).
4. **Create new project** and wait 1–3 minutes.

**3.2 Run the database setup**

1. In VS Code open `supabase/schema.sql`, select all, copy.
2. Supabase → **SQL Editor** → **New query** → paste → **Run** (or Cmd/Ctrl + Enter).
3. If warned about a **destructive operation**, click **Run this query**. (The file recreates the app's own tables; re-running it later **wipes all app data**.)
4. **Check:** `Success. No rows returned`, and **Table Editor** shows 8 tables: `events`, `notifications`, `profile_private`, `profiles`, `push_subscriptions`, `reminders`, `slots`, `swaps`.

You don't need `002-notifications.sql`; it's only for databases set up with an older version.

**3.3 Copy your URL and keys**

1. Your browser address bar shows `supabase.com/dashboard/project/YOUR-PROJECT-REF`. Note that code.
2. In the keys note write:
   - `SUPABASE URL:` `https://YOUR-PROJECT-REF.supabase.co`
   - `SUPABASE CALLBACK URL:` `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
3. **Project Settings** (gear, bottom left) → **API Keys**.
4. Copy the **Publishable key** (`sb_publishable_…`).
5. Under **Secret keys**, reveal and copy the `default` key (`sb_secret_…`). Keep it private.

If you only see keys called **anon** and **service_role**, use `anon` instead of the publishable key and `service_role` instead of the secret key.

**3.4 URL configuration (for now, your laptop)**

1. **Authentication** → **URL Configuration**.
2. **Site URL:** `http://localhost:3000` → **Save**.
3. **Redirect URLs** → **Add URL** → `http://localhost:3000/**` → **Save URLs**.

---

## Step 4 — Create the settings file and generate secrets

*About 10 minutes.* The app reads its keys from `.env.local`. It stays on your laptop and is **never** uploaded to GitHub (the project's `.gitignore` makes sure of that).

**4.1 Phone-notification keys**

```
npm run vapid
```

Copy the **Public Key** and **Private Key** into your keys note (just the codes).

**4.2 Reminder-schedule password**

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the 64-character result as `CRON SECRET`.

**4.3 Create `.env.local`**

1. In VS Code's file list, click the **New File** icon and name it exactly `.env.local`.
2. Paste, then replace every `PASTE_…` with values from your note:

```
NEXT_PUBLIC_SUPABASE_URL=PASTE_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=PASTE_SUPABASE_SECRET_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=PASTE_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=PASTE_VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:PASTE_YOUR_EMAIL
CRON_SECRET=PASTE_CRON_SECRET
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
RESEND_API_KEY=
REMINDER_FROM_EMAIL="hyve5 <onboarding@resend.dev>"
```

3. The names say `ANON_KEY` and `SERVICE_ROLE_KEY`, but you paste the **publishable** and **secret** keys into them. That's intended.
4. No spaces around `=`, no quotes around values (except the last line), one setting per line. Save with Cmd/Ctrl + S.

**Check:** no line still contains `PASTE`.

`VAPID_SUBJECT`'s email is also shown as the contact address on the app's privacy and terms pages.

---

## Step 5 — Set up "Continue with Google" (testing mode)

*About 20 minutes.* In this step Google sign-in works only for people you list as test users. You make it public in [Step 10](#step-10--publish-google-sign-in-so-anyone-can-use-it), once the app is online.

**5.1 Project**

1. [console.cloud.google.com](https://console.cloud.google.com) → sign in → accept terms.
2. **Project picker** (top left) → **New project** → `hyve5` → **Create** → make sure it's selected.

**5.2 Consent screen**

1. Search the top bar for `Google Auth Platform` → open → **Get started**.
2. App name `hyve5`; support email: yours → **Next**.
3. Audience: **External** → **Next**.
4. Contact email: yours → **Next** → agree → **Continue** → **Create**.
5. **Don't upload a logo** (it triggers a review that takes days).

**5.3 Scopes**

**Data Access** → **Add or remove scopes** → tick `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` → **Update** → **Save**.

**5.4 Client**

1. **Clients** → **Create client** → **Web application** → name `hyve5 web`.
2. **Authorized JavaScript origins** → `http://localhost:3000`
3. **Authorized redirect URIs** → your `SUPABASE CALLBACK URL`.
4. **Create**. Copy the **Client ID** and **Client secret** into your note immediately (and **Download JSON** if offered).

**5.5 Test users**

**Audience** → **Test users** → **Add users** → your Google email (and any testers) → **Save**. Leave the status on **Testing**.

**5.6 Connect to Supabase**

Supabase → **Authentication** → **Sign In / Providers** → **Google** → enable → paste Client ID and Client Secret → **Save**.

**Check:** Google shows as enabled in Supabase's provider list.

---

## Step 6 — Get the latest code and put it on GitHub

*About 20 minutes.* GitHub stores your code online. In Step 9, Vercel publishes the app straight from it, and every later change you push goes live automatically.

**6.1 Swap in the latest code (keeps your settings)**

The newest **hyve5.zip** adds the privacy and terms pages Google needs, and this README. You'll swap the whole folder and carry your `.env.local` across.

1. Close VS Code.
2. In **Documents**, rename your current `hyve5` folder to `hyve5-old`.
3. Unzip the new **hyve5.zip** and move its `hyve5` folder into **Documents** (same as Step 2.1).
4. Open the new folder in VS Code (**File → Open Folder…**) and open a terminal (**Terminal → New Terminal**).
5. Copy your settings file across:
   - **Mac:**
     ```
     cp ../hyve5-old/.env.local .
     ```
   - **Windows:**
     ```
     Copy-Item ..\hyve5-old\.env.local .
     ```
6. Install packages again:
   ```
   npm install
   ```

**Check:** `.env.local` appears in VS Code's file list with your values, and the `app` folder contains a `(legal)` folder. Once everything works you can delete `hyve5-old`.

**6.2 Create a GitHub account**

1. Go to [github.com/signup](https://github.com/signup), create an account and verify your email.

**6.3 Install GitHub Desktop and sign in**

GitHub Desktop is a free app for uploading code without typing git commands.

1. Download it from [desktop.github.com](https://desktop.github.com) and install it.
2. Open it → **Sign in to GitHub.com** → approve in the browser → back in the app, keep the suggested name and email → **Finish**.

**6.4 Turn the project folder into a repository**

1. GitHub Desktop → **File** → **Add Local Repository…** → **Choose…** → select `Documents/hyve5` → **Add Repository**.
2. It says the folder isn't a Git repository yet. Click **create a repository**.
3. In the form: **Name** `hyve5`; **Git ignore:** **None** (the project already has one); **License:** **None** → **Create Repository**.

**6.5 Check that no secrets are included (important)**

1. In GitHub Desktop, click the **History** tab and select the first commit (often called *Initial commit*). It lists every file that was saved.
2. Make sure the list contains **no** `.env.local` and **no** `node_modules` folder. They're excluded by `.gitignore`, so they should be missing.
3. If you do see `.env.local` there: **stop, don't publish**, and tell me. Your keys would be uploaded.

If the **Changes** tab still lists files after creating the repository, type `Initial commit` in the **Summary** box at the bottom left and click **Commit to main**.

**6.6 Publish to GitHub (private)**

1. Click **Publish repository** (top bar).
2. **Name:** `hyve5`. Keep **Keep this code private** **ticked** → **Publish repository**.

**Check:** go to [github.com](https://github.com) → your profile → **Repositories** → **hyve5**. You see the project files with this README shown below them, marked **Private**. Copy the page address into your note as `GITHUB REPO URL`.

---

## Step 7 — Set up "Continue with LinkedIn"

*About 20 minutes.* LinkedIn apps must belong to a **LinkedIn Page**, so you create one first.

**7.1 LinkedIn Page** (skip if you admin one already)

[linkedin.com](https://www.linkedin.com) → **For Business** (grid icon) → **Create a Company Page** → **Company** → name `hyve5`, fill the required fields → tick the box → **Create page**.

**7.2 Create the app**

1. [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps) → **Create app**.
2. Name `hyve5`; **LinkedIn Page:** pick your page; **App logo:** upload `public/icon-512.png` from the project folder (the h5 + bee mark).
3. Agree to the terms → **Create app**.

**7.3 Verify the app**

**Settings** tab → **Verify** next to the page → **Generate URL** → open the URL → **Verify**. **Check:** it says **Verified**.

**7.4 Add sign-in**

**Products** tab → **Sign In with LinkedIn using OpenID Connect** → **Request access** → agree. **Check:** it's under **Added products**.

**7.5 Callback and keys**

1. **Auth** tab → **Authorized redirect URLs for your app** → pencil → **Add redirect URL** → your `SUPABASE CALLBACK URL` → **Update**.
2. Under **OAuth 2.0 scopes**, check `openid`, `profile`, `email` are listed.
3. Copy the **Client ID** and **Primary Client Secret** into your note.

**7.6 Connect to Supabase**

Supabase → **Authentication** → **Sign In / Providers** → **LinkedIn (OIDC)** (the one marked OIDC) → enable → paste ID and secret → **Save**.


**7.7 Let people connect both Google and LinkedIn (recommended)**

If someone signs in with Google one day and LinkedIn the next, Supabase joins both to one hyve5 account automatically, but **only when both use the same email**. With different emails they'd get two separate cards. To let people join them by hand from **Edit card → Sign-in accounts → Connect**:

1. Supabase → **Authentication** → **Sign In / Providers** (on some dashboards: **Authentication → Settings**).
2. Find **Allow manual linking** and switch it **on** → **Save**.

On **Edit card → Sign-in accounts**, people can also choose whether their card's name and photo come from Google or LinkedIn. Signing in again never overwrites what they chose.
---

## Step 8 — Run it on your laptop and test

*About 15 minutes.* This is the first time the code runs, so small errors may appear. Copy the exact error text and send it to me in our chat.

**8.1 Start**

```
npm run dev
```

**Check:** it prints `Local: http://localhost:3000` and `Ready`. Keep it running. After editing `.env.local`, stop it with Ctrl + C and start it again.

**8.2 Make your card**

1. Browser → `http://localhost:3000` (the first load can take 10–20 seconds).
2. **Make my card** → **Use Google instead** → your account → **Continue**.
3. Type your role and company, pick a status → **Make my card**.
4. **Check:** your card appears with your name and photo, and Supabase → **Table Editor** → `profiles` has a row for you.
5. Sign out (pencil icon → **Sign out**) and try **Continue with LinkedIn** too.

**8.3 Look around**

1. **Share my card** → a QR code appears.
2. Event tile → `Test Event` → **I'm attending** → the tile says **Attending now**.
3. Stack icon → **Ride Home** says *No swaps yet* (correct for now).
4. Bell → Notifications page.
5. Visit `http://localhost:3000/privacy` and `/terms`.

**8.4 Optional code check**

In a second terminal:

```
npx tsc --noEmit
```

No output means no problems. Send me anything it prints.

Stop the app with Ctrl + C when done.

---

## Step 9 — Put it online with Vercel

*About 20 minutes.* Vercel builds the app from your GitHub repository and gives it a public `https://` address. Phones need that address for sign-in and notifications.

**9.1 Create a Vercel account**

[vercel.com/signup](https://vercel.com/signup) → **Hobby** (free) → **Continue with GitHub** → authorise.

**9.2 Import the repository**

1. Vercel dashboard → **Add New…** → **Project**.
2. Under **Import Git Repository**, find **hyve5** → **Import**.
   If it isn't listed: click **Adjust GitHub App Permissions** (or **Configure GitHub App**) → choose **Only select repositories** → pick `hyve5` → **Save**, then return to Vercel.

**9.3 Add your settings before the first deploy**

1. On the **Configure Project** screen, leave **Framework Preset** as **Next.js** and **Root Directory** as `./`.
2. Open **Environment Variables**.
3. In VS Code, open `.env.local`, select all, copy. Click into the first **Key** box on Vercel and paste: Vercel splits it into one row per setting.
4. Remove rows with empty values (`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `RESEND_API_KEY`) if Vercel complains.
5. Click **Deploy**. It takes 1–3 minutes.

If the build fails, click into the deployment, copy the red error lines from **Build Logs**, and send them to me.

**9.4 Find your address and update the site URL**

1. When it says **Congratulations**, go to the project's dashboard. Under **Domains** you see an address like `hyve5.vercel.app` (or `hyve5-abc123.vercel.app`). Copy it into your note as `VERCEL URL`, starting with `https://` and without a slash at the end.
2. **Settings** → **Environment Variables** → `NEXT_PUBLIC_SITE_URL` → **⋯** → **Edit** → change `http://localhost:3000` to your `VERCEL URL` → **Save**.
3. **Deployments** tab → the latest deployment's **⋯** → **Redeploy** → **Redeploy**. (Settings only take effect after a redeploy.)

**9.5 Tell Supabase and Google about the address**

1. Supabase → **Authentication** → **URL Configuration**:
   - **Site URL:** your `VERCEL URL` → **Save**.
   - **Redirect URLs** → **Add URL** → `YOUR_VERCEL_URL/**` (e.g. `https://hyve5.vercel.app/**`) → **Save URLs**. Keep the localhost one.
2. Google Cloud → **Google Auth Platform** → **Clients** → **hyve5 web** → **Authorized JavaScript origins** → **Add URI** → your `VERCEL URL` → **Save**.

**9.6 Test on your phone**

Open your `VERCEL URL` on your phone, sign in (with a test-user Google account, or LinkedIn) and tap **Share my card**.

**Check:** your card loads and looks like the prototype. `YOUR_VERCEL_URL/privacy` and `/terms` also open.

---

## Step 10 — Publish Google sign-in so anyone can use it

*About 10 minutes.* Google requires a public home page, privacy policy and terms page before you can publish. The app now has all three.

1. Google Cloud → **Google Auth Platform** → **Branding**:
   - **App name:** `hyve5`; **User support email:** yours.
   - **App logo:** leave **empty**.
   - **Application home page:** `YOUR_VERCEL_URL`
   - **Application privacy policy link:** `YOUR_VERCEL_URL/privacy`
   - **Application terms of service link:** `YOUR_VERCEL_URL/terms`
   - **Authorized domains** → **Add domain** → your Vercel address without `https://` (e.g. `hyve5.vercel.app`). Then **Add domain** → `YOUR-PROJECT-REF.supabase.co`. If Google rejects the Supabase one, remove it and continue.
   - **Developer contact information:** your email → **Save**.
2. **Audience** → **Publish app** → **Confirm**.
3. **Check:** status is **In production**. Sign in on your phone with a Google account that is **not** a test user.

If Google offers **Verify branding**, you can skip it. Sign-in works without it; Google's screen just shows `…supabase.co` instead of "hyve5". Verification only changes that label (2–3 working days).

If Google still won't publish, guests can use **LinkedIn** (no review needed), and Google stays available to your test users.

---

## Step 11 — Switch on the reminder schedule

*About 10 minutes.* Every 10 minutes Supabase asks the app to send due reminders.

**11.1 Check the sender responds**

- **Mac:**
  ```
  curl -H "Authorization: Bearer YOUR_CRON_SECRET" YOUR_VERCEL_URL/api/cron/reminders
  ```
- **Windows:**
  ```
  curl.exe -H "Authorization: Bearer YOUR_CRON_SECRET" YOUR_VERCEL_URL/api/cron/reminders
  ```

**Check:** `{"checked":0,"sent":0,"skipped":0}`. `unauthorized` means the secret differs from Vercel's `CRON_SECRET`.

**11.2 Enable extensions**

Supabase → **Database** → **Extensions** → enable **pg_cron**, then **pg_net**.

**11.3 Create the schedule**

1. Open `supabase/reminders-cron.sql` in VS Code.
2. Replace `YOUR-APP-URL` with your Vercel address **without** `https://`, and `YOUR-CRON-SECRET` with your `CRON SECRET`.
3. Copy all → Supabase **SQL Editor** → **New query** → paste → **Run**.
4. **Undo the edit in VS Code** (Cmd/Ctrl + Z until the placeholders return) and save, so your secret never gets committed to GitHub.

**Check (after ~10 minutes):** run in the SQL Editor

```
select status_code, content, created from net._http_response order by created desc limit 3;
```

You should see `200`s. A `401` means the secret in the SQL is wrong: fix it and run the file again (it replaces the old schedule).

---

## Step 12 — Optional: AI-written messages and email copies

The app works fully without these: templates write the messages, and reminders come via the bell and phone notifications.

**Adding a setting to Vercel:** project → **Settings** → **Environment Variables** → enter **Key** and **Value** → **Save** → **Deployments** → latest **⋯** → **Redeploy**. Add the same line to `.env.local` too.

**12.1 AI (Anthropic)**

1. [console.anthropic.com](https://console.anthropic.com) → sign up → **Billing** → add a small prepaid credit.
2. **API Keys** → **Create Key** → copy it (starts `sk-ant-`, shown once).
3. Add it to Vercel as `ANTHROPIC_API_KEY` and redeploy.
4. **Check:** on a follow-up screen the label reads **Drafted from your note** rather than **Drafted for you**.

If not, Vercel → project → **Logs** → look for `Claude API error`. If it names the model, set `ANTHROPIC_MODEL` to a current Haiku model from [Anthropic's models page](https://docs.claude.com/en/docs/about-claude/models/overview) and redeploy.

**12.2 Email (Resend)**

1. [resend.com](https://resend.com) → sign up → **API Keys** → **Create API Key** → copy (`re_…`).
2. Add as `RESEND_API_KEY`, redeploy.
3. With the default sender, Resend only delivers to **your own** Resend sign-up address. To email everyone, verify a domain under **Domains** and set `REMINDER_FROM_EMAIL` to e.g. `hyve5 <hello@yourdomain.com>`.

---

## Step 13 — Prepare the demo

*About 30 minutes, best on the day of the event.*

**13.1 Demo stack**

1. Open `supabase/seed-demo.sql`. In `my_email text := 'you@example.com';` put the email you sign in with (keep the quotes).
2. Optional: replace `'XYZ Summit'` (twice) with your event name and `'London'` with the venue.
3. Copy → Supabase **SQL Editor** → **New query** → paste → **Run**.
4. Undo your edit in VS Code and save (keeps your email out of GitHub).
5. **Check:** the stack icon shows **6**, and Ride Home lists Priya, James, Aisha, Tom, Mei and Daniel.

The demo event lasts 4 hours from when you run it. Running it again resets the six demo people; real swaps are untouched.

**13.2 Notifications on your phone**

- **Android (Chrome):** open your `VERCEL URL` → bell → **Turn on notifications** → **Allow**.
- **iPhone:**
  1. Open your `VERCEL URL` in **Safari**.
  2. **Share** button → **Add to Home Screen** → **Add**.
  3. Open **hyve5 from the home-screen icon**.
  4. Sign in again (the home-screen app has its own sign-in).
  5. Bell → **Turn on notifications** → **Allow**.

**Check:** Ride Home → speech-bubble button on Priya → **Reminders** → **Send me one now**. A notification saying *Priya is still fresh* arrives within seconds. Tapping it opens the drafted message.

**13.3 Rehearse a real swap** (second phone with another account)

1. Your phone: **Share my card**.
2. Other phone: camera → scan → tap the link → **Swap with LinkedIn** (or Google) → one line → **Make my card**.
3. **Check:** the other phone shows **Cards swapped with [you]**; your phone gets a notification; they appear in your Ride Home.

**13.4 Real event**

On your card: event tile → **Change** → real name and end time → **I'm attending**.

**13.5 For organisers**

Event screen → **Event check-in QR (for organisers)** → screenshot or print it for tables and the door.

**On the day**

- [ ] Phone charged, plus a power bank
- [ ] Screen brightness up
- [ ] `seed-demo.sql` run that morning
- [ ] Event set on your card
- [ ] Screenshot of your QR as a backup
- [ ] One test swap at the venue

---

## Making changes later

1. Edit files in VS Code and test with `npm run dev`.
2. GitHub Desktop → **Changes** tab: check the list (no `.env.local`) → type a **Summary** → **Commit to main** → **Push origin**.
3. Vercel deploys automatically within a couple of minutes (watch the **Deployments** tab).

If I send you updated files, replace them in your project folder and follow the same three steps.

---

## Renaming an existing setup to hyve5

*About 30 minutes.* Only needed if you set things up while the app was still called **NetworkPulse**. The code already says hyve5 everywhere; this section changes the name in every other place. Do the parts in order.

**What changes, and what doesn't**

| Place | Needs changing? |
| --- | --- |
| The code (screens, titles, notifications, emails, legal pages, home-screen app name) | Yes: part 1 |
| GitHub repository name | Optional, recommended: part 2 |
| Vercel project name and web address | Optional, recommended: part 3 |
| Supabase URL settings, Google client and branding, reminder schedule | Only if the web address changes: parts 4–6 |
| LinkedIn app name | Yes: part 7 |
| Google consent screen name, Supabase project name | Cosmetic: part 7 |
| Your phone's home-screen icon | Yes, re-add it: part 8 |
| Supabase keys, VAPID keys, `CRON_SECRET`, database data | **No.** Everything keeps working. |

**Part 1 — Put the renamed code into your project**

1. Download the latest **hyve5.zip** and unzip it. You get a folder called `hyve5`.
2. Open that new `hyve5` folder. Select **everything inside it** (Cmd + A / Ctrl + A) and copy it.
3. Open your existing project folder (`Documents/networkpulse`) and paste. When asked, choose **Replace** (Mac) or **Replace the files in the destination** (Windows).
   Don't replace the project folder itself. It holds your hidden `.git` folder (your GitHub history), `node_modules` and `.env.local`, which must stay.
4. In VS Code, check that `app/layout.tsx` contains `title: 'hyve5'`.
5. Test it: `npm run dev` → `http://localhost:3000`. The top-left of each screen should say **hyve5**.
6. GitHub Desktop → **Changes** → Summary `Rename to hyve5` → **Commit to main** → **Push origin**. Vercel redeploys automatically.

**Part 2 — Rename the GitHub repository (optional)**

1. On github.com, open your repository → **Settings** (top tab) → **General** → **Repository name**: `hyve5` → **Rename**.
2. GitHub redirects the old address automatically, and Vercel's connection keeps working.
3. GitHub Desktop: **Repository** → **Repository Settings…** → **Remote**. If it still shows the old name, change `networkpulse` to `hyve5` in the address → **Save**.
4. Your folder on your laptop can stay called `networkpulse`; the name of the folder doesn't matter.

**Part 3 — Rename the Vercel project and web address (optional)**

Changing the web address means existing QR codes and links break. Do this before you print anything for the event.

1. Vercel → your project → **Settings** → **General** → **Project Name**: `hyve5` → **Save**.
2. **Settings** → **Domains** → **Add Domain** → type `hyve5.vercel.app` → **Add**. If it's taken, try `hyve5-app.vercel.app` or `gethyve5.vercel.app`.
3. Keep the old address listed, so old links still work. Optionally use its **Edit** button to redirect it to the new address.
4. **Settings** → **Environment Variables** → `NEXT_PUBLIC_SITE_URL` → change it to the new address (e.g. `https://hyve5.vercel.app`). If Vercel won't let you edit it (Sensitive), remove it and add it again with **Sensitive** off.
5. **Deployments** → latest **⋯** → **Redeploy**.
6. Update `VERCEL URL` in your keys note.

If you skip Part 3, skip Parts 4–6 too.

**Part 4 — Supabase (only if the address changed)**

**Authentication** → **URL Configuration**:
1. **Site URL** → the new address → **Save**.
2. **Redirect URLs** → **Add URL** → `NEW_ADDRESS/**` → **Save URLs**. Keep the old one until you've tested the new one, then remove it.

**Part 5 — Google (only if the address changed)**

1. **Google Auth Platform** → **Clients** → your web client → **Authorized JavaScript origins** → **Add URI** → the new address → **Save**.
2. **Branding**: update **Application home page**, **privacy policy link** (`/privacy`) and **terms link** (`/terms`) to the new address. Under **Authorized domains**, add the new host (e.g. `hyve5.vercel.app`) → **Save**.

**Part 6 — Reminder schedule (only if the address changed, or if you ran it before)**

1. Open `supabase/reminders-cron.sql`. Put in the **new** address (without `https://`) and your `CRON SECRET`.
2. Supabase **SQL Editor** → **New query** → paste → **Run**. It removes the old NetworkPulse schedule and creates one called `hyve5-reminders`.
3. Undo your edit in VS Code and save, so the secret doesn't get committed.

**Part 7 — Names shown on sign-in screens**

1. **LinkedIn:** [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps) → your app → **Settings** → **Edit** → **App name** `hyve5` (and the hyve5 Page if it isn't already linked) → **Save**.
2. **Google:** **Google Auth Platform** → **Branding** → **App name** `hyve5` → **Save**. (Without brand verification, Google's screen keeps showing the `…supabase.co` address anyway.)
3. **Supabase (cosmetic):** **Project Settings** → **General** → **Project name** `hyve5` → **Save**. Nothing else changes; your keys and URL stay the same.
4. **Google Cloud project name (cosmetic):** project picker → **⋮** next to the project → **Settings** → **Project name** `hyve5` → **Save**. The project ID can't change, and doesn't need to.
5. **Resend (only if you use it):** if `REMINDER_FROM_EMAIL` is set in Vercel, change it to `hyve5 <onboarding@resend.dev>` (or your domain) and redeploy.

**Part 8 — Phones**

Phones remember the old name and icon for a site added to the home screen.

1. Delete the old **NetworkPulse** icon from your home screen (the new icon is the h5 + bee logo).
2. Open the (new) address in Safari or Chrome → **Add to Home Screen** again → open it → sign in → bell → **Turn on notifications**.

**Check:**
- Every screen, page tab and notification says **hyve5**.
- Sign-in works with Google and LinkedIn on the new address.
- **Send me one now** on a follow-up screen delivers a notification titled with the contact's name.
- The `curl` check in Step 11.1 works on the new address.

---

## Troubleshooting

For anything not listed, copy the exact error (terminal, browser page, or Vercel → **Logs** / **Build Logs**) and send it to me.

| What you see | Likely cause | Fix |
| --- | --- | --- |
| `command not found: node` / `npm` | Node missing, or old terminal | Step 1.2, then reopen the terminal |
| Red `npm error` during install | Network hiccup or old Node | `node -v` ≥ 20, run `npm install` again |
| `Invalid API key` / `supabaseUrl is required` | Wrong or missing Supabase values | Re-copy from Step 3.3; restart `npm run dev`, or redeploy on Vercel |
| Google `Error 400: redirect_uri_mismatch` | Redirect URI doesn't match | Step 5.4: exactly your `SUPABASE CALLBACK URL` |
| Google `Access blocked` / not a test user | App still in Testing | Add the account (5.5), or publish (Step 10) |
| Google won't publish: wants branding info | Links missing | Step 10, logo left empty |
| Phone lands on `localhost` after sign-in | Supabase Site URL still localhost | Step 9.5 |
| `/login?error=...` after sign-in | Provider off or wrong secret | Re-paste in Supabase (5.6 / 7.6) and **Save** |
| LinkedIn `redirect_uri does not match` | Callback missing | Step 7.5 |
| Signing in with LinkedIn shows a different/new card than Google | The two accounts use different emails | Edit card → Sign-in accounts → **Connect**; needs Step 7.7 |
| "Connect" says linking is switched off | Manual linking not enabled | Step 7.7 |
| Can't add a bookable time | It's in the past | Pick a future date and time; past times are blocked |
| GitHub Desktop shows `.env.local` | `.gitignore` missing | Don't publish; tell me |
| Vercel can't see the repository | App lacks access to it | Step 9.2 permissions |
| Vercel build fails | Code error at build time | Send me the red Build Logs lines |
| Changed a Vercel setting, no effect | Not redeployed | Deployments → ⋯ → **Redeploy** |
| No **Turn on notifications** on iPhone | Opened in Safari, not home screen | Step 13.2 |
| Notifications never arrive | VAPID keys missing in Vercel, or blocked on phone | Check both VAPID settings; allow notifications in phone Settings |
| `curl` says `unauthorized` | `CRON_SECRET` mismatch | Re-copy; redeploy after editing Vercel |
| `net._http_response` shows 401 | Wrong secret in cron SQL | Step 11.3 again |
| `No user with email` when seeding | Not signed in with that email yet | Sign in once, run again |
| Ride Home empty after seeding | Email in seed file doesn't match | Use your exact sign-in email |

---

## Project reference

**Pages and endpoints**

| Path | What it is |
| --- | --- |
| `/` | Landing page |
| `/login` | LinkedIn / Google sign-in |
| `/onboarding` | One line + status → headline → card |
| `/me` | Your card, QR share, bell, Ride Home badge |
| `/me/edit` | Edit card, links, bookable times, sign out |
| `/events/new` | Set the event you're attending |
| `/e/[slug]` | Event check-in page (+ printable QR for the host) |
| `/c/[slug]` | Public card: swap button, booking |
| `/c/[slug]/swap` | Performs the swap (bounces through login/onboarding) |
| `/ride-home` | Swipe stack + follow-up list |
| `/connect/[swapId]` | Draft, send, progress, reminders |
| `/notifications` | Reminders, new swaps, bookings; turn on push |
| `/privacy`, `/terms` | Privacy policy and terms of service |
| `/api/draft` | Rewrites a message in another tone |
| `/api/push` | Saves / removes a device's push subscription |
| `/api/cron/reminders` | Sends due reminders (protected by `CRON_SECRET`) |

**Folders**

| Folder | Contents |
| --- | --- |
| `app/` | Pages and server actions (Next.js App Router) |
| `components/` | Bento card, booking tile, bell, notification prompt, icons |
| `lib/` | Supabase clients, AI drafts, matching, notifications, email |
| `public/` | Service worker (`sw.js`), app icons, and the full logo `hyve5-logo.png` (use it for LinkedIn and social profiles) |
| `supabase/` | `schema.sql`, `seed-demo.sql`, `reminders-cron.sql`, `002-notifications.sql` |

**Settings (environment variables)**

| Name | Required | What it is |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://YOUR-PROJECT-REF.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase publishable (or anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase secret (or service_role) key; server only |
| `NEXT_PUBLIC_SITE_URL` | Yes | Your public address, no trailing slash |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Yes | From `npm run vapid` |
| `VAPID_PRIVATE_KEY` | Yes | From `npm run vapid` |
| `VAPID_SUBJECT` | Yes | `mailto:` + your email (also the contact on legal pages) |
| `CRON_SECRET` | Yes | Random string protecting the reminder sender |
| `ANTHROPIC_API_KEY` | No | AI headlines and drafts |
| `ANTHROPIC_MODEL` | No | Override the AI model name |
| `RESEND_API_KEY` | No | Email copies of reminders and bookings |
| `REMINDER_FROM_EMAIL` | No | Sender for those emails |
| `NEXT_PUBLIC_APP_TZ` | No | Time zone for displayed times (default `Europe/London`) |

**Known limits**

- The code was written without a test build; `next.config.mjs` skips type errors during build so a small one can't block a deploy. `npx tsc --noEmit` lists any.
- LinkedIn doesn't let apps send connection requests, so *Copy and open LinkedIn* copies your message and opens their profile (or a LinkedIn search).
- iPhone users must add the site to their home screen before push works (an Apple rule). Everyone gets the in-app bell.
- Match ordering is a transparent heuristic (status fit, shared topics, whether you wrote a note), not AI.
- The privacy policy and terms are a basic template for a demo; have them reviewed before a real launch.
