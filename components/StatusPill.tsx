import { STATUS } from '@/lib/util';
import type { Status } from '@/lib/types';

export function StatusPill({ status }: { status: Status }) {
  const s = STATUS[status] ?? STATUS.collab;
  return (
    <span className="pill">
      <span className="dot" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}
