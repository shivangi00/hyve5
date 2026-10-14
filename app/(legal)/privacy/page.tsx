import type { Metadata } from 'next';
import { LegalPage, contactEmail } from '../LegalPage';

export const metadata: Metadata = { title: 'Privacy policy · NetworkPulse' };

export default function PrivacyPage() {
  const email = contactEmail();
  return (
    <LegalPage title="Privacy policy" updated="14 October 2026">
      <p>
        NetworkPulse lets you swap digital business cards at events and follow up afterwards. This page explains what we collect, why, and how to have it deleted.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><b>From Google or LinkedIn when you sign in:</b> your name, email address and profile photo. We do not get your password, contacts, posts or any other account data.</li>
        <li><b>What you type:</b> your role and company, status, topics, links and bookable times. These form your public card.</li>
        <li><b>Activity in the app:</b> who you swapped cards with, at which event, your private notes about them, your follow-up progress, and bookings.</li>
        <li><b>Notifications:</b> if you turn on phone notifications, a technical address for your device that lets us send them.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To show your card to people you share it with.</li>
        <li>To save swaps to both people's follow-up lists and send follow-up reminders.</li>
        <li>To let people book a call with you, and to tell you when they do.</li>
        <li>Optionally, to draft follow-up messages with an AI service (Anthropic). Only your name, the other person's name and role, the event name and your note are sent, and only when you open a follow-up.</li>
      </ul>
      <p>We do not sell your data, show ads, or post anything on your behalf.</p>

      <h2>Who can see what</h2>
      <ul>
        <li><b>Public:</b> your card (name, photo, role, status, topics, links, open times).</li>
        <li><b>Only people you've swapped with:</b> your email address.</li>
        <li><b>Only you:</b> your notes, your follow-up list and your reminders.</li>
      </ul>

      <h2>Where it's stored</h2>
      <p>
        Data is stored with Supabase (database and sign-in) and the app is hosted on Vercel. Optional reminder emails are sent through Resend. These providers process data on our behalf.
      </p>

      <h2>Use of Google user data</h2>
      <p>
        We use only your basic Google profile (name, email, photo) to create your account and card. NetworkPulse's use of information received from Google APIs adheres to the{' '}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.
      </p>

      <h2>Deleting your data</h2>
      <p>
        Email <a href={`mailto:${email}`}>{email}</a> from the address you signed in with and we'll delete your account, card, swaps and notes within 30 days. You can turn off notifications at any time in your phone or browser settings.
      </p>

      <h2>Contact</h2>
      <p>Questions about this policy: <a href={`mailto:${email}`}>{email}</a>.</p>
    </LegalPage>
  );
}
