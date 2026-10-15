import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { safeNext } from '@/lib/util';
import { LoginButtons } from './LoginButtons';
import { BrandMark } from '@/components/BrandMark';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const { user, profile } = await getSession();
  if (user && profile?.onboarded) redirect(next);
  if (user) redirect(`/onboarding?next=${encodeURIComponent(next)}`);

  const swapping = next.includes('/swap');
  const joining = next.includes('/checkin');

  return (
    <main className="shell">
      <div className="topbar">
        <span className="brand"><BrandMark /></span>
      </div>
      <div className="bottom">
        <section className="glass sheet rise">
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {swapping ? 'One tap to swap cards' : joining ? 'Set up your card for the event' : 'Your card, in 15 seconds'}
            </h1>
            <p className="muted" style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.45 }}>
              We bring in your name and photo. You add one line about what you do, and we build the rest.
            </p>
          </div>
          <LoginButtons next={next} />
          {sp.error && <p className="error" style={{ margin: 0 }}>Sign-in didn't work: {sp.error}</p>}
          <p className="hint" style={{ margin: 0, textAlign: 'center' }}>
            No app to install. We never post on your behalf. <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
