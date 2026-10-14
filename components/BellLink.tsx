import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Bell } from './Icons';

/** Bell with unread count. Server component: drop it into any top bar. */
export async function BellLink({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  const n = count ?? 0;
  return (
    <Link href="/notifications" className="icon-btn" aria-label={n ? `Notifications, ${n} unread` : 'Notifications'}>
      <Bell size={19} />
      {n > 0 && <span className="badge">{n > 9 ? '9+' : n}</span>}
    </Link>
  );
}
