import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthModal } from '@/hooks/use-modal';
import { useAuth } from '@/hooks/use-auth';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import toast from 'react-hot-toast';
import { Input } from '../ui/input';
import { Password } from '../ui/password';
import { Button } from '../ui/button';
import Link from 'next/link';

export function LoginForm({ hideFooter, onToggle }: { hideFooter?: boolean; onToggle?: () => void } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { close, setMode, isOpen, onSuccessCallback, setIsDirty } = useAuthModal();
  const { refreshAuth } = useAuth();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  useEffect(() => {
    const identifier = searchParams.get('identifier');
    if (identifier) {
      setValue('identifier', identifier);
    }
  }, [searchParams, setValue]);

  useEffect(() => {
    setIsDirty(isDirty);
    return () => setIsDirty(false);
  }, [isDirty, setIsDirty]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await signIn('credentials', {
        identifier: data.identifier,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email/phone or password');
        return;
      }

      if (result?.ok) {
        toast.success('Login successful! 🎉');

        // Refresh auth state
        await refreshAuth();

        // Close modal
        close();
        if (onSuccessCallback) onSuccessCallback();

        // Navigate to landing page
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md mx-auto">
      <Controller
        name="identifier"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            type="text"
            label="Email or Phone Number"
            placeholder="Enter your email or phone number"
            error={errors.identifier?.message}
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

      <div className="flex justify-end -mt-3">
        <Link 
          href="/auth/forgot-password" 
          onClick={close}
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          Forgot Password?
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full"
        isLoading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </Button>

      {!hideFooter && (
        <div className="text-center pt-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => {
                if (onToggle) {
                  onToggle();
                } else if (isOpen) {
                  setMode('signup');
                } else {
                  router.push('/auth?mode=signup');
                }
              }}
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>
      )}
    </form>
  );
}
