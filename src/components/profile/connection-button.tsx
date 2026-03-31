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

    useEffect(() => {
        setStatus(initialStatus);
    }, [initialStatus]);

    const loading = connectMutation.isPending || updateMutation.isPending || removeMutation.isPending;

    // Don't render if viewing own profile
    if (isAuthenticated && user?.id === userId) return null;

    const handleConnect = () => {
        if (!isAuthenticated) {
            openLogin();
            return;
        }
        
        connectMutation.mutate(userId, {
            onSuccess: () => {
                setStatus('PENDING');
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
            <Button
                onClick={handleConnect}
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
        );
    }

    // 2. Pending Request SENT by us
    if (status === 'PENDING' && isInitiator) {
        return (
            <Button
                disabled={loading}
                variant="outline"
                color="secondary"
                size={size}
                rounded="pill"
                className={cn("px-5 font-black uppercase tracking-widest text-[10px] border-2", className)}
            >
                <Clock className="w-3.5 h-3.5 mr-2" />
                Requested
            </Button>
        );
    }

    // 3. Pending Request RECEIVED by us
    if (status === 'PENDING' && !isInitiator) {
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
