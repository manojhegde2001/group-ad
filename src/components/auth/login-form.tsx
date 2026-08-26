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

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export function LoginForm({ hideFooter, onToggle }: { hideFooter?: boolean; onToggle?: () => void } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { close, setMode, isOpen, onSuccessCallback, setIsDirty } = useAuthModal();
  const { refreshAuth } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      toast.error('Google login failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

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
        disabled={isSubmitting || isGoogleLoading}
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </Button>

      <div className="relative flex items-center justify-center my-4">
        <div className="w-full border-t border-secondary-200 dark:border-secondary-800"></div>
        <span className="absolute px-3 text-xs font-semibold text-secondary-500 bg-white dark:bg-secondary-900 uppercase tracking-wider">
          Or continue with
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        color="secondary"
        className="w-full bg-white hover:bg-secondary-50 dark:bg-transparent dark:hover:bg-secondary-800/50 border-secondary-200 dark:border-secondary-800 text-secondary-700 dark:text-secondary-200 font-semibold py-2.5 rounded-xl shadow-sm transition-all duration-200 hover:shadow active:scale-[0.98]"
        onClick={handleGoogleLogin}
        isLoading={isGoogleLoading}
        disabled={isGoogleLoading || isSubmitting}
        leftIcon={<GoogleIcon />}
      >
        Continue with Google
      </Button>

      {!hideFooter && (
        <div className="text-center pt-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
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
