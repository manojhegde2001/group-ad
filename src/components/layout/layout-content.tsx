'use client';

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthModal } from '@/components/layout/auth-modal';
import { CreatePostModal } from '@/components/feed/create-post-modal';
import { CreateEventModal } from '@/components/events/create-event-modal';
import { PostDetailDrawer } from '@/components/feed/post-detail-drawer';
import { SaveToBoardModal } from '@/components/boards/save-to-board-modal';
import { Analytics } from '@vercel/analytics/react';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-[margin] duration-300",
        isAuthenticated ? "md:ml-20" : ""
      )}>
        <Navbar />
        <main className="flex-1 overflow-x-hidden pt-16 md:pt-0">
          {children}
        </main>
        <Footer />
      </div>
      <AuthModal />
      <CreatePostModal />
      <CreateEventModal />
      <PostDetailDrawer />
      <SaveToBoardModal />
      <Analytics />
    </div>
  );
}
