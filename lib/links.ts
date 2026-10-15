/**
 * Recognises a link and names it. The circle shows the site's own icon (favicon);
 * the short lettering here is only the fallback when that icon can't load.
 */
export type LinkKind = {
  id: string;
  name: string;
  /** 1–3 characters shown in the circle. Empty means "use the globe icon". */
  mark: string;
};

const KINDS: { match: RegExp; kind: LinkKind }[] = [
  { match: /(^|\.)linkedin\.com$/, kind: { id: 'linkedin', name: 'LinkedIn', mark: 'in' } },
  { match: /(^|\.)(x|twitter)\.com$/, kind: { id: 'x', name: 'X', mark: 'X' } },
  { match: /(^|\.)github\.com$/, kind: { id: 'github', name: 'GitHub', mark: 'gh' } },
  { match: /(^|\.)gitlab\.com$/, kind: { id: 'gitlab', name: 'GitLab', mark: 'gl' } },
  { match: /(^|\.)behance\.net$/, kind: { id: 'behance', name: 'Behance', mark: 'Bē' } },
  { match: /(^|\.)dribbble\.com$/, kind: { id: 'dribbble', name: 'Dribbble', mark: 'dr' } },
  { match: /(^|\.)substack\.com$/, kind: { id: 'substack', name: 'Substack', mark: 'ss' } },
  { match: /(^|\.)medium\.com$/, kind: { id: 'medium', name: 'Medium', mark: 'M' } },
  { match: /(^|\.)instagram\.com$/, kind: { id: 'instagram', name: 'Instagram', mark: 'ig' } },
  { match: /(^|\.)threads\.(net|com)$/, kind: { id: 'threads', name: 'Threads', mark: '@' } },
  { match: /(^|\.)(youtube\.com|youtu\.be)$/, kind: { id: 'youtube', name: 'YouTube', mark: 'yt' } },
  { match: /(^|\.)tiktok\.com$/, kind: { id: 'tiktok', name: 'TikTok', mark: 'tt' } },
  { match: /(^|\.)figma\.com$/, kind: { id: 'figma', name: 'Figma', mark: 'fg' } },
  { match: /(^|\.)(notion\.so|notion\.site)$/, kind: { id: 'notion', name: 'Notion', mark: 'N' } },
  { match: /(^|\.)calendly\.com$/, kind: { id: 'calendly', name: 'Calendly', mark: 'cal' } },
  { match: /(^|\.)cal\.com$/, kind: { id: 'calcom', name: 'Cal.com', mark: 'cal' } },
  { match: /(^|\.)bsky\.app$/, kind: { id: 'bluesky', name: 'Bluesky', mark: 'bs' } },
  { match: /(^|\.)(facebook\.com|fb\.com)$/, kind: { id: 'facebook', name: 'Facebook', mark: 'fb' } },
  { match: /(^|\.)spotify\.com$/, kind: { id: 'spotify', name: 'Spotify', mark: 'sp' } },
  { match: /(^|\.)(linktr\.ee)$/, kind: { id: 'linktree', name: 'Linktree', mark: 'lt' } },
  { match: /(^|\.)producthunt\.com$/, kind: { id: 'producthunt', name: 'Product Hunt', mark: 'ph' } },
  { match: /(^|\.)kaggle\.com$/, kind: { id: 'kaggle', name: 'Kaggle', mark: 'k' } },
  { match: /(^|\.)stackoverflow\.com$/, kind: { id: 'stackoverflow', name: 'Stack Overflow', mark: 'so' } },
  { match: /(^|\.)(wa\.me|whatsapp\.com)$/, kind: { id: 'whatsapp', name: 'WhatsApp', mark: 'wa' } },
  { match: /(^|\.)(t\.me|telegram\.me)$/, kind: { id: 'telegram', name: 'Telegram', mark: 'tg' } },
  { match: /(^|\.)(discord\.gg|discord\.com)$/, kind: { id: 'discord', name: 'Discord', mark: 'dc' } },
  { match: /(^|\.)(vimeo\.com)$/, kind: { id: 'vimeo', name: 'Vimeo', mark: 'v' } },
  { match: /(^|\.)(peerlist\.io)$/, kind: { id: 'peerlist', name: 'Peerlist', mark: 'pl' } },
  { match: /(^|\.)(read\.cv)$/, kind: { id: 'readcv', name: 'Read.cv', mark: 'cv' } },
];

export const HYVE5: LinkKind = { id: 'hyve5', name: 'hyve5', mark: '' };

/** This app's own address (e.g. your Vercel URL), so hyve5 card links get the hyve5 icon. */
function isHyve5Host(host: string) {
  if (host.includes('hyve5')) return true;
  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    return !!site && new URL(site).hostname.replace(/^www\./, '') === host;
  } catch {
    return false;
  }
}

export const WEBSITE: LinkKind = { id: 'website', name: 'Website', mark: '' };
export const EMAIL: LinkKind = { id: 'email', name: 'Email', mark: '' };

/** Adds https:// when missing and checks it's a real web address. Returns null if it isn't. */
export function cleanUrl(input: string | null | undefined): string | null {
  const raw = (input ?? '').trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (!u.hostname.includes('.')) return null;
    return u.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function detectLink(url: string | null | undefined): LinkKind {
  const clean = cleanUrl(url);
  if (!clean) return WEBSITE;
  const host = new URL(clean).hostname.toLowerCase().replace(/^www\./, '');
  if (isHyve5Host(host)) return HYVE5;
  return KINDS.find((k) => k.match.test(host))?.kind ?? WEBSITE;
}

/** The site's own icon, for links we don't have a mark for (e.g. a personal portfolio domain). */
export function faviconUrl(url: string | null | undefined): string | null {
  const clean = cleanUrl(url);
  if (!clean) return null;
  const host = new URL(clean).hostname.replace(/^www\./, '');
  return `https://icons.duckduckgo.com/ip3/${host}.ico`;
}

/** "https://www.github.com/jane/" → "github.com/jane" */
export function prettyUrl(url: string) {
  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
}

export type CardLink = {
  /** Stable key; also tells the server which field to clear when removed. */
  key: string;
  kind: LinkKind;
  href: string | null;
  display: string;
};

/**
 * Everything for the link circle, linked first. Default accounts (LinkedIn, X, website, email)
 * that aren't set come last with href = null, so they show greyed out at the bottom.
 */
export function cardLinks(p: { linkedin_url: string | null; x_url: string | null; website_url: string | null; links?: string[] | null }, email: string | null) {
  const linked: CardLink[] = [];
  const empty: CardLink[] = [];
  const add = (key: string, kind: LinkKind, url: string | null) => {
    if (url) linked.push({ key, kind, href: url, display: prettyUrl(url) });
    else empty.push({ key, kind, href: null, display: `Add ${kind.name}` });
  };
  add('linkedin', KINDS[0]!.kind, p.linkedin_url);
  add('x', KINDS[1]!.kind, p.x_url);
  for (const url of p.links ?? []) linked.push({ key: url, kind: detectLink(url), href: url, display: prettyUrl(url) });
  // The website slot gets a real icon too: a known platform's mark, or the site's own favicon.
  add('website', p.website_url ? detectLink(p.website_url) : WEBSITE, p.website_url);
  if (email) linked.push({ key: 'email', kind: EMAIL, href: `mailto:${email}`, display: email });
  else empty.push({ key: 'email', kind: EMAIL, href: null, display: 'Add email' });
  return { linked, empty };
}
