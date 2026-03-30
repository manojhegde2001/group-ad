import { apiClient } from '@/lib/api-client';

export interface AdminUser {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar: string;
    userType: 'INDIVIDUAL' | 'BUSINESS' | 'ADMIN';
    verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
    createdAt: string;
    companyName?: string;
    industry?: string;
    website?: string;
    websiteLabel?: string;
}

export interface AdminStats {
    stats: {
        totalUsers: number;
        businessUsers: number;
        individualUsers: number;
        totalPosts: number;
        totalEvents: number;
        publishedEvents: number;
        pendingReports: number;
        pendingUpgradeRequests: number;
        periodStats: {
            postsLast30: number;
        };
        trends: {
            users: string;
            posts: string;
            events: string;
        };
    };
    recentUsers: AdminUser[];
    recentPosts: any[];
}

export interface PaginatedUsers {
    users: AdminUser[];
    total: number;
    page: number;
    pages: number;
}

export const adminService = {
    getStats: () => apiClient.get<AdminStats>('/api/admin/stats'),
    
    getUsers: (params?: { page?: number; limit?: number; search?: string; type?: string; status?: string }) => {
        const query = new URLSearchParams();
        if (params?.page) query.append('page', params.page.toString());
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.search) query.append('q', params.search);
        if (params?.type) query.append('type', params.type);
        if (params?.status) query.append('status', params.status);
        const url = `/api/admin/users${query.toString() ? '?' + query.toString() : ''}`;
        return apiClient.get<PaginatedUsers>(url);
    },
    
    getBusinesses: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
        const query = new URLSearchParams();
        if (params?.page) query.append('page', params.page.toString());
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.search) query.append('q', params.search);
        if (params?.status) query.append('status', params.status);
        const url = `/api/admin/businesses${query.toString() ? '?' + query.toString() : ''}`;
        return apiClient.get(url);
    },
    
    updateUserStatus: (userId: string, data: { status: string }) =>
        apiClient.patch(`/api/admin/users/${userId}/status`, data),
    
    updateVerificationRequest: (id: string, data: { status: string }) =>
        apiClient.patch(`/api/admin/verification-requests/${id}`, data),
        
    getVerificationRequests: () =>
        apiClient.get<{ requests: any[] }>('/api/admin/verification-requests'),

    getReports: () =>
        apiClient.get<{ reports: any[] }>('/api/admin/reports'),
    
    updateReportStatus: (data: { reportId: string; status: string; adminNote?: string }) =>
        apiClient.patch(`/api/admin/reports/${data.reportId}`, data),

    getAnalytics: (range: string = '30d') =>
        apiClient.get<any>(`/api/admin/analytics?range=${range}`),

    getCategories: () =>
        apiClient.get<{ categories: any[] }>('/api/admin/categories'),

    createCategory: (data: any) =>
        apiClient.post('/api/admin/categories', data),

    updateCategory: (id: string, data: any) =>
        apiClient.patch(`/api/admin/categories/${id}`, data),

    deleteCategory: (id: string) =>
        apiClient.delete(`/api/admin/categories/${id}`),

    uploadCategoryBanner: (formData: FormData) =>
        apiClient.post<{ bannerUrl: string }>('/api/admin/categories/upload-banner', formData),

    getVenues: () =>
        apiClient.get<{ venues: any[] }>('/api/admin/venues'),

    createVenue: (data: any) =>
        apiClient.post('/api/admin/venues', data),

    deleteVenue: (id: string) =>
        apiClient.delete(`/api/admin/venues/${id}`),

    getAdminEvents: () =>
        apiClient.get<{ events: any[] }>('/api/events?all=true'),

    getAdminNotifications: () =>
        apiClient.get<{ notifications: any[]; count: number }>('/api/admin/notifications'),

    getAdminSearch: (query: string) =>
        apiClient.get<{ results: any[] }>(`/api/admin/search?q=${encodeURIComponent(query)}`),

    updateUser: (id: string, data: any) =>
        apiClient.patch<AdminUser>(`/api/admin/users/${id}`, data),
};
