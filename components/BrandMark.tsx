/** hyve5 logo mark: "h5" with a small bee, as in the brand logo. */
export function BrandMark({ tagline = false }: { tagline?: boolean }) {
  return (
    <span className="brand-logo" role="img" aria-label="hyve5">
      <span className="brand-h5" aria-hidden="true">
        h5<span className="brand-bee">🐝</span>
      </span>
      {tagline && (
        <span className="brand-tagline" aria-hidden="true">
          grow your <em>hyve</em>
        </span>
      )}
    </span>
  );
}
