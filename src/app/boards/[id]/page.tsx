'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { FeedContainer } from '@/components/feed/feed-container';
import { toast } from 'react-hot-toast';

interface Board {
  id: string;
  name: string;
  description: string | null;
  _count: { posts: number };
}

export default function BoardDetailPage() {
  const { id } = useParams();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/boards/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setBoard(data);
        })
        .catch((e) => toast.error(e.message || 'Failed to load board'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">Board not found</h2>
        <Link href="/boards" className="text-primary-600 font-bold hover:underline">Back to Boards</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-[#0a0a0f] flex flex-col pt-16 md:pt-20">
      {/* Header */}
      <div className="bg-white/90 dark:bg-[#0a0a0f]/90 backdrop-blur-md border-b border-secondary-100 dark:border-secondary-900/50 shadow-sm sticky top-16 md:top-20 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14 md:h-16">
          <div className="flex items-center gap-4">
            <Link
              href="/boards"
              className="p-2 -ml-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-secondary-900 dark:text-white">
                {board.name}
              </h1>
              <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest leading-none mt-0.5">
                {board._count.posts} saved items
              </p>
            </div>
          </div>

          <button className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 transition-colors">
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Feed Container — Filtered by Board ID */}
      <div className="flex-1 pb-24">
         <FeedContainer boardId={board.id} categoryId={null} />
      </div>
    </div>
  );
}
