'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useWasAuthenticated, WAS_AUTH_KEY } from '@/hooks/use-was-authenticated';
import { useChatbot } from '@/hooks/use-chatbot';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AppChromeSkeleton } from '@/components/layout/app-chrome-skeleton';
import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('@/components/layout/auth-modal').then(mod => mod.AuthModal), { ssr: false });
const CreatePostModal = dynamic(() => import('@/components/feed/create-post-modal').then(mod => mod.CreatePostModal), { ssr: false });
const CreateEventModal = dynamic(() => import('@/components/events/create-event-modal').then(mod => mod.CreateEventModal), { ssr: false });
const SaveToBoardModal = dynamic(() => import('@/components/boards/save-to-board-modal').then(mod => mod.SaveToBoardModal), { ssr: false });
const ChatbotDrawer = dynamic(() => import('@/components/chatbot').then(mod => mod.ChatbotDrawer), { ssr: false });

export function LayoutContent({ 
  children,
  modal 
}: { 
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const wasAuthenticated = useWasAuthenticated();
  const pathname = usePathname();
  const chatOpen = useChatbot((s) => s.isOpen);

  // Hold the chatbot chunk (and its AI/markdown deps) back until the browser is
  // idle so it never competes with hydration for the main thread. Once mounted
  // it stays mounted, so its open/close animation is unaffected.
  const [deferredReady, setDeferredReady] = useState(false);
  useEffect(() => {
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number;
    };
    const schedule = w.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
    const id = schedule(() => setDeferredReady(true));
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(id as number);
      else clearTimeout(id as number);
    };
  }, []);

  // Remember auth state so a hard refresh can paint the logged-in shell
  // before next-auth re-confirms. Cleared on sign-out.
  useEffect(() => {
    if (loading) return;
    try {
      if (isAuthenticated) localStorage.setItem(WAS_AUTH_KEY, '1');
      else localStorage.removeItem(WAS_AUTH_KEY);
    } catch {
      /* storage unavailable — feature just no-ops */
    }
  }, [isAuthenticated, loading]);

  // Session not yet confirmed, but this browser was logged in last time.
  const showAuthedSkeleton = loading && wasAuthenticated && !isAuthenticated;

  const NO_FOOTER_ROUTES = ['/messages'];

  // Always show mobile nav space since we now have unauthenticated bottom nav
  const showMobileNav = true; 
  const showFooter = !NO_FOOTER_ROUTES.some(p => pathname?.startsWith(p));
  
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {showAuthedSkeleton && <AppChromeSkeleton />}
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col min-w-0 relative",
        (isAuthenticated || showAuthedSkeleton) ? "md:pl-20" : "",
        showAuthedSkeleton ? "md:pt-20" : ""
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
      {(deferredReady || chatOpen) && <ChatbotDrawer />}
      {modal}
    </div>
  );
}
