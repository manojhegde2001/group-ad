'use client';

import { useState } from 'react';
import { Input, Textarea, Button, Select } from 'rizzui';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import { ProfileUser } from '@/types';
import { useUpdateProfile } from '@/hooks/use-api/use-user';

const basicInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  categoryId: z.string().optional(),
  interests: z.array(z.string()).optional(),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

interface BasicInfoTabProps {
  user: ProfileUser;
}

export default function BasicInfoTab({ user }: BasicInfoTabProps) {
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: user.name,
      username: user.username,
      bio: user.bio || '',
      phone: user.phone || '',
      location: user.location || '',
      website: user.website || '',
      categoryId: user.categoryId || '',
      interests: user.interests || [],
    },
  });

  const onSubmit = async (data: BasicInfoFormData) => {
    updateProfile.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          {...register('name')}
          error={errors.name?.message}
        />

        <Input
          label="Username"
          placeholder="Enter username"
          {...register('username')}
          error={errors.username?.message}
        />
      </div>

      <Textarea
        label="Bio"
        placeholder="Tell us about yourself"
        rows={4}
        {...register('bio')}
        error={errors.bio?.message}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Phone"
          placeholder="+91 98765 43210"
          {...register('phone')}
          error={errors.phone?.message}
        />

        <Input
          label="Location"
          placeholder="City, State"
          {...register('location')}
          error={errors.location?.message}
        />
      </div>

      <Input
        label="Website"
        placeholder="https://example.com"
        {...register('website')}
        error={errors.website?.message}
      />

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          isLoading={updateProfile.isPending}
          disabled={!isDirty || updateProfile.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </form>
  );
}