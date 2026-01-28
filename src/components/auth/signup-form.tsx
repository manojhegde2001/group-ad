'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, Input, Password, Select, Text } from 'rizzui';
import Link from 'next/link';
import { signupSchema, SignupFormData } from '@/lib/validations/auth';
import { Toast } from '../ui/toast';

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
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      userType: 'INDIVIDUAL',
    },
  });

  const userType = watch('userType');

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch companies when user selects BUSINESS
  useEffect(() => {
    if (userType === 'BUSINESS') {
      fetchCompanies();
    }
  }, [userType]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Toast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      Toast.error('Failed to load companies');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Signup failed');
      }

      Toast.success('Account created successfully! Please login.');
      router.push('/login');
    } catch (error: any) {
      Toast.error(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Name */}
      <Input
        type="text"
        label="Full Name"
        placeholder="Enter your full name"
        {...register('name')}
        error={errors.name?.message}
      />

      {/* Username */}
      <Input
        type="text"
        label="Username"
        placeholder="Choose a username"
        {...register('username')}
        error={errors.username?.message}
      />

      {/* Email */}
      <Input
        type="email"
        label="Email"
        placeholder="Enter your email"
        {...register('email')}
        error={errors.email?.message}
      />

      {/* Password */}
      <Password
        label="Password"
        placeholder="Create a strong password"
        {...register('password')}
        error={errors.password?.message}
      />

      {/* User Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Account Type
        </label>
        <Select
          options={[
            { label: 'Individual', value: 'INDIVIDUAL' },
            { label: 'Business', value: 'BUSINESS' },
          ]}
          value={userType}
          onChange={(value) => setValue('userType', value as any)}
          placeholder="Select account type"
        />
        {errors.userType && (
          <Text className="mt-1 text-sm text-red-500">
            {errors.userType.message}
          </Text>
        )}
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category
        </label>
        <Select
          options={categories.map((cat) => ({
            label: `${cat.icon} ${cat.name}`,
            value: cat.id,
          }))}
          value={watch('categoryId') || ''}
          onChange={(value:any) => setValue('categoryId', value)}
          placeholder={loadingCategories ? 'Loading categories...' : 'Select your category'}
          disabled={loadingCategories}
        />
        <Text className="mt-1 text-xs text-gray-500">
          Choose the category that best describes your profession or industry
        </Text>
        {errors.categoryId && (
          <Text className="mt-1 text-sm text-red-500">
            {errors.categoryId.message}
          </Text>
        )}
      </div>

      {/* Company Selection (only for BUSINESS users) */}
      {userType === 'BUSINESS' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company (Optional)
          </label>
          <Select
            options={[
              { label: 'None - I will add company details later', value: '' },
              ...companies.map((company) => ({
                label: `${company.name}${company.isVerified ? ' ✓' : ''}`,
                value: company.id,
              })),
            ]}
            value={watch('companyId') || ''}
            onChange={(value:any) => setValue('companyId', value)}
            placeholder={loadingCompanies ? 'Loading companies...' : 'Select your company'}
            disabled={loadingCompanies}
          />
          <Text className="mt-1 text-xs text-gray-500">
            Select if your company is already registered. ✓ indicates verified companies.
          </Text>
          {errors.companyId && (
            <Text className="mt-1 text-sm text-red-500">
              {errors.companyId.message}
            </Text>
          )}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        isLoading={isLoading}
        disabled={isLoading}
      >
        Create Account
      </Button>

      {/* Login Link */}
      <Text className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Login here
        </Link>
      </Text>
    </form>
  );
}