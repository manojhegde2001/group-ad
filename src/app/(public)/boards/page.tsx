'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Loader2, Plus, LayoutGrid, MoreVertical, Trash2, Pencil, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
    useBoards, 
    useCreateBoard, 
    useDeleteBoard, 
    useUpdateBoard 
} from '@/hooks/use-api/use-boards';
import { Board } from '@/services/api/boards';

export default function BoardsPage() {
  const { data: boardsData, isLoading: loading } = useBoards();
  const boards = boardsData?.boards || [];

  const createBoardMutation = useCreateBoard();
  const deleteBoardMutation = useDeleteBoard();

  const handleCreateBoard = async (name: string) => {
    createBoardMutation.mutate({ name });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this board? Posts inside will be unlinked.')) return;
    deleteBoardMutation.mutate(id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f] pt-16 md:pt-20 px-4 sm:px-6 pb-20">
      <div className="max-w-7xl mx-auto py-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 md:mb-12">
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-secondary-900 dark:text-white uppercase">
              Your Boards
            </h1>
            <p className="text-secondary-500 dark:text-secondary-400 font-bold uppercase text-[10px] tracking-widest">
              Organize your inspiration into custom collections
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative group flex-1 sm:flex-none">
                <input 
                  type="text"
                  placeholder="New board name..."
                  className="bg-secondary-50 dark:bg-secondary-900 border-none rounded-2xl px-5 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary-500 outline-none w-full sm:w-64 transition-all shadow-sm placeholder:text-secondary-400"
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
            </div>
            <button 
              className="h-12 w-12 flex items-center justify-center bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 active:scale-95 disabled:opacity-50"
              disabled={createBoardMutation.isPending}
              onClick={() => {
                const input = document.querySelector('input[placeholder="New board name..."]') as HTMLInputElement;
                if (input?.value.trim()) {
                  handleCreateBoard(input.value);
                  input.value = '';
                }
              }}
            >
              {createBoardMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-secondary-100 dark:border-secondary-800 rounded-[3rem] bg-secondary-50/30 dark:bg-secondary-900/10 animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-white dark:bg-secondary-900 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-secondary-200/50 dark:shadow-none">
              <LayoutGrid className="w-10 h-10 text-secondary-200" />
            </div>
            <h2 className="text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tight mb-2 leading-none">No boards yet</h2>
            <p className="text-secondary-400 font-bold uppercase text-[10px] tracking-widest max-w-xs mb-8">
              Start by saving a post you like, or create your first board here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BoardCard({
  board,
  onDelete,
}: {
  board: Board;
  onDelete: (id: string) => void;
}) {
  const updateBoardMutation = useUpdateBoard(board.id);
  const postsArray = board.posts || [];
  const images = postsArray.map(p => p.post?.images?.[0]).filter(Boolean);
  const postCount = board._count?.posts || 0;

  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(board.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  const submitRename = () => {
    const trimmed = newName.trim();
    if (trimmed && trimmed !== board.name) {
      updateBoardMutation.mutate({ name: trimmed });
    }
    setRenaming(false);
    setMenuOpen(false);
  };

  return (
    <div className="group flex flex-col gap-4 focus:outline-none relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Visual Preview */}
      <Link href={`/boards/${board.id}`} className="block relative group-hover:-translate-y-1 transition-transform duration-500">
        <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-secondary-50 dark:bg-secondary-900/50 relative shadow-md group-hover:shadow-2xl transition-all duration-500 border border-secondary-100 dark:border-secondary-800">
          <div className="grid grid-cols-2 grid-rows-2 h-full gap-1 p-1">
            <div className="row-span-2 relative rounded-2xl overflow-hidden bg-secondary-100 dark:bg-secondary-800">
              {images[0] ? (
                <img src={images[0]} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <LayoutGrid className="w-6 h-6 text-secondary-200" />
                </div>
              )}
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-secondary-100/60 dark:bg-secondary-800/60">
              {images[1] ? (
                <img src={images[1]} className="w-full h-full object-cover" alt="" />
              ) : null}
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-secondary-100/40 dark:bg-secondary-800/40">
              {images[2] ? (
                <img src={images[2]} className="w-full h-full object-cover" alt="" />
              ) : null}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        {/* Badge */}
        <div className="absolute top-4 right-4 bg-white/95 dark:bg-secondary-900/95 backdrop-blur-xl px-3 py-1.5 rounded-2xl shadow-lg border border-secondary-100 dark:border-secondary-800 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
            <p className="text-[10px] font-black uppercase text-primary-600 tracking-widest">{postCount} items</p>
        </div>
      </Link>

      {/* Info + Meatball */}
      <div className="px-1 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <div className="flex items-center gap-2 bg-secondary-50 dark:bg-secondary-900 px-3 py-1.5 rounded-xl border border-primary-500">
              <input
                ref={inputRef}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') submitRename();
                  if (e.key === 'Escape') { setRenaming(false); setNewName(board.name); }
                }}
                className="text-sm font-bold text-secondary-900 dark:text-white bg-transparent outline-none w-full"
              />
              <button onClick={submitRename} className="text-primary-500 hover:text-primary-600 shrink-0 p-1">
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h3 className="text-xl font-black text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate uppercase tracking-tighter leading-tight">
              {board.name}
            </h3>
          )}
          {!renaming && (
            <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-[0.2em] mt-1">
               Created {new Date(board.updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Meatball menu */}
        <div ref={menuRef} className="relative shrink-0 pt-0.5">
          <button
            onClick={(e) => { e.preventDefault(); setMenuOpen(v => !v); }}
            className={cn(
                "p-2 rounded-2xl transition-all",
                menuOpen ? "bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white ring-2 ring-primary-500/20" : "text-secondary-400 hover:text-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800 opacity-0 group-hover:opacity-100"
            )}
            aria-label="Board options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-3 w-44 bg-white dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 rounded-3xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={() => { setRenaming(true); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-5 py-3 text-xs font-black uppercase tracking-widest text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
              >
                <Pencil className="w-4 h-4 text-primary-500" /> Rename
              </button>
              <div className="h-px bg-secondary-50 dark:bg-secondary-800 mx-2" />
              <button
                onClick={() => { setMenuOpen(false); onDelete(board.id); }}
                className="w-full flex items-center gap-3 px-5 py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
