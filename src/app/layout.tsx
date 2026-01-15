import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Navbar } from '@/components/layout/navbar';
import { AuthProvider } from '@/components/providers/auth-provider';
import { AuthModal } from '@/components/layout/auth-modal';

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
      <body className={inter.variable}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            <div className="min-h-screen bg-background text-foreground">
              <Navbar />
              <main>{children}</main>
              <AuthModal />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
