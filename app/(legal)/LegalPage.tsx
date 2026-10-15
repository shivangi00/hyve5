import Link from 'next/link';
import { Back } from '@/components/Icons';

export function contactEmail() {
  return (process.env.VAPID_SUBJECT || '').replace(/^mailto:/, '') || 'the email on the hyve5 home page';
}

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="shell" style={{ gap: 12 }}>
      <div className="topbar">
        <Link href="/" className="icon-btn" aria-label="Back to home"><Back /></Link>
        <span className="topbar-title">{title}</span>
        <span style={{ width: 44 }} />
      </div>
      <article className="glass sheet legal" style={{ borderRadius: 28, fontSize: 14.5, lineHeight: 1.55 }}>
        <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>Last updated {updated}</p>
        {children}
      </article>
    </main>
  );
}
