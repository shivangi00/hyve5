import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { siteUrl } from '@/lib/util';
import type { Profile } from '@/lib/types';

// "Save contact" on a card you've swapped with: downloads a .vcf that phones open straight into Contacts.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, user } = await getSession();
  if (!user) return NextResponse.redirect(`${siteUrl()}/login?next=${encodeURIComponent(`/c/${slug}`)}`);

  const { data } = await supabase.from('profiles').select('*').eq('slug', slug).maybeSingle();
  const p = data as Profile | null;
  if (!p) return new NextResponse('Not found', { status: 404 });

  // Readable only if you've swapped with them (database rules), so strangers never get the email.
  const { data: priv } = await supabase.from('profile_private').select('email').eq('id', p.id).maybeSingle();
  const email = (priv as { email: string | null } | null)?.email ?? null;

  const esc = (v: string) => v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (m) => `\\${m}`);
  const parts = p.full_name.trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop()! : '';
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${esc(p.full_name)}`,
    `N:${esc(last)};${esc(parts.join(' '))};;;`,
    p.role_line ? `TITLE:${esc(p.role_line)}` : null,
    email ? `EMAIL;TYPE=INTERNET:${email}` : null,
    p.linkedin_url ? `URL;TYPE=LinkedIn:${p.linkedin_url}` : null,
    p.website_url ? `URL:${p.website_url}` : null,
    `URL;TYPE=hyve5:${siteUrl()}/c/${p.slug}`,
    p.headline ? `NOTE:${esc(p.headline)}` : null,
    'END:VCARD',
  ].filter(Boolean);

  const file = `${p.full_name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'contact'}.vcf`;
  return new NextResponse(lines.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
