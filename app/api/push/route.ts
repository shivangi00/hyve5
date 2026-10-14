import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type Sub = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

// Save this device's push subscription for the signed-in person.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not signed in' }, { status: 401 });

  const sub = (await request.json().catch(() => ({}))) as Sub;
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: 'bad subscription' }, { status: 400 });
  }

  // Service role, because a shared device may have been subscribed by someone else before.
  const admin = createAdminClient();
  const { error } = await admin
    .from('push_subscriptions')
    .upsert({ user_id: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth }, { onConflict: 'endpoint' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Remove this device (when someone turns reminders off).
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not signed in' }, { status: 401 });
  const { endpoint } = (await request.json().catch(() => ({}))) as { endpoint?: string };
  if (endpoint) await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
