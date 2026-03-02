import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import NextAuthProvider from '@/components/providers/session-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Navbar } from '@/components/layout/navbar';
import { AuthModal } from '@/components/layout/auth-modal';;
import ToastProvider from '@/components/providers/toast-provider';
import { Footer } from '@/components/layout/footer';
import { CreatePostModal } from '@/components/feed/create-post-modal';
import { PostDetailDrawer } from '@/components/feed/post-detail-drawer';
import { Analytics } from '@vercel/analytics/react';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Group Ad — Enterprise Social Networking',
  description: 'A Pinterest-style enterprise social networking platform for professionals and businesses. Discover, share, and connect.',
  keywords: 'social network, business networking, enterprise, professional, group ad',
  openGraph: {
    title: 'Group Ad — Enterprise Social Networking',
    description: 'Business-focused social networking platform for professionals.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={plusJakarta.variable}>
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            storageKey="theme"
          >
            <div className="min-h-screen bg-background text-foreground flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <AuthModal />
              <CreatePostModal />
              <PostDetailDrawer />
              <Analytics />
            </div>
            <ToastProvider />
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
