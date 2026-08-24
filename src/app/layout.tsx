import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import NextAuthProvider from '@/components/providers/session-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import ToastProvider from '@/components/providers/toast-provider';
import QueryProvider from '@/components/providers/query-provider';
import { Analytics } from '@vercel/analytics/react';
import { SocketProvider } from '@/components/providers/socket-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Vrutta — Enterprise Professional Ecosystem',
    template: '%s | Vrutta'
  },
  description: 'Connect with professionals and businesses in a neat, curated environment for maximum growth and collaboration.',
  keywords: ['enterprise professional ecosystem', 'professional connections', 'professional collaboration', 'Vrutta', 'b2b connections'],
  authors: [{ name: 'Vrutta Team' }],
  creator: 'Vrutta',
  publisher: 'Vrutta',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('group-ad.vercel.app')) 
    ? process.env.NEXT_PUBLIC_APP_URL 
    : 'https://www.vrutta.net'
  ),

  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Vrutta — Enterprise Professional Ecosystem',
    description: 'Connect with professionals and businesses in a neat, curated environment.',
    url: 'https://www.vrutta.net',
    siteName: 'Vrutta',
    images: [
      {
        url: '/auth/thumbnail.png',
        width: 1200,
        height: 630,
        alt: 'Vrutta — Business Social Networking Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vrutta — Enterprise Professional Ecosystem',
    description: 'Connect with professionals and businesses in a neat, curated environment.',
    creator: '@vrutta',
    images: ['/auth/thumbnail.png'],
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
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vrutta',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${jakarta.variable} ${inter.className}`}>
        <NextAuthProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              storageKey="theme"
            >
              <SocketProvider>
                {/* Now only global providers here. Public layout is in (public)/layout.tsx */}
                {children}
              </SocketProvider>
              <ToastProvider />
              <Analytics />
            </ThemeProvider>
          </QueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
