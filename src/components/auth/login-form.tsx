'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuthModal } from '@/hooks/use-modal';
import { useAuth } from '@/hooks/use-auth';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import toast from 'react-hot-toast';
import { Input } from '../ui/input';
import { Password } from '../ui/password';
import { Button } from '../ui/button';

export function LoginForm() {
  const router = useRouter();
  const { close, setMode, onSuccessCallback } = useAuthModal();
  const { refreshAuth } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
        return;
      }

      if (result?.ok) {
        toast.success('Login successful! 🎉');

        // Refresh auth state
        await refreshAuth();

        // Close modal
        close();
        if (onSuccessCallback) onSuccessCallback();

        // Navigate to profile
        router.push('/profile');
        router.refresh();
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md mx-auto">
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            type="email"
            label="Email"
            placeholder="Enter your email"
            error={errors.email?.message}
            className="w-full"
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <Password
            {...field}
            label="Password"
            placeholder="Enter your password"
            error={errors.password?.message}
            className="w-full"
          />
        )}
      />

      <Button
        type="submit"
        className="w-full"
        isLoading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </Button>

      <div className="text-center pt-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => setMode('signup')}
            className="text-primary-600 dark:text-primary-400 hover:underline font-medium transition-colors"
          >
            Sign up
          </button>
        </p>
      </div>
    </form>
  );
}
