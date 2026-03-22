'use client';

import { useState, useEffect } from 'react';
import { useSaveToBoard } from '@/hooks/use-feed';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface Board {
  id: string;
  name: string;
  _count: { posts: number };
  posts: { post: { images: string[] } }[];
}

export function SaveToBoardModal() {
  const { isOpen, postId, close } = useSaveToBoard();
  const [boards, setBoards] = useState<Board[]>([]);
  const [savedBoardIds, setSavedBoardIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const fetchBoards = async () => {
    try {
      const res = await fetch('/api/boards');
      const data = await res.json();
      setBoards(data.boards || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCheck = async () => {
    if (!postId) return;
    try {
      const res = await fetch(`/api/boards/check?postId=${postId}`);
      const data = await res.json();
      setSavedBoardIds(data.savedBoardIds || []);
    } catch (e) {
        console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen && postId) {
      setLoading(true);
      Promise.all([fetchBoards(), fetchCheck()]).finally(() => setLoading(false));
    }
  }, [isOpen, postId]);

  const handleToggleBoard = async (boardId: string) => {
    const isSaved = savedBoardIds.includes(boardId);
    try {
      if (isSaved) {
        // Remove
        const res = await fetch(`/api/boards/${boardId}/posts?postId=${postId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setSavedBoardIds(prev => prev.filter(id => id !== boardId));
          toast.success('Removed from board');
        }
      } else {
        // Add
        const res = await fetch(`/api/boards/${boardId}/posts`, {
          method: 'POST',
          body: JSON.stringify({ postId }),
        });
        if (res.ok) {
          setSavedBoardIds(prev => [...prev, boardId]);
          toast.success('Saved to board');
          // Auto-close after 800ms for a "snappy" feel
          setTimeout(close, 800);
        }
      }
    } catch (e) {
      toast.error('Something went wrong');
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        body: JSON.stringify({ name: newBoardName }),
      });
      const newBoard = await res.json();
      if (res.ok) {
        setBoards(prev => [newBoard, ...prev]);
        setNewBoardName('');
        // Auto save to the new board
        await handleToggleBoard(newBoard.id);
      } else {
        toast.error(newBoard.error || 'Failed to create board');
      }
    } catch (e) {
      toast.error('Failed to create board');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={close}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-white dark:bg-secondary-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-100 dark:border-secondary-800">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white">Save to board</h2>
          <button 
            onClick={close}
            className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Create Board Section — Now at top for convenience */}
        <div className="p-4 bg-secondary-50 dark:bg-secondary-900/50 border-b border-secondary-100 dark:border-secondary-800">
           <div className="flex items-center gap-2">
                <input 
                    type="text"
                    placeholder="Create new board..."
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                    className="flex-1 bg-white dark:bg-secondary-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
                    disabled={creating}
                />
                <button
                    onClick={handleCreateBoard}
                    disabled={creating || !newBoardName.trim()}
                    className="h-10 w-10 flex items-center justify-center bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shrink-0 shadow-md active:scale-95"
                >
                    {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
                </button>
           </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-none">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-sm font-medium text-secondary-500">Loading boards...</p>
            </div>
          ) : (
            <div className="space-y-1">
              {boards.map((board) => {
                const isSelected = savedBoardIds.includes(board.id);
                const postsArray = board.posts || [];
                const firstImage = postsArray[0]?.post?.images?.[0];

                return (
                  <button
                    key={board.id}
                    onClick={() => handleToggleBoard(board.id)}
                    className={cn(
                        "w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 text-left group",
                        isSelected 
                            ? "bg-primary-50 dark:bg-primary-900/10" 
                            : "hover:bg-secondary-50 dark:hover:bg-secondary-800/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-800 overflow-hidden shrink-0 shadow-inner">
                        {firstImage ? (
                          <img src={firstImage} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-secondary-200 dark:border-secondary-700 rounded-xl">
                             <Plus className="w-4 h-4 text-secondary-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className={cn("font-bold text-sm", isSelected ? "text-primary-600 dark:text-primary-400" : "text-secondary-900 dark:text-white")}>
                          {board.name}
                        </p>
                        <p className="text-[11px] text-secondary-500 font-bold uppercase tracking-wider">
                          {board._count?.posts || 0} items
                        </p>
                      </div>
                    </div>
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shadow-lg transform scale-110 transition-transform">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                       <div className="w-6 h-6 rounded-full border-2 border-secondary-200 dark:border-secondary-700 transition-colors group-hover:border-primary-400 group-hover:bg-white" />
                    )}
                  </button>
                );
              })}

              {boards.length === 0 && !loading && (
                <div className="text-center py-10 px-6">
                    <p className="text-sm text-secondary-400 font-medium">No boards yet. Create one above!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
