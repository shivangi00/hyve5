import type { Profile } from './types';
import { firstName } from './util';

// Simple, explainable ordering for the Ride Home stack: no black box, just the
// signals people actually use when deciding who to follow up with first.
export function scoreMatch(me: Profile, them: Profile, note: string | null) {
  const mine = new Set(me.topics.map((t) => t.toLowerCase()));
  const shared = them.topics.filter((t) => mine.has(t.toLowerCase()));
  const name = firstName(them.full_name);
  let score = 0;
  const reasons: string[] = [];

  if (them.status === 'hiring' && me.status === 'open') {
    score += 30;
    reasons.push(`${name} is hiring, and you're open to work.`);
  }
  if (me.status === 'hiring' && them.status === 'open') {
    score += 30;
    reasons.push(`${name} is open to work, and you're hiring.`);
  }
  if (shared.length) {
    score += 15 * shared.length;
    reasons.push(`You both care about ${shared.slice(0, 2).join(' and ')}.`);
  }
  if (me.status === 'collab' && them.status === 'collab') {
    score += 10;
    reasons.push(`You're both open to collaborations.`);
  }
  if (note && note.trim().length > 0) {
    score += 12 + Math.min(10, Math.floor(note.length / 20));
    if (!reasons.length) reasons.push('You wrote a note, so there was a real conversation.');
  }
  if (them.status === 'hiring' && !reasons.length) {
    score += 8;
    reasons.push(`${name} is hiring.`);
  }
  return {
    score,
    why: reasons[0] ?? 'No strong signals yet. Add a note to remember why you talked.',
    strong: score >= 25,
  };
}
