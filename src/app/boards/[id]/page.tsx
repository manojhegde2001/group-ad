'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Loader2, MoreVertical, Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useMe } from '@/hooks/use-api/use-user';
import { FeedContainer } from '@/components/feed/feed-container';
import { toast } from 'react-hot-toast';

interface Board {
  id: string;
  name: string;
  description: string | null;
  _count: { posts: number };
}

export default function BoardDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: me } = useMe();

  // Meatball menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/boards/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setBoard(data);
          setNewName(data.name);
        })
        .catch((e) => toast.error(e.message || 'Failed to load board'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  const handleRename = async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === board?.name) { setRenaming(false); return; }
    const res = await fetch(`/api/boards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) {
      setBoard(prev => prev ? { ...prev, name: trimmed } : prev);
      toast.success('Board renamed');
    } else {
      toast.error('Failed to rename board');
    }
    setRenaming(false);
    setMenuOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this board? Posts inside will be unlinked.')) return;
    const res = await fetch(`/api/boards/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Board deleted');
      router.push('/boards');
    } else {
      toast.error('Failed to delete board');
    }
  };

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
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/boards"
              className="p-2 -ml-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 transition-colors shrink-0"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="min-w-0">
              {renaming ? (
                <div className="flex items-center gap-1">
                  <input
                    ref={inputRef}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRename();
                      if (e.key === 'Escape') { setRenaming(false); setNewName(board.name); }
                    }}
                    className="text-xl font-black text-secondary-900 dark:text-white bg-transparent border-b-2 border-primary-500 outline-none w-40 sm:w-64"
                  />
                  <button onClick={handleRename} className="text-primary-500 hover:text-primary-600 p-1">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setRenaming(false); setNewName(board.name); }} className="text-secondary-400 hover:text-secondary-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <h1 className="text-xl md:text-2xl font-black text-secondary-900 dark:text-white truncate">
                  {board.name}
                </h1>
              )}
              <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest leading-none mt-0.5">
                {board._count.posts} saved items
              </p>
            </div>
          </div>

          {/* Meatball menu */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 hover:text-secondary-900 dark:hover:text-white transition-colors"
              aria-label="Board options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 rounded-2xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => { setRenaming(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Rename Board
                </button>
                <button
                  onClick={() => { setMenuOpen(false); handleDelete(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete Board
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 pb-24">
        <FeedContainer boardId={board.id} categoryId={null} />
      </div>
    </div>
  );
}
