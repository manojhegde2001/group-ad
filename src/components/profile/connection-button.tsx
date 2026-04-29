'use client';
import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, UserX, Loader2, Check, X, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
    useConnectMutation, 
    useUpdateConnectionMutation, 
    useRemoveConnectionMutation 
} from '@/hooks/use-api/use-connections';

type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED' | null;

interface ConnectionButtonProps {
    userId: string;
    targetName?: string;
    initialStatus: ConnectionStatus;
    isInitiator?: boolean; // True if current user sent the request
    mutualConnections?: { count: number; avatars: string[] };
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    onStatusChange?: (newStatus: ConnectionStatus) => void;
}

export function ConnectionButton({
    userId,
    targetName = 'User',
    initialStatus = null,
    isInitiator = false,
    mutualConnections = { count: 0, avatars: [] },
    size = 'md',
    className,
    onStatusChange,
}: ConnectionButtonProps) {
    const { user, isAuthenticated } = useAuth();
    const { openLogin } = useAuthModal();
    
    // Mutations
    const connectMutation = useConnectMutation();
    const updateMutation = useUpdateConnectionMutation();
    const removeMutation = useRemoveConnectionMutation();
    
    // We'll keep local status for immediate UI feedback, 
    // but the mutations will trigger cache invalidation.
    // For simplicity, we can also just rely on the parent component's 
    // re-rendering after invalidation, but a small local state is smoother.
    // However, the current component is receiving 'initialStatus' as a prop.
    const [status, setStatus] = useState<ConnectionStatus>(initialStatus);
    const [localIsInitiator, setLocalIsInitiator] = useState<boolean>(isInitiator);
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [note, setNote] = useState('');

    useEffect(() => {
        setStatus(initialStatus);
        setLocalIsInitiator(isInitiator);
    }, [initialStatus, isInitiator]);

    const loading = connectMutation.isPending || updateMutation.isPending || removeMutation.isPending;

    // Don't render if viewing own profile
    if (isAuthenticated && user?.id === userId) return null;

    const handleConnect = () => {
        if (!isAuthenticated) {
            openLogin();
            return;
        }
        
        connectMutation.mutate({ receiverId: userId, note: note.trim() || undefined }, {
            onSuccess: () => {
                setStatus('PENDING');
                setLocalIsInitiator(true);
                setShowNoteInput(false);
                onStatusChange?.('PENDING');
            }
        });
    };

    const handleAction = (action: 'ACCEPT' | 'REJECT' | 'REMOVE') => {
        if (action === 'REMOVE') {
            if (window.confirm(`Are you sure you want to remove ${targetName} from your network?`)) {
                removeMutation.mutate(userId, {
                    onSuccess: () => {
                        setStatus(null);
                        onStatusChange?.(null);
                    }
                });
            }
        } else {
            updateMutation.mutate({ targetUserId: userId, action }, {
                onSuccess: () => {
                    const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : null;
                    setStatus(newStatus);
                    onStatusChange?.(newStatus);
                }
            });
        }
    };

    // --- Render Logic ---

    // 1. Not connected / No request
    if (!status) {
        return (
            <div className="flex flex-col gap-2">
                {mutualConnections.count > 0 && (
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="flex -space-x-2">
                            {mutualConnections.avatars.map((avatar, i) => (
                                <div key={i} className="w-5 h-5 rounded-full border border-white dark:border-secondary-900 overflow-hidden bg-gray-100">
                                    <img src={avatar} className="w-full h-full object-cover" alt="" />
                                </div>
                            ))}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {mutualConnections.count} mutual connection{mutualConnections.count !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}
                
                {showNoteInput ? (
                    <div className="flex flex-col gap-2 w-full max-w-[200px]">
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Add a note (optional)..."
                            className="text-[10px] p-2 rounded-xl bg-gray-50 dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 focus:outline-none focus:ring-1 ring-primary-500 resize-none h-16"
                        />
                        <div className="flex gap-2">
                            <Button 
                                onClick={handleConnect} 
                                isLoading={loading}
                                size="sm" 
                                rounded="pill" 
                                className="flex-1 text-[9px] font-black uppercase h-8"
                            >
                                Send
                            </Button>
                            <Button 
                                onClick={() => setShowNoteInput(false)} 
                                variant="outline" 
                                size="sm" 
                                rounded="pill" 
                                className="text-[9px] font-black uppercase h-8"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        onClick={() => setShowNoteInput(true)}
                        disabled={loading}
                        variant="solid"
                        color="primary"
                        size={size}
                        rounded="pill"
                        className={cn("px-6 font-black uppercase tracking-widest text-[10px]", className)}
                    >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <UserPlus className="w-3.5 h-3.5 mr-2" />}
                        Connect
                    </Button>
                )}
            </div>
        );
    }

    // 2. Pending Request SENT by us
    if (status === 'PENDING' && localIsInitiator) {
        return (
            <Button
                onClick={() => handleAction('REMOVE')}
                disabled={loading}
                variant="outline"
                color="secondary"
                size={size}
                rounded="pill"
                className={cn("px-5 font-black uppercase tracking-widest text-[10px] border-2 group hover:border-red-500 hover:text-red-500 transition-all", className)}
            >
                {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                ) : (
                    <>
                        <Clock className="w-3.5 h-3.5 mr-2 group-hover:hidden" />
                        <X className="w-3.5 h-3.5 mr-2 hidden group-hover:block" />
                    </>
                )}
                <span className="group-hover:hidden">Requested</span>
                <span className="hidden group-hover:block">Cancel</span>
            </Button>
        );
    }

    // 3. Pending Request RECEIVED by us
    if (status === 'PENDING' && !localIsInitiator) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <Button
                    onClick={() => handleAction('ACCEPT')}
                    disabled={loading}
                    variant="solid"
                    color="primary"
                    size={size}
                    rounded="pill"
                    className="h-10 px-5 font-black uppercase tracking-widest text-[10px]"
                >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Check className="w-3.5 h-3.5 mr-2" />}
                    Accept
                </Button>
                <Button
                    onClick={() => handleAction('REJECT')}
                    disabled={loading}
                    variant="outline"
                    color="secondary"
                    size={size}
                    rounded="pill"
                    className="h-10 px-5 font-black uppercase tracking-widest text-[10px] border-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <X className="w-3.5 h-3.5 mr-2" />}
                    Reject
                </Button>
            </div>
        );
    }

    // 4. Already Connected
    if (status === 'ACCEPTED') {
        return (
            <Button
                onClick={() => handleAction('REMOVE')}
                disabled={loading}
                variant="outline"
                color="primary"
                size={size}
                rounded="pill"
                className={cn("h-10 px-6 font-black uppercase tracking-widest text-[10px] border-2 group hover:border-red-500 hover:text-red-500 transition-all", className)}
            >
                {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                ) : (
                    <>
                        <UserCheck className="w-3.5 h-3.5 mr-2 group-hover:hidden" />
                        <UserX className="w-3.5 h-3.5 mr-2 hidden group-hover:block" />
                    </>
                )}
                <span className="group-hover:hidden">Connected</span>
                <span className="hidden group-hover:block">Disconnect</span>
            </Button>
        );
    }

    return null;
}
