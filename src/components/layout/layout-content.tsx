'use client';

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('@/components/layout/auth-modal').then(mod => mod.AuthModal), { ssr: false });
const CreatePostModal = dynamic(() => import('@/components/feed/create-post-modal').then(mod => mod.CreatePostModal), { ssr: false });
const CreateEventModal = dynamic(() => import('@/components/events/create-event-modal').then(mod => mod.CreateEventModal), { ssr: false });
const SaveToBoardModal = dynamic(() => import('@/components/boards/save-to-board-modal').then(mod => mod.SaveToBoardModal), { ssr: false });
const ChatbotDrawer = dynamic(() => import('@/components/chatbot').then(mod => mod.ChatbotDrawer), { ssr: false });

import { Analytics } from '@vercel/analytics/react';

export function LayoutContent({ 
  children,
  modal 
}: { 
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  
  const NO_FOOTER_ROUTES = ['/messages'];

  // Always show mobile nav space since we now have unauthenticated bottom nav
  const showMobileNav = true; 
  const showFooter = !NO_FOOTER_ROUTES.some(p => pathname?.startsWith(p));
  
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col min-w-0 relative",
        isAuthenticated ? "md:pl-20" : ""
      )}>
        <Navbar />
        <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {children}
        </main>
        {showFooter && <Footer />}
        {showMobileNav && showFooter && (
          <div className="md:hidden w-full shrink-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))]" aria-hidden="true" />
        )}
      </div>
      <AuthModal />
      <CreatePostModal />
      <CreateEventModal />
      <SaveToBoardModal />
      <ChatbotDrawer />
      {modal}
      <Analytics />
    </div>
  );
}
