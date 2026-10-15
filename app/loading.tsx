/** Shown instantly while any page loads, so every tap gets an immediate response. */
export default function Loading() {
  return (
    <main className="shell" aria-busy="true">
      <div className="page-loading" role="status">
        <span className="spinner lg" aria-hidden="true" />
        <span>Loading…</span>
      </div>
    </main>
  );
}
