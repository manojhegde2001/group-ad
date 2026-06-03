'use client';

import { useQuery } from '@tanstack/react-query';
import { meetingService } from '@/services/api/meetings';
import { useAuth } from '@/hooks/use-auth';

export const useUnreadMeetings = () => {
    const { user } = useAuth();

    const { data } = useQuery<{ meetings: any[] }>({
        queryKey: ['meetings'],
        queryFn: () => meetingService.getMeetings(),
        enabled: !!user && (user as any).userType === 'BUSINESS',
        staleTime: 30_000,
    });

    const pendingCount = (data?.meetings || []).filter(
        (m: any) => m.status === 'PENDING' && m.receiverId === user?.id
    ).length;

    return { pendingCount };
};
