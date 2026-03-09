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
    return useQuery<{ user: any }>({
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
