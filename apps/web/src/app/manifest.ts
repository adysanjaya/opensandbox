import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OpenSandbox — Visual Flow REST API Builder',
    short_name: 'OpenSandbox',
    description: 'Build dynamic REST API endpoints visually with zero backend boilerplate.',
    start_url: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/og-image.png',
        sizes: '856x606',
        type: 'image/png',
      },
    ],
  };
}
