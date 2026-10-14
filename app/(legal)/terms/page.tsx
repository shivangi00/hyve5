import type { Metadata } from 'next';
import { LegalPage, contactEmail } from '../LegalPage';

export const metadata: Metadata = { title: 'Terms of service · NetworkPulse' };

export default function TermsPage() {
  const email = contactEmail();
  return (
    <LegalPage title="Terms of service" updated="14 October 2026">
      <p>By using NetworkPulse you agree to these terms. NetworkPulse is an early preview, offered free of charge.</p>

      <h2>Your card and content</h2>
      <ul>
        <li>Your card is public to anyone with its link or QR code. Only put on it what you're happy to share.</li>
        <li>Keep what you write accurate, and don't impersonate anyone.</li>
        <li>Don't use the app to spam, harass or collect people's details for anything other than following up with them.</li>
      </ul>

      <h2>The service</h2>
      <ul>
        <li>NetworkPulse is provided as it is, while it is being developed. Features may change, and it may sometimes be unavailable.</li>
        <li>Reminders and notifications are best effort; please don't rely on them for anything critical.</li>
        <li>We may suspend accounts that break these terms.</li>
      </ul>

      <h2>Your data</h2>
      <p>
        How we handle your data is described in our <a href="/privacy">privacy policy</a>. You can ask us to delete your account at any time.
      </p>

      <h2>Contact</h2>
      <p><a href={`mailto:${email}`}>{email}</a></p>
    </LegalPage>
  );
}
