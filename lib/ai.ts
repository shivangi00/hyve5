import type { Status, Tone } from './types';
import { firstName } from './util';

// Calls Claude when ANTHROPIC_API_KEY is set; every caller has a template fallback,
// so the app works fine without a key (and never hangs on a slow response).
async function ask(prompt: string, maxTokens = 400): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('Claude API error', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const text = (data?.content ?? [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('')
      .trim();
    return text || null;
  } catch (e) {
    console.error('Claude API call failed', e);
    return null;
  }
}

const STATUS_WORDS: Record<Status, string> = {
  open: 'open to new roles',
  hiring: 'hiring',
  collab: 'open to collaborations',
};

/** One-line card headline + up to 3 "ask me about" topics. */
export async function generateCard(input: { name: string; roleLine: string; status: Status; topics: string[] }) {
  const fallback = {
    headline: input.roleLine,
    topics: input.topics.slice(0, 4),
  };
  const out = await ask(
    `You write the one-line headline for a digital networking card shown at an in-person event.
Person: ${input.name}
Role line they typed: ${input.roleLine}
They are currently: ${STATUS_WORDS[input.status]}
Topics they gave (may be empty): ${input.topics.join(', ') || '(none)'}

Return ONLY JSON: {"headline": string, "topics": string[]}
- headline: max 90 characters, first person without "I am", plain and specific, no buzzwords, no emoji, no hashtags. Mention what they do; mention the status only if it is natural.
- topics: if they gave topics, tidy them (max 4, each 1-3 words). If none, suggest 3 short conversation topics that fit the role.`,
    200
  );
  if (!out) return fallback;
  try {
    const json = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1));
    const headline = typeof json.headline === 'string' && json.headline.trim() ? json.headline.trim().slice(0, 120) : fallback.headline;
    const topics = Array.isArray(json.topics)
      ? json.topics.filter((t: unknown) => typeof t === 'string' && t.trim()).map((t: string) => t.trim().slice(0, 28)).slice(0, 4)
      : fallback.topics;
    return { headline, topics: topics.length ? topics : fallback.topics };
  } catch {
    return fallback;
  }
}

type DraftInput = {
  myName: string;
  contactName: string;
  contactRole: string | null;
  eventName: string | null;
  note: string | null;
  tone: Tone;
  myTopics: string[];
};

function templateDraft(d: DraftInput) {
  const them = firstName(d.contactName);
  const me = firstName(d.myName);
  const where = d.eventName ? ` at ${d.eventName}` : '';
  const about = d.note
    ? d.note.replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase())
    : d.contactRole
      ? `your work as ${d.contactRole.replace(/^./, (c) => c.toLowerCase())}`
      : 'what you are working on';
  switch (d.tone) {
    case 'short':
      return `Hi ${them}, ${me} here${d.eventName ? ` from ${d.eventName}` : ''}. Really enjoyed our chat. Fancy 15 minutes this week to carry on?`;
    case 'direct':
      return `Hi ${them}, following up from our chat${where}. I'd like to continue the conversation about ${about}. Are you free for a 15-minute call this week?`;
    default:
      return `Hi ${them}, it was great meeting you${where}. I enjoyed hearing about ${about}, and I'd love to keep the conversation going. Could we do a quick 15-minute call this week?`;
  }
}

const TONE_GUIDE: Record<Tone, string> = {
  warm: 'Warm and friendly, 2-3 sentences.',
  short: 'Very short and casual, 1-2 sentences, under 220 characters.',
  direct: 'Direct and purposeful, 2 sentences, says clearly why a call is useful.',
};

export async function draftMessage(d: DraftInput): Promise<{ text: string; ai: boolean }> {
  const out = await ask(
    `Write a follow-up message from ${d.myName} to ${d.contactName}, who they met in person${d.eventName ? ` at ${d.eventName}` : ''} a few hours ago.
${d.contactName}'s role: ${d.contactRole || 'unknown'}
${d.myName}'s private note about the conversation: ${d.note || '(no note)'}
${d.myName}'s interests: ${d.myTopics.join(', ') || '(none given)'}

Tone: ${TONE_GUIDE[d.tone]}
Goal: get a 15-minute call booked within the week.
Rules: start with "Hi ${firstName(d.contactName)},". Refer to something specific from the note if there is one, but never quote the note or reveal it was a note. No emoji, no sign-off, no placeholders, no subject line. British English.
Return only the message text.`,
    300
  );
  if (out) return { text: out.replace(/^"|"$/g, ''), ai: true };
  return { text: templateDraft(d), ai: false };
}
