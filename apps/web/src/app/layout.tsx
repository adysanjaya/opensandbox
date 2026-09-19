import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

const APP_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://sandbox.adysanjaya.my.id';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#090d16' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'OpenSandbox — Visual Flow REST API Builder & Backend Platform',
    template: '%s | OpenSandbox',
  },
  description:
    'Platform visual flow builder untuk mendesain, menguji, dan mendeploy REST API secara dinamis tanpa koding backend rumit. Drag-and-drop node logic, validasi request, dan integrasi database instan.',
  keywords: [
    // Primary Keywords (ID & EN)
    'OpenSandbox',
    'Visual API Builder',
    'REST API Generator',
    'No-code Backend',
    'Low-code API Platform',
    'Flow Builder API',
    'API Builder Indonesia',
    'Backend as a Service Indonesia',
    'Visual Flow Engine',
    'Dynamic REST API',
    'JSON API Builder',
    'API Mocking & Logic Flow',
    'Automated REST Endpoints',
    'Ady Sanjaya',
    'Software Developer Indonesia',
  ],
  authors: [
    {
      name: 'Ady Sanjaya',
      url: 'https://adysanjaya.my.id',
    },
  ],
  creator: 'Ady Sanjaya',
  publisher: 'Ady Sanjaya',
  applicationName: 'OpenSandbox',
  generator: 'Next.js',
  category: 'technology',
  classification: 'Software Development, Developer Tools, API Platform',
  alternates: {
    canonical: APP_URL,
    languages: {
      'id-ID': APP_URL,
      'en-US': APP_URL,
    },
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    alternateLocale: ['en_US'],
    url: APP_URL,
    siteName: 'OpenSandbox',
    title: 'OpenSandbox — Visual Flow REST API Builder & Backend Platform',
    description:
      'Bangun dan deploy dynamic REST API endpoints secara visual dengan drag & drop flow builder. Cepat, aman, dan tanpa boilerplate backend.',
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'OpenSandbox Visual API Builder Interface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenSandbox — Visual Flow REST API Builder',
    description:
      'Build & deploy dynamic REST APIs visually with drag-and-drop nodes. Zero backend boilerplate.',
    creator: '@adysanjaya',
    images: [`${APP_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    // Geo Targeting Metadata (Indonesia / Jakarta)
    'geo.region': 'ID',
    'geo.placename': 'Indonesia',
    'geo.position': '-6.2088;106.8456',
    'ICBM': '-6.2088, 106.8456',
    'DC.title': 'OpenSandbox — Visual Flow REST API Builder',
    'DC.creator': 'Ady Sanjaya',
    'DC.coverage': 'Indonesia',
    'DC.language': 'id, en',
    'target_country': 'ID',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${APP_URL}/#webapp`,
      name: 'OpenSandbox',
      url: APP_URL,
      description:
        'Visual flow REST API builder and dynamic backend engine. Design, connect, and deploy endpoints with visual nodes without backend boilerplate.',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      softwareVersion: '1.0.0',
      author: {
        '@type': 'Person',
        name: 'Ady Sanjaya',
        url: 'https://adysanjaya.my.id',
        email: 'adysanjaya013@gmail.com',
      },
      creator: {
        '@type': 'Person',
        name: 'Ady Sanjaya',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'IDR',
      },
      spatialCoverage: {
        '@type': 'Place',
        name: 'Indonesia',
        geo: {
          '@type': 'GeoCoordinates',
          latitude: -6.2088,
          longitude: 106.8456,
        },
      },
      featureList: [
        'Visual Drag-and-Drop Flow Builder',
        'Dynamic REST API Generation',
        'Request Body & Header Validation',
        'Reusable Shared Logic Functions',
        'Real-time Endpoint Execution',
        'PostgreSQL Database Integration',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${APP_URL}/#website`,
      url: APP_URL,
      name: 'OpenSandbox',
      description: 'Visual Flow REST API Platform Indonesia',
      inLanguage: ['id-ID', 'en-US'],
      publisher: {
        '@type': 'Person',
        name: 'Ady Sanjaya',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background antialiased selection:bg-primary/20 selection:text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
