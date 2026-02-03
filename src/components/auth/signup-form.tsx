'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { Button, Input, Password, Select, Text } from 'rizzui';
import { signupSchema, SignupFormData } from '@/lib/validations/auth';
import { Toast } from '../ui/toast';
import { useAuthModal } from '@/hooks/use-modal';

// Types
interface Company {
  id: string;
  name: string;
  slug: string;
  isVerified: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export default function SignupForm() {
  const router = useRouter();
  const { setMode } = useAuthModal();
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      userType: 'INDIVIDUAL',
      categoryId: '',
      companyId: '',
    },
  });

  const userType = watch('userType');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (userType === 'BUSINESS') {
      fetchCompanies();
    }
  }, [userType]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {
      Toast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch {
      Toast.error('Failed to load companies');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      Toast.success('Account created successfully! Please login.');
      setMode('login');
    } catch (err: any) {
      Toast.error(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 sm:grid-cols-2 gap-5"
    >
      {/* Full Name */}
      <div className="sm:col-span-2">
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          {...register('name')}
          error={errors.name?.message}
        />
      </div>

      {/* Username */}
      <Input
        label="Username"
        placeholder="Choose a username"
        {...register('username')}
        error={errors.username?.message}
      />

      {/* Email */}
      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        {...register('email')}
        error={errors.email?.message}
      />

      {/* Password */}
      <div className="sm:col-span-2">
        <Password
          label="Password"
          placeholder="Create a strong password"
          {...register('password')}
          error={errors.password?.message}
        />
      </div>

      {/* Account Type */}
      <Controller
        name="userType"
        control={control}
        render={({ field }) => {
          const options = [
            { label: 'Individual', value: 'INDIVIDUAL' },
            { label: 'Business', value: 'BUSINESS' },
          ];

          return (
            <Select
              label="Account Type"
              options={options}
              value={options.find(o => o.value === field.value)}
              onChange={(opt: any) => field.onChange(opt?.value)}
              error={errors.userType?.message}
              placeholder="Select account type"
            />
          );
        }}
      />

      {/* Category */}
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
              value={options.find(o => o.value === field.value)}
              onChange={(opt: any) => field.onChange(opt?.value)}
              error={errors.categoryId?.message}
              placeholder={
                loadingCategories
                  ? 'Loading categories...'
                  : 'Select your category'
              }
              disabled={loadingCategories}
            />
          );
        }}
      />

      {/* Company (Business Only) */}
      {userType === 'BUSINESS' && (
        <div className="sm:col-span-2">
          <Controller
            name="companyId"
            control={control}
            render={({ field }) => {
              const options = [
                { label: 'None – add later', value: '' },
                ...companies.map(c => ({
                  label: `${c.name}${c.isVerified ? ' ✓' : ''}`,
                  value: c.id,
                })),
              ];

              return (
                <Select
                  label="Company (Optional)"
                  options={options}
                  value={options.find(o => o.value === field.value)}
                  onChange={(opt: any) => field.onChange(opt?.value)}
                  error={errors.companyId?.message}
                  placeholder={
                    loadingCompanies
                      ? 'Loading companies...'
                      : 'Select your company'
                  }
                  disabled={loadingCompanies}
                />
              );
            }}
          />
        </div>
      )}

      {/* Submit */}
      <div className="sm:col-span-2">
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading}
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
            onClick={() => setMode('login')}
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 hover:underline transition-colors"
          >
            Login here
          </button>
        </Text>
      </div>
    </form>
  );
}
