import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerTeamService } from '@/services/api/power-teams';
import toast from 'react-hot-toast';

export const usePowerTeams = (params: Record<string, any> = {}) => {
    return useQuery({
        queryKey: ['power-teams', params],
        queryFn: () => powerTeamService.getPowerTeams(params),
    });
};

export const usePowerTeam = (slug: string) => {
    return useQuery({
        queryKey: ['power-team', slug],
        queryFn: () => powerTeamService.getPowerTeam(slug),
        enabled: !!slug,
    });
};

export const useCreatePowerTeam = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => powerTeamService.createPowerTeam(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['power-teams'] });
            toast.success('Power Team created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create power team');
        },
    });
};

export const useJoinPowerTeam = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (slug: string) => powerTeamService.joinPowerTeam(slug),
        onSuccess: (_, slug) => {
            queryClient.invalidateQueries({ queryKey: ['power-team', slug] });
            queryClient.invalidateQueries({ queryKey: ['power-teams'] });
            toast.success('Join request sent successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to join');
        },
    });
};

export const useUpdatePowerTeamMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ slug, data }: { slug: string; data: any }) => powerTeamService.updateMember(slug, data),
        onSuccess: (_, { slug }) => {
            queryClient.invalidateQueries({ queryKey: ['power-team', slug] });
            toast.success('Member updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update member');
        },
    });
};
