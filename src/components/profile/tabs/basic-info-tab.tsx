'use client';

import { useState } from 'react';
import { Input, Textarea, Button, Select } from 'rizzui';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '@prisma/client';
import { Save } from 'lucide-react';
import { Toast } from '@/components/ui/toast';

const basicInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  category: z.string().optional(),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

interface BasicInfoTabProps {
  user: User;
}

export default function BasicInfoTab({ user }: BasicInfoTabProps) {
  const [isLoading, setIsLoading] = useState(false);

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
      category: user.category || '',
    },
  });

  const onSubmit = async (data: BasicInfoFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      Toast.success('Profile updated successfully');
    } catch (error) {
      Toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
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
          prefix="@"
          {...register('username')}
          error={errors.username?.message}
        />

        <Input
          label="Phone Number"
          placeholder="+1 234 567 8900"
          {...register('phone')}
          error={errors.phone?.message}
        />

        <Input
          label="Location"
          placeholder="City, Country"
          {...register('location')}
          error={errors.location?.message}
        />

        <Input
          label="Website"
          placeholder="https://example.com"
          {...register('website')}
          error={errors.website?.message}
        />

        <Input
          label="Category"
          placeholder="e.g., Technology, Healthcare"
          {...register('category')}
          error={errors.category?.message}
        />
      </div>

      <Textarea
        label="Bio"
        placeholder="Tell us about yourself..."
        rows={4}
        {...register('bio')}
        error={errors.bio?.message}
      />

      <div className="flex justify-end">
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!isDirty}
          className="min-w-[120px]"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </form>
  );
}
