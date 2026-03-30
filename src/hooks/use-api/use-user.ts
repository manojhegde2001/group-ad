import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/api/user';
import toast from 'react-hot-toast';

export const useProfile = () => {
    return useQuery({
        queryKey: ['profile'],
        queryFn: () => userService.getProfile(),
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => userService.updateProfile(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['me'] });
            toast.success('Profile updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update profile');
        },
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: (data: any) => userService.changePassword(data),
        onSuccess: () => {
            toast.success('Password changed successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to change password');
        },
    });
};

export const useMe = () => {
    return useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const response = await userService.getMe();
            return response.user;
        },
    });
};

export const useUpgradeToBusiness = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data?: any) => userService.upgradeToBusiness(data),
        onSuccess: () => {
            toast.success('Account upgraded to business successfully');
            queryClient.invalidateQueries({ queryKey: ['me'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to upgrade account');
        },
    });
};

export const useUserByUsername = (username: string) => {
    return useQuery<any>({
        queryKey: ['user', username],
        queryFn: () => userService.getByUsername(username),
        enabled: !!username,
    });
};
export const useUploadAvatar = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (formData: FormData) => userService.uploadAvatar(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Profile picture updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to upload image');
        },
    });
};
export const useFollowing = () => {
    return useQuery({
        queryKey: ['users', 'following'],
        queryFn: () => userService.getFollowing(),
    });
};

export const useTypeChangeRequest = () => {
    return useQuery({
        queryKey: ['user', 'type-change-request'],
        queryFn: () => userService.getTypeChangeRequest(),
    });
};

export const useSubmitTypeChangeRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => userService.submitTypeChangeRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'type-change-request'] });
            toast.success('Request submitted successfully');
            // We might want to reload or redirect, but let the component decide if needed.
            // For now, just success message.
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to submit request');
        },
    });
};

export const useFollowUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => userService.followUser(userId),
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            queryClient.invalidateQueries({ queryKey: ['user', userId] });
            queryClient.invalidateQueries({ queryKey: ['users', 'following'] });
            toast.success('Followed successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to follow user');
        },
    });
};
