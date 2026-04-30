import { apiClient } from '@/lib/api-client';

export const powerTeamService = {
    getPowerTeams: (params: Record<string, any> = {}) => {
        const searchParams = new URLSearchParams(params);
        return apiClient.get<any>(`/api/power-teams?${searchParams.toString()}`);
    },
    getPowerTeam: (slug: string) => apiClient.get<any>(`/api/power-teams/${slug}`),
    createPowerTeam: (data: any) => apiClient.post<any>('/api/power-teams', data),
    updatePowerTeam: (slug: string, data: any) => apiClient.patch<any>(`/api/power-teams/${slug}`, data),
    deletePowerTeam: (slug: string) => apiClient.delete<any>(`/api/power-teams/${slug}`),
    
    joinPowerTeam: (id: string) => apiClient.post<any>(`/api/power-teams/${id}/members`),
    updateMember: (id: string, data: any) => apiClient.patch<any>(`/api/power-teams/${id}/members`, data),
    removeMember: (id: string, memberId: string) => apiClient.delete<any>(`/api/power-teams/${id}/members`, { body: JSON.stringify({ memberId }) }),
};
