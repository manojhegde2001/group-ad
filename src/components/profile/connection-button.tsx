'use client';

import { useState, useCallback, useMemo } from 'react';
import { UserPlus, UserCheck, UserX, Loader2, Check, X, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

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
    const [status, setStatus] = useState<ConnectionStatus>(initialStatus);
    const [loading, setLoading] = useState(false);

    // Don't render if viewing own profile
    if (isAuthenticated && user?.id === userId) return null;

    const handleConnect = async () => {
        if (!isAuthenticated) {
            openLogin();
            return;
        }
        if (loading) return;

        setLoading(true);
        try {
            const res = await fetch('/api/connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: userId }),
            });
            const data = await res.json();

            if (res.ok) {
                setStatus('PENDING');
                toast.success(`Connection request sent to ${targetName}`);
                onStatusChange?.('PENDING');
            } else {
                toast.error(data.error || 'Failed to send request');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'ACCEPT' | 'REJECT' | 'REMOVE') => {
        if (loading) return;
        setLoading(true);

        try {
            // Note: We need the connection ID. For ACCEPT/REJECT/REMOVE, 
            // the API currently expects the connection record ID.
            // Since we only have the target userId here, we might need to 
            // fetch the connection first or change the API to accept targetUserId.
            
            // For now, assume we'll use a specialized endpoint if needed or 
            // the profile API will provide the connection ID.
            
            // OPTIMIZATION: Fetch connection ID if not provided (placeholder logic)
            // Ideally, the parent component passes the connectionId.
            
            // To keep this component robust, let's assume we might need a 
            // 'by-user' endpoint for connections.
            
            const endpoint = `/api/connections/by-user/${userId}`;
            const res = await fetch(endpoint, {
                method: action === 'REMOVE' ? 'DELETE' : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: action === 'REMOVE' ? undefined : JSON.stringify({ action }),
            });
            
            if (res.ok) {
                if (action === 'ACCEPT') {
                    setStatus('ACCEPTED');
                    toast.success(`Now connected with ${targetName}`);
                    onStatusChange?.('ACCEPTED');
                } else if (action === 'REJECT' || action === 'REMOVE') {
                    setStatus(null);
                    toast.success(action === 'REMOVE' ? 'Connection removed' : 'Request ignored');
                    onStatusChange?.(null);
                }
            } else {
                const data = await res.json();
                toast.error(data.error || 'Operation failed');
            }
        } catch (error) {
            toast.error('Communication error');
        } finally {
            setLoading(false);
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
                    className="h-10 px-4 font-black uppercase tracking-widest text-[10px]"
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
                    className="h-10 px-4 font-black uppercase tracking-widest text-[10px] border-2"
                >
                    <X className="w-3.5 h-3.5" />
                </Button>
            </div>
        );
    }

    // 4. Already Connected
    if (status === 'ACCEPTED') {
        return (
            <Button
                onClick={() => {
                    if (window.confirm(`Are you sure you want to remove ${targetName} from your network?`)) {
                        handleAction('REMOVE');
                    }
                }}
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
