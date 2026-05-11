import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import NextAuthProvider from '@/components/providers/session-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import ToastProvider from '@/components/providers/toast-provider';
import QueryProvider from '@/components/providers/query-provider';
import { Analytics } from '@vercel/analytics/react';
import { SocketProvider } from '@/components/providers/socket-provider';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: {
    default: 'Vrutta — Enterprise Social Networking',
    template: '%s | Vrutta'
  },
  description: 'Connect with professionals and businesses in a neat, curated environment for maximum growth and collaboration.',
  keywords: ['enterprise social network', 'business networking', 'professional collaboration', 'Vrutta', 'b2b networking'],
  authors: [{ name: 'Vrutta Team' }],
  creator: 'Vrutta',
  publisher: 'Vrutta',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://group-ad.vercel.app')
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Vrutta — Enterprise Social Networking',
    description: 'Connect with professionals and businesses in a neat, curated environment.',
    url: 'https://group-ad.vercel.app',
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
    title: 'Vrutta — Enterprise Social Networking',
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
    apple: '/favicon.svg',
  },
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={plusJakarta.className}>
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
