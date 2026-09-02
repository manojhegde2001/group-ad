import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/api/auth';
import toast from 'react-hot-toast';

export const useSignup = () => {
    return useMutation({
        mutationFn: (data: any) => authService.signup(data),
        onSuccess: () => {
            toast.success('Account created! Check your email to verify your account.');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Signup failed');
        },
    });
};

export const useResendVerification = () => {
    return useMutation({
        mutationFn: (data: { email: string }) => authService.resendVerification(data),
        onSuccess: () => {
            toast.success('If that account still needs verification, a new link is on its way.');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to resend verification email');
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
