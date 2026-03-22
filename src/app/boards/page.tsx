'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Plus, LayoutGrid, MoreVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface Board {
  id: string;
  name: string;
  description: string | null;
  _count: { posts: number };
  posts: { post: { images: string[] } }[];
  updatedAt: string;
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoards = async () => {
    try {
      const res = await fetch('/api/boards');
      const data = await res.json();
      setBoards(data.boards || []);
    } catch (e) {
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (name: string) => {
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      const newBoard = await res.json();
      if (res.ok) {
        setBoards(prev => [newBoard, ...prev]);
        toast.success(`Board "${name}" created!`);
      } else {
        toast.error(newBoard.error || 'Failed to create board');
      }
    } catch (e) {
      toast.error('Failed to create board');
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f] pt-16 md:pt-20 px-4 sm:px-6 pb-20">
      <div className="max-w-7xl mx-auto py-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 md:mb-12">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-secondary-900 dark:text-white">
              Your Boards
            </h1>
            <p className="text-secondary-500 dark:text-secondary-400 font-medium">
              Organize your inspiration into custom collections.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="text"
              placeholder="New board name..."
              className="bg-secondary-50 dark:bg-secondary-900 border-none rounded-2xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none w-48 sm:w-64 transition-all shadow-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const name = (e.target as HTMLInputElement).value;
                  if (name.trim()) {
                    handleCreateBoard(name);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <button 
              className="h-10 w-10 flex items-center justify-center bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all shadow-md active:scale-95"
              onClick={() => {
                const input = document.querySelector('input[placeholder="New board name..."]') as HTMLInputElement;
                if (input?.value.trim()) {
                  handleCreateBoard(input.value);
                  input.value = '';
                }
              }}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-secondary-100 dark:border-secondary-800 rounded-[2.5rem]">
            <div className="w-20 h-20 bg-secondary-50 dark:bg-secondary-900/50 rounded-full flex items-center justify-center mb-6">
              <LayoutGrid className="w-10 h-10 text-secondary-300" />
            </div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">No boards yet</h2>
            <p className="text-secondary-500 dark:text-secondary-400 max-w-sm mb-8">
              Start by saving a post you like, or create your first board here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BoardCard({ board }: { board: Board }) {
  const postsArray = board.posts || [];
  const images = postsArray.map(p => p.post?.images?.[0]).filter(Boolean);
  const postCount = board._count?.posts || 0;
  
  return (
    <Link 
      href={`/boards/${board.id}`}
      className="group flex flex-col gap-3 focus:outline-none"
    >
      {/* Visual Preview */}
      <div className="aspect-[4/3] rounded-[2rem] overflow-hidden bg-secondary-100 dark:bg-secondary-900/50 relative shadow-sm group-hover:shadow-xl transition-all duration-500">
        <div className="grid grid-cols-2 grid-rows-2 h-full gap-0.5">
          <div className="row-span-2 relative">
            {images[0] ? (
              <img src={images[0]} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full bg-secondary-200 dark:bg-secondary-800" />
            )}
          </div>
          <div className="relative">
            {images[1] ? (
              <img src={images[1]} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full bg-secondary-200/60 dark:bg-secondary-800/60" />
            )}
          </div>
          <div className="relative">
            {images[2] ? (
              <img src={images[2]} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full bg-secondary-200/40 dark:bg-secondary-800/40" />
            )}
          </div>
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Info */}
      <div className="px-2">
        <h3 className="text-lg font-bold text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {board.name}
        </h3>
        <p className="text-sm font-medium text-secondary-500">
          {postCount} posts
        </p>
      </div>
    </Link>
  );
}
