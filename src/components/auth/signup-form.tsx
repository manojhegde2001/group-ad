'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { Select, Text } from 'rizzui';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Password } from '@/components/ui/password';
import { Button } from '@/components/ui/button';
import { signupSchema, SignupFormData } from '@/lib/validations/auth';
import { Toast } from '../ui/toast';
import { useAuthModal } from '@/hooks/use-modal';
import { useSignup } from '@/hooks/use-api/use-auth';
import { useCategories } from '@/hooks/use-api/use-common';

// Types

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export default function SignupForm() {
  const router = useRouter();
  const { setMode, isOpen } = useAuthModal();

  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const signupMutation = useSignup();

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isDirty },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      userType: 'INDIVIDUAL',
      categoryId: '',
    },
  });

  const { setIsDirty } = useAuthModal();
  useEffect(() => {
    setIsDirty(isDirty);
    return () => setIsDirty(false);
  }, [isDirty, setIsDirty]);

  const userType = watch('userType');

  const onSubmit = async (data: SignupFormData) => {
    signupMutation.mutate(data, {
      onSuccess: () => {
        setMode('login');
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

      {/* Account Type */}
      <div className="sm:col-span-2 mt-2">
        <Controller
          name="userType"
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Sign up as a Business Account"
              helperText="I want to create events, posts, and access business features"
              checked={field.value === 'BUSINESS'}
              onChange={(e) => field.onChange(e.target.checked ? 'BUSINESS' : 'INDIVIDUAL')}
              className="p-4 rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-800/30 hover:bg-secondary-50 dark:hover:bg-secondary-800/80 transition-all cursor-pointer"
              labelClassName="font-bold text-secondary-900 dark:text-white cursor-pointer"
            />
          )}
        />
      </div>

      {/* Category */}
      {userType === 'BUSINESS' && (
        <div className="sm:col-span-2">
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => {
              const options = categories.map(cat => ({
                label: `${cat.icon} ${cat.name}`,
                value: cat.id,
              }));


              return (
                <Select
                  label="Category"
                  options={options}
                  value={options.find(o => o.value === field.value) ?? null}
                  onChange={(opt: any) => field.onChange(opt?.value)}
                  error={errors.categoryId?.message}
                  errorClassName="text-red-500 mt-1.5"
                  placeholder={
                    loadingCategories
                      ? 'Loading...'
                      : 'Select category'
                  }
                  disabled={loadingCategories}
                  dropdownClassName="z-[200] sm:!bg-white sm:dark:!bg-secondary-900 !bg-white dark:!bg-secondary-900 shadow-2xl border-secondary-100 dark:border-secondary-800"
                  className="w-full"
                />
              );
            }}
          />
        </div>
      )}

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
          disabled={signupMutation.isPending}
          className="w-full"
        >
          Create Account
        </Button>
      </div>

      {/* Footer */}
      <div className="sm:col-span-2">
        <Text className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => {
              if (isOpen) {
                setMode('login');
              } else {
                router.push('/login');
              }
            }}
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 hover:underline transition-colors"
          >
            Login here
          </button>
        </Text>
      </div>
    </form>
  );
}
