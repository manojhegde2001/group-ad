'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Loader2, MoreVertical, Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { FeedContainer } from '@/components/feed/feed-container';
import { useBoard, useUpdateBoard, useDeleteBoard } from '@/hooks/use-api/use-boards';
import { cn } from '@/lib/utils';

export default function BoardDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  // Queries
  const { data: board, isLoading: loading } = useBoard(id);

  // Mutations
  const updateBoardMutation = useUpdateBoard(id);
  const deleteBoardMutation = useDeleteBoard();

  // Meatball menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (board) {
      setNewName(board.name);
    }
  }, [board]);

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
    
    updateBoardMutation.mutate({ name: trimmed }, {
        onSuccess: () => {
            setRenaming(false);
            setMenuOpen(false);
        }
    });
  };

  const handleDelete = async () => {
    if (!confirm('Delete this board? Posts inside will be unlinked.')) return;
    deleteBoardMutation.mutate(id, {
        onSuccess: () => {
            router.push('/boards');
        }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 gap-4 bg-white dark:bg-[#0a0a0f]">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary-400">Loading board</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 bg-white dark:bg-[#0a0a0f]">
        <h2 className="text-2xl font-black text-secondary-900 dark:text-white mb-4 uppercase tracking-tighter">Board not found</h2>
        <Link href="/boards" className="text-primary-600 font-black hover:underline uppercase tracking-widest text-xs">Back to Boards</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50/50 dark:bg-[#0a0a0f] flex flex-col pt-16 md:pt-20">
      {/* Header */}
      <div className="bg-white/90 dark:bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-secondary-100 dark:border-secondary-900/50 shadow-sm sticky top-16 md:top-20 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16 md:h-20">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/boards"
              className="p-2.5 -ml-2 rounded-2xl hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 transition-all active:scale-90 shrink-0"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="min-w-0">
              {renaming ? (
                <div className="flex items-center gap-2 bg-secondary-50 dark:bg-secondary-900 px-4 py-2 rounded-2xl border-2 border-primary-500 shadow-lg shadow-primary-500/10">
                  <input
                    ref={inputRef}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRename();
                      if (e.key === 'Escape') { setRenaming(false); setNewName(board.name); }
                    }}
                    className="text-xl font-black text-secondary-900 dark:text-white bg-transparent outline-none w-40 sm:w-80"
                  />
                  <div className="flex items-center gap-1 border-l border-secondary-200 dark:border-secondary-700 ml-2 pl-2">
                    <button onClick={handleRename} className="text-primary-500 hover:text-primary-600 p-1.5 transition-colors">
                        <Check className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setRenaming(false); setNewName(board.name); }} className="text-secondary-400 hover:text-secondary-600 p-1.5 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <h1 className="text-2xl md:text-3xl font-black text-secondary-900 dark:text-white truncate uppercase tracking-tighter leading-none">
                  {board.name}
                </h1>
              )}
              {!renaming && (
                <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] leading-none mt-2">
                    {board._count?.posts || 0} saved items
                </p>
              )}
            </div>
          </div>

          {/* Meatball menu */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className={cn(
                  "p-3 rounded-2xl transition-all",
                  menuOpen ? "bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white" : "hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500"
              )}
              aria-label="Board options"
            >
              {updateBoardMutation.isPending || deleteBoardMutation.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              ) : (
                  <MoreVertical className="w-6 h-6" />
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-3 w-48 bg-white dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 rounded-3xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                <button
                  onClick={() => { setRenaming(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-5 py-3 text-xs font-black uppercase tracking-widest text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                >
                  <Pencil className="w-4 h-4 text-primary-500" /> Rename
                </button>
                <div className="h-px bg-secondary-50 dark:bg-secondary-800 mx-2" />
                <button
                  onClick={() => { setMenuOpen(false); handleDelete(); }}
                  className="w-full flex items-center gap-3 px-5 py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 pb-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto py-8">
            <FeedContainer boardId={board.id} categoryId={null} />
        </div>
      </div>
    </div>
  );
}
