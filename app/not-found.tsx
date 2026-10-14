import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="shell">
      <div className="bottom">
        <section className="glass sheet">
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Card not found</h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>The link may be mistyped, or the card was removed.</p>
          <Link href="/" className="btn btn-primary btn-block">Make your own card</Link>
        </section>
      </div>
    </main>
  );
}
