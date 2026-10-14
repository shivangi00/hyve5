import { initials } from '@/lib/util';

export function Avatar({ name, url, size = 74 }: { name: string; url?: string | null; size?: number }) {
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.32), fontSize: Math.round(size * 0.34) }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" referrerPolicy="no-referrer" />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </div>
  );
}
