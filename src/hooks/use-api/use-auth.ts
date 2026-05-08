import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/api/auth';
import toast from 'react-hot-toast';

export const useSignup = () => {
    return useMutation({
        mutationFn: (data: any) => authService.signup(data),
        onSuccess: () => {
            toast.success('Account created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Signup failed');
        },
    });
};

export const useForgotPassword = () => {
    return useMutation({
        mutationFn: (data: { email: string }) => authService.forgotPassword(data),
        onSuccess: () => {
            toast.success('Reset link sent to your email');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to send reset link');
        },
    });
};

export const useResetPassword = () => {
    return useMutation({
        mutationFn: (data: any) => authService.resetPassword(data),
        onSuccess: () => {
            toast.success('Password reset successfully! 🎉');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to reset password');
        },
    });
};
