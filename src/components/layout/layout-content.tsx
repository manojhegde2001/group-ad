'use client';

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('@/components/layout/auth-modal').then(mod => mod.AuthModal), { ssr: false });
const CreatePostModal = dynamic(() => import('@/components/feed/create-post-modal').then(mod => mod.CreatePostModal), { ssr: false });
const CreateEventModal = dynamic(() => import('@/components/events/create-event-modal').then(mod => mod.CreateEventModal), { ssr: false });
const SaveToBoardModal = dynamic(() => import('@/components/boards/save-to-board-modal').then(mod => mod.SaveToBoardModal), { ssr: false });

import { Analytics } from '@vercel/analytics/react';

export function LayoutContent({ 
  children,
  modal 
}: { 
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        isAuthenticated ? "md:pl-20" : ""
      )}>
        <Navbar />
        <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {children}
        </main>
        <Footer />
      </div>
      <AuthModal />
      <CreatePostModal />
      <CreateEventModal />
      <SaveToBoardModal />
      {modal}
      <Analytics />
    </div>
  );
}
