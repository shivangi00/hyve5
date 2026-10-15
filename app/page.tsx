import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { BrandMark } from '@/components/BrandMark';

export default async function Home({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const sp = await searchParams;
  const { user, profile } = await getSession();
  if (user && profile?.onboarded) redirect('/me');
  if (user) redirect('/onboarding');

  return (
    <main className="shell">
      <div className="topbar">
        <span className="brand"><BrandMark tagline /></span>
      </div>

      <section className="glass build-grid rise" aria-hidden="true" style={{ marginTop: 24 }}>
        <div style={{ gridColumn: 'span 3', animationDelay: '.1s' }} />
        <div style={{ gridColumn: 'span 2', animationDelay: '.35s' }} />
        <div style={{ animationDelay: '.55s' }} />
        <div style={{ animationDelay: '.75s' }} />
        <div style={{ gridColumn: 'span 2', animationDelay: '.95s' }} />
      </section>

      <div className="bottom">
        {sp.deleted && (
          <p className="hint" role="status" style={{ margin: 0, textAlign: 'center', color: '#9FF0BC' }}>
            Your account has been deleted.
          </p>
        )}
        <section className="glass sheet">
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.12 }}>
            Swap. Select. Connect.
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.45 }}>
            A bento card anyone can scan without an app, a stack to sort on the ride home, and reminders that make sure the follow-up actually happens.
          </p>
          <Link href="/login" className="btn btn-primary btn-block">Make my card</Link>
        </section>
        <nav className="footer-links" aria-label="Legal">
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/terms">Terms of service</Link>
        </nav>
      </div>
    </main>
  );
}
