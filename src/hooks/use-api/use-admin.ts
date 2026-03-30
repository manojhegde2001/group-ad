import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { adminService, AdminStats } from '@/services/api/admin';
import toast from 'react-hot-toast';

export const useAdminStats = (options?: Omit<UseQueryOptions<AdminStats>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: () => adminService.getStats(),
        refetchInterval: 300000, // 5 minutes
        ...options,
    });
};

export const useAdminUsers = (params?: { page?: number; limit?: number; search?: string; type?: string; status?: string }) => {
    return useQuery({
        queryKey: ['admin', 'users', params],
        queryFn: () => adminService.getUsers(params),
    });
};

export const useAdminBusinesses = (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    return useQuery({
        queryKey: ['admin', 'businesses', params],
        queryFn: () => adminService.getBusinesses(params),
    });
};

export const useUpdateUserStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, status }: { userId: string; status: string }) =>
            adminService.updateUserStatus(userId, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
            toast.success('User status updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update user');
        },
    });
};

export const useVerificationRequests = () => {
    return useQuery({
        queryKey: ['admin', 'verification-requests'],
        queryFn: () => adminService.getVerificationRequests(),
    });
};

export const useUpdateVerificationRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            adminService.updateVerificationRequest(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'verification-requests'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
            toast.success('Verification request updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update request');
        },
    });
};

export const useReports = () => {
    return useQuery({
        queryKey: ['admin', 'reports'],
        queryFn: () => adminService.getReports(),
    });
};

export const useUpdateReport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { reportId: string; status: string; adminNote?: string }) =>
            adminService.updateReportStatus(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
            toast.success('Report updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update report');
        },
    });
};

export const useAdminAnalytics = (range: string = '30d') => {
    return useQuery({
        queryKey: ['admin', 'analytics', range],
        queryFn: () => adminService.getAnalytics(range),
    });
};

export const useCategories = () => {
    return useQuery({
        queryKey: ['admin', 'categories'],
        queryFn: () => adminService.getCategories(),
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => adminService.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
            toast.success('Category created');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create category');
        },
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => adminService.updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
            toast.success('Category updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update category');
        },
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => adminService.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
            toast.success('Category deleted');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete category');
        },
    });
};

export const useUploadCategoryBanner = () => {
    return useMutation({
        mutationFn: (formData: FormData) => adminService.uploadCategoryBanner(formData),
        onSuccess: () => {
            toast.success('Banner uploaded');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Upload failed');
        },
    });
};

export const useVenues = () => {
    return useQuery({
        queryKey: ['admin', 'venues'],
        queryFn: () => adminService.getVenues(),
    });
};

export const useCreateVenue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => adminService.createVenue(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'venues'] });
            toast.success('Venue added');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add venue');
        },
    });
};

export const useDeleteVenue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => adminService.deleteVenue(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'venues'] });
            toast.success('Venue deleted');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete venue');
        },
    });
};

export const useAdminEvents = () => {
  return useQuery({
    queryKey: ['admin', 'events'],
    queryFn: () => adminService.getAdminEvents(),
  });
};

export const useAdminNotifications = () => {
  return useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: () => adminService.getAdminNotifications(),
    refetchInterval: 60000, // Poll every minute
  });
};

export const useAdminSearch = (query: string) => {
  return useQuery({
    queryKey: ['admin', 'search', query],
    queryFn: () => adminService.getAdminSearch(query),
    enabled: query.length >= 2,
    staleTime: 300000, // 5 minutes
  });
};

export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};
