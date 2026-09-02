'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { Text } from 'rizzui';
import { Input } from '@/components/ui/input';
import { Password } from '@/components/ui/password';
import { Button } from '@/components/ui/button';
import { signupSchema, SignupFormData } from '@/lib/validations/auth';
import { useAuthModal } from '@/hooks/use-modal';
import { useSignup } from '@/hooks/use-api/use-auth';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';


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

export default function SignupForm({ hideFooter, onToggle }: { hideFooter?: boolean; onToggle?: () => void } = {}) {
  const router = useRouter();
  const { setMode, isOpen, close } = useAuthModal();

  const signupMutation = useSignup();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      toast.error('Google signup failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const {
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
    },
  });

  const { setIsDirty } = useAuthModal();
  useEffect(() => {
    setIsDirty(isDirty);
    return () => setIsDirty(false);
  }, [isDirty, setIsDirty]);

  const onSubmit = async (data: SignupFormData) => {
    signupMutation.mutate(data, {
      onSuccess: () => {
        close();
        router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 sm:grid-cols-2 gap-5"
    >
      {/* Full Name */}
      <div className="sm:col-span-2">
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              {...field}
              error={errors.name?.message}
            />
          )}
        />
      </div>

      {/* Username */}
      <Controller
        name="username"
        control={control}
        render={({ field }) => (
          <Input
            label="Username"
            placeholder="Choose a username"
            {...field}
            error={errors.username?.message}
          />
        )}
      />

      {/* Email */}
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            {...field}
            error={errors.email?.message}
          />
        )}
      />

      {/* Password */}
      <div className="sm:col-span-2">
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Password
              label="Password"
              placeholder="Create a strong password"
              {...field}
              error={errors.password?.message}
            />
          )}
        />
      </div>

      {/* Legal Consent */}
      <div className="sm:col-span-2">
        <Text className="text-xs text-secondary-500 dark:text-secondary-400 text-center leading-relaxed">
          By creating an account, you agree to our{' '}
          <Link href="/terms" tabIndex={-1} target="_blank" className="font-bold text-secondary-700 dark:text-secondary-200 hover:text-primary-600 transition-colors">Terms & Conditions</Link>
          {' '}and{' '}
          <Link href="/privacy-policy" tabIndex={-1} target="_blank" className="font-bold text-secondary-700 dark:text-secondary-200 hover:text-primary-600 transition-colors">Privacy Policy</Link>.
        </Text>
      </div>

      {/* Submit */}
      <div className="sm:col-span-2">
        <Button
          type="submit"
          isLoading={signupMutation.isPending}
          disabled={signupMutation.isPending || isGoogleLoading}
          className="w-full"
        >
          Create Account
        </Button>
      </div>

      {/* Google Sign Up */}
      <div className="sm:col-span-2">
        <div className="relative flex items-center justify-center my-2">
          <div className="w-full border-t border-secondary-200 dark:border-secondary-800"></div>
          <span className="absolute px-3 text-xs font-semibold text-secondary-500 bg-white dark:bg-secondary-900 uppercase tracking-wider">
            Or continue with
          </span>
        </div>
      </div>

      <div className="sm:col-span-2">
        <Button
          type="button"
          variant="outline"
          color="secondary"
          className="w-full bg-white hover:bg-secondary-50 dark:bg-transparent dark:hover:bg-secondary-800/50 border-secondary-200 dark:border-secondary-800 text-secondary-700 dark:text-secondary-200 font-semibold py-2.5 rounded-xl shadow-sm transition-all duration-200 hover:shadow active:scale-[0.98]"
          onClick={handleGoogleLogin}
          isLoading={isGoogleLoading}
          disabled={isGoogleLoading || signupMutation.isPending}
          leftIcon={<GoogleIcon />}
        >
          Sign up with Google
        </Button>
      </div>

      {/* Footer */}
      {!hideFooter && (
        <div className="sm:col-span-2">
          <Text className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                if (onToggle) {
                  onToggle();
                } else if (isOpen) {
                  setMode('login');
                } else {
                  router.push('/auth');
                }
              }}
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 hover:underline transition-colors"
            >
              Login here
            </button>
          </Text>
        </div>
      )}
    </form>
  );
}
