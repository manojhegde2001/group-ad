import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import NextAuthProvider from '@/components/providers/session-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Navbar } from '@/components/layout/navbar';
import { AuthModal } from '@/components/layout/auth-modal';
import ToastProvider from '@/components/providers/toast-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Group Ad - Connect & Advertise',
  description: 'Modern advertising platform',
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
      <body className={inter.variable}>
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            storageKey="theme"
          >
            <NextAuthProvider>
              <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <main>{children}</main>
                <AuthModal />
              </div>
            </NextAuthProvider>
            <ToastProvider />
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
