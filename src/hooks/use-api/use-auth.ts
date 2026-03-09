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
