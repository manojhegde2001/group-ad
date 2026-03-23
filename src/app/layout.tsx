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
  title: 'Group Ad — Enterprise Social Networking',
  description: 'Connect with professionals and businesses in a neat, curated environment.',
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

