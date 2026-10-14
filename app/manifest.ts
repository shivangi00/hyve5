import type { MetadataRoute } from 'next';

// Lets people "Add to Home Screen". On iPhone that's required for push notifications.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NetworkPulse',
    short_name: 'NetworkPulse',
    description: 'Swap cards at events, then follow up while it still counts.',
    start_url: '/me',
    scope: '/',
    display: 'standalone',
    background_color: '#1d1114',
    theme_color: '#2a181d',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
