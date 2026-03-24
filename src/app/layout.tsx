import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import NextAuthProvider from '@/components/providers/session-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import ToastProvider from '@/components/providers/toast-provider';
import QueryProvider from '@/components/providers/query-provider';
import { LayoutContent } from '@/components/layout/layout-content';
import { SocketProvider } from '@/components/providers/socket-provider';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: {
    default: 'Group Ad — Enterprise Social Networking',
    template: '%s | Group Ad'
  },
  description: 'Connect with professionals and businesses in a neat, curated environment for maximum growth and collaboration.',
  keywords: ['enterprise social network', 'business networking', 'professional collaboration', 'group ad', 'b2b networking'],
  authors: [{ name: 'Group Ad Team' }],
  creator: 'Group Ad',
  publisher: 'Group Ad',
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
    title: 'Group Ad — Enterprise Social Networking',
    description: 'Connect with professionals and businesses in a neat, curated environment.',
    url: 'https://group-ad.vercel.app',
    siteName: 'Group Ad',
    images: [
      {
        url: '/auth/thumbnail.png',
        width: 1200,
        height: 630,
        alt: 'Group Ad — Business Social Networking Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Group Ad — Enterprise Social Networking',
    description: 'Connect with professionals and businesses in a neat, curated environment.',
    creator: '@groupad',
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
    icon: '/auth/thumbnail.png',
    shortcut: '/auth/thumbnail.png',
    apple: '/auth/thumbnail.png',
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
            <SocketProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
                storageKey="theme"
              >
                <LayoutContent>{children}</LayoutContent>
                <ToastProvider />
              </ThemeProvider>
            </SocketProvider>
          </QueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}

