'use client';

import { useState } from 'react';
import { useSaveToBoard } from '@/hooks/use-feed';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Modal } from 'rizzui';
import { 
    useBoards, 
    useCheckPostInBoards, 
    useCreateBoard, 
    useAddPostToBoard, 
    useRemovePostFromBoard 
} from '@/hooks/use-api/use-boards';

export function SaveToBoardModal() {
  const { isOpen, postId, close } = useSaveToBoard();
  const [newBoardName, setNewBoardName] = useState('');

  // Queries
  const { data: boardsData, isLoading: loadingBoards } = useBoards({
    enabled: isOpen,
  });
  const boards = boardsData?.boards || [];

  const { data: checkData, isLoading: loadingCheck } = useCheckPostInBoards(postId as string);
  const savedBoardIds = checkData?.boardIds || [];

  // Mutations
  const createBoardMutation = useCreateBoard();
  const addPostMutation = useAddPostToBoard();
  const removePostMutation = useRemovePostFromBoard();

  const loading = loadingBoards || loadingCheck;

  const handleToggleBoard = async (boardId: string) => {
    if (!postId) return;
    const isSaved = savedBoardIds.includes(boardId);

    if (isSaved) {
        removePostMutation.mutate({ boardId, postId });
    } else {
        addPostMutation.mutate({ boardId, postId }, {
            onSuccess: () => {
                // Auto-close after 800ms for a "snappy" feel
                setTimeout(close, 800);
            }
        });
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    
    createBoardMutation.mutate({ name: newBoardName }, {
        onSuccess: (newBoard) => {
            setNewBoardName('');
            // Auto save to the new board
            if (postId && newBoard.id) {
                handleToggleBoard(newBoard.id);
            }
        }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      containerClassName="flex items-center justify-center p-4"
    >
      <div className="relative w-full max-w-sm bg-white dark:bg-secondary-950 rounded-3xl shadow-2xl overflow-hidden m-auto border border-secondary-100 dark:border-secondary-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-100 dark:border-secondary-800">
          <h2 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter">Save to board</h2>
          <button 
            onClick={close}
            className="p-1.5 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Create Board Section */}
        <div className="p-4 bg-secondary-50/50 dark:bg-secondary-900/50 border-b border-secondary-100 dark:border-secondary-800">
           <div className="flex items-center gap-2">
                <input 
                    type="text"
                    placeholder="Create new board..."
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                    className="flex-1 bg-white dark:bg-secondary-800 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none shadow-sm placeholder:text-secondary-400"
                    disabled={createBoardMutation.isPending}
                />
                <button
                    onClick={handleCreateBoard}
                    disabled={createBoardMutation.isPending || !newBoardName.trim()}
                    className="h-10 w-10 flex items-center justify-center bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shrink-0 shadow-lg shadow-primary-600/20 active:scale-95"
                >
                    {createBoardMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
                </button>
           </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-none">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
              </div>
              <p className="text-xs font-black text-secondary-400 uppercase tracking-widest">Loading boards</p>
            </div>
          ) : (
            <div className="space-y-1">
              {boards.map((board) => {
                const isSelected = savedBoardIds.includes(board.id);
                const postsArray = board.posts || [];
                const firstImage = postsArray[0]?.post?.images?.[0];
                const isToggling = (addPostMutation.isPending && addPostMutation.variables?.boardId === board.id) || 
                                  (removePostMutation.isPending && removePostMutation.variables?.boardId === board.id);

                return (
                  <button
                    key={board.id}
                    disabled={isToggling}
                    onClick={() => handleToggleBoard(board.id)}
                    className={cn(
                        "w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 text-left group",
                        isSelected 
                            ? "bg-primary-50 dark:bg-primary-900/10" 
                            : "hover:bg-secondary-50 dark:hover:bg-secondary-800/50",
                        isToggling && "opacity-50 cursor-not-allowed"
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
                        <p className={cn("font-black text-sm uppercase tracking-tight", isSelected ? "text-primary-600 dark:text-primary-400" : "text-secondary-900 dark:text-white")}>
                          {board.name}
                        </p>
                        <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest">
                          {board._count?.posts || 0} items
                        </p>
                      </div>
                    </div>
                    {isToggling ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                    ) : isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shadow-lg transform scale-110 transition-transform">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                       <div className="w-6 h-6 rounded-full border-2 border-secondary-200 dark:border-secondary-700 transition-colors group-hover:border-primary-400 group-hover:bg-white dark:group-hover:bg-secondary-800" />
                    )}
                  </button>
                );
              })}

              {boards.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4">
                    <div className="w-16 h-16 bg-secondary-50 dark:bg-secondary-900 rounded-[2rem] flex items-center justify-center">
                        <Plus className="w-8 h-8 text-secondary-200" />
                    </div>
                    <div>
                        <p className="font-black text-secondary-900 dark:text-white uppercase tracking-tight">No boards yet</p>
                        <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest mt-1">Create your first board above</p>
                    </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
