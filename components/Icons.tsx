type P = { size?: number; color?: string; width?: number };

const base = (size: number, color: string, width: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: width,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const Plus = ({ size = 14, color = 'currentColor', width = 2.2 }: P) => (
  <svg {...base(size, color, width)}><path d="M12 5v14M5 12h14" /></svg>
);
export const Mail = ({ size = 15, color = 'currentColor', width = 1.8 }: P) => (
  <svg {...base(size, color, width)}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>
);
export const Globe = ({ size = 15, color = 'currentColor', width = 1.8 }: P) => (
  <svg {...base(size, color, width)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" /></svg>
);
export const Back = ({ size = 20, color = 'currentColor', width = 1.9 }: P) => (
  <svg {...base(size, color, width)}><path d="m15 6-6 6 6 6" /></svg>
);
export const Stack = ({ size = 20, color = 'currentColor', width = 1.8 }: P) => (
  <svg {...base(size, color, width)}><rect x="4" y="7" width="16" height="13" rx="3" /><path d="M7 4h10" /></svg>
);
export const Check = ({ size = 18, color = 'currentColor', width = 2.4 }: P) => (
  <svg {...base(size, color, width)}><path d="m5 12 5 5 9-10" /></svg>
);
export const Cross = ({ size = 22, color = 'currentColor', width = 2.2 }: P) => (
  <svg {...base(size, color, width)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const Sparkle = ({ size = 16, color = 'currentColor', width = 1.9 }: P) => (
  <svg {...base(size, color, width)}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>
);
export const Pin = ({ size = 18, color = 'currentColor', width = 1.9 }: P) => (
  <svg {...base(size, color, width)}><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
);
export const Bell = ({ size = 18, color = 'currentColor', width = 2 }: P) => (
  <svg {...base(size, color, width)}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></svg>
);
export const Clock = ({ size = 18, color = 'currentColor', width = 1.9 }: P) => (
  <svg {...base(size, color, width)}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" /></svg>
);
export const Qr = ({ size = 18, color = 'currentColor', width = 2 }: P) => (
  <svg {...base(size, color, width)}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M14 14h3v3M21 14v7h-7" /></svg>
);
export const LinkIcon = ({ size = 20, color = 'currentColor', width = 1.8 }: P) => (
  <svg {...base(size, color, width)}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
);
export const Chat = ({ size = 20, color = 'currentColor', width = 1.9 }: P) => (
  <svg {...base(size, color, width)}><path d="M4 20l1.5-4.5A8 8 0 1 1 9 19z" /></svg>
);
export const Pencil = ({ size = 18, color = 'currentColor', width = 1.8 }: P) => (
  <svg {...base(size, color, width)}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></svg>
);
