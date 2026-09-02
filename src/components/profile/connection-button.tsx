'use client';
import { useState, useEffect } from 'react';
import { CirclePlus, CircleCheck, CircleX, Loader2, Check, X, Clock } from 'lucide-react';
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
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    onStatusChange?: (newStatus: ConnectionStatus) => void;
}

export function ConnectionButton({
    userId,
    targetName = 'User',
    initialStatus = null,
    isInitiator = false,
    size = 'md',
    className,
    onStatusChange,
}: ConnectionButtonProps) {
    const { user, isAuthenticated, loading: loadingAuth } = useAuth();
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

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs local status from props when they change
        setStatus(initialStatus);
        setLocalIsInitiator(isInitiator);
    }, [initialStatus, isInitiator]);

    const loading = connectMutation.isPending || updateMutation.isPending || removeMutation.isPending;
    
    // Don't render while auth is loading
    if (loadingAuth) return null;

    // Don't render if viewing own profile
    if (isAuthenticated && user?.id === userId) return null;

    const handleConnect = () => {
        if (!isAuthenticated) {
            openLogin();
            return;
        }
        
        connectMutation.mutate({ receiverId: userId }, {
            onSuccess: () => {
                setStatus('PENDING');
                setLocalIsInitiator(true);
                onStatusChange?.('PENDING');
            }
        });
    };

    const handleAction = (action: 'ACCEPT' | 'REJECT' | 'REMOVE') => {
        if (action === 'REMOVE') {
            if (window.confirm(`Are you sure you want to remove ${targetName} from your circle?`)) {
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
            <Button
                onClick={handleConnect}
                disabled={loading}
                className={cn("flex items-center justify-center h-10 px-6 rounded-full bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 hover:bg-secondary-800 dark:hover:bg-secondary-100 shadow-lg shadow-secondary-900/20 dark:shadow-white/10 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95", className)}
            >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <CirclePlus className="w-3.5 h-3.5 mr-2" />}
                Add to Circle
            </Button>
        );
    }

    // 2. Pending Request SENT by us
    if (status === 'PENDING' && localIsInitiator) {
        return (
            <Button
                onClick={() => handleAction('REMOVE')}
                disabled={loading}
                className={cn("flex items-center justify-center h-10 px-5 rounded-full border border-secondary-200 dark:border-secondary-700 bg-secondary-100 dark:bg-secondary-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-secondary-600 dark:text-secondary-300 hover:text-red-600 dark:hover:text-red-400 font-black uppercase tracking-widest text-[10px] group transition-colors", className)}
            >
                {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                ) : (
                    <>
                        <Clock className="w-3.5 h-3.5 mr-2 group-hover:hidden" />
                        <X className="w-3.5 h-3.5 mr-2 hidden group-hover:block" />
                    </>
                )}
                <span className="grid text-center whitespace-nowrap">
                    <span className="col-start-1 row-start-1 transition-opacity group-hover:opacity-0">Requested</span>
                    <span className="col-start-1 row-start-1 opacity-0 transition-opacity group-hover:opacity-100">Cancel</span>
                </span>
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
                    className="flex-1 min-w-0 flex items-center justify-center h-10 px-5 rounded-full bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 hover:bg-secondary-800 dark:hover:bg-secondary-100 font-black uppercase tracking-widest text-[10px] transition-colors"
                >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Check className="w-3.5 h-3.5 mr-2" />}
                    Accept
                </Button>
                <Button
                    onClick={() => handleAction('REJECT')}
                    disabled={loading}
                    className="flex-1 min-w-0 flex items-center justify-center h-10 px-5 rounded-full bg-secondary-100 dark:bg-secondary-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-secondary-600 dark:text-secondary-300 hover:text-red-600 dark:hover:text-red-400 font-black uppercase tracking-widest text-[10px] transition-colors"
                >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <X className="w-3.5 h-3.5 mr-2" />}
                    Decline
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
                className={cn("flex items-center justify-center h-10 px-6 rounded-full border border-secondary-200 dark:border-secondary-700 bg-secondary-100 dark:bg-secondary-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-secondary-600 dark:text-secondary-300 hover:text-red-600 dark:hover:text-red-400 font-black uppercase tracking-widest text-[10px] group transition-colors", className)}
            >
                {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                ) : (
                    <>
                        <CircleCheck className="w-3.5 h-3.5 mr-2 group-hover:hidden" />
                        <CircleX className="w-3.5 h-3.5 mr-2 hidden group-hover:block" />
                    </>
                )}
                <span className="grid text-center whitespace-nowrap">
                    <span className="col-start-1 row-start-1 transition-opacity group-hover:opacity-0">In Circle</span>
                    <span className="col-start-1 row-start-1 opacity-0 transition-opacity group-hover:opacity-100">Leave Circle</span>
                </span>
            </Button>
        );
    }

    return null;
}
