// Sends email through Resend's HTTP API. Returns false (and logs) when not configured.
export async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: 'RESEND_API_KEY is not set' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.REMINDER_FROM_EMAIL || 'hyve5 <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const error = await res.text();
      console.error('Resend error', res.status, error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (e) {
    console.error('Resend call failed', e);
    return { ok: false, error: String(e) };
  }
}

export function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function reminderEmail(opts: { kind: string; contactName: string; eventName: string | null; link: string }) {
  const name = esc(opts.contactName);
  const where = opts.eventName ? ` at ${esc(opts.eventName)}` : '';
  const copy: Record<string, { subject: string; line: string; cta: string }> = {
    message_3h: {
      subject: `${opts.contactName} is still fresh — your message is drafted`,
      line: `You met ${name}${where} a few hours ago. Your follow-up message is ready to send in one tap.`,
      cta: 'Send my message',
    },
    followup_d3: {
      subject: `No call booked with ${opts.contactName} yet`,
      line: `It's been a few days since you met ${name}${where}. A short nudge with your booking link usually does it.`,
      cta: 'Send a nudge',
    },
    lastcall_d7: {
      subject: `Last day to book a call with ${opts.contactName}`,
      line: `A week since you met ${name}${where}. Book the call today, or archive them so they stop showing up.`,
      cta: 'Follow up now',
    },
  };
  const c = copy[opts.kind] ?? copy.message_3h!;
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#121214;padding:32px 16px;">
    <div style="max-width:440px;margin:0 auto;background:#141416;border:1px solid #2d2d32;border-radius:28px;padding:28px;color:#F3F1EA;">
      <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#b8b6ae;margin-bottom:14px;">hyve5</div>
      <div style="font-size:20px;font-weight:600;line-height:1.3;margin-bottom:10px;">${esc(c.subject)}</div>
      <div style="font-size:15px;line-height:1.55;color:#e6e4dc;margin-bottom:22px;">${c.line}</div>
      <a href="${opts.link}" style="display:inline-block;background:#F3F1EA;color:#121214;text-decoration:none;font-weight:600;padding:14px 22px;border-radius:999px;">${c.cta}</a>
    </div>
  </div>`;
  return { subject: c.subject, html };
}
