import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moderationService } from '@/services/api/moderation';
import toast from 'react-hot-toast';

export function useReport() {
  return useMutation({
    mutationFn: (data: { targetType: string; targetId: string; reason: string; description?: string }) =>
      moderationService.report(data),
    onSuccess: () => {
      toast.success('Report submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit report');
    },
  });
}

export function useBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockedId: string) =>
      moderationService.blockUser(blockedId),
    onSuccess: () => {
      toast.success('User blocked successfully');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to block user');
    },
  });
}

export function useUnblock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockedId: string) =>
      moderationService.unblockUser(blockedId),
    onSuccess: () => {
      toast.success('User unblocked successfully');
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unblock user');
    },
  });
}
