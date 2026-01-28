'use client';

import { useState } from 'react';
import { Input, Select, Button } from 'rizzui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '@prisma/client';
import { Save } from 'lucide-react';
import { Toast } from '@/components/ui/toast';

const businessInfoSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  turnover: z.string().optional(),
  gstNumber: z.string().optional(),
  establishedYear: z.string().optional(),
  companyWebsite: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;

interface BusinessInfoTabProps {
  user: User;
}

export default function BusinessInfoTab({ user }: BusinessInfoTabProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      companyName: user.companyName || '',
      industry: user.industry || '',
      companySize: user.companySize || '',
      turnover: user.turnover || '',
      gstNumber: user.gstNumber || '',
      establishedYear: user.establishedYear || '',
      companyWebsite: user.companyWebsite || '',
    },
  });

  const onSubmit = async (data: BusinessInfoFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update business info');

      Toast.success('Business information updated successfully');
    } catch (error) {
      Toast.error('Failed to update business information');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Company Name"
          placeholder="Enter company name"
          {...register('companyName')}
          error={errors.companyName?.message}
        />

        <Input
          label="Industry"
          placeholder="e.g., Technology, Manufacturing"
          {...register('industry')}
          error={errors.industry?.message}
        />

        <Input
          label="Company Size"
          placeholder="e.g., 10-50 employees"
          {...register('companySize')}
          error={errors.companySize?.message}
        />

        <Input
          label="Annual Turnover"
          placeholder="e.g., $1M - $5M"
          {...register('turnover')}
          error={errors.turnover?.message}
        />

        <Input
          label="GST Number"
          placeholder="Enter GST number"
          {...register('gstNumber')}
          error={errors.gstNumber?.message}
        />

        <Input
          label="Established Year"
          placeholder="e.g., 2020"
          {...register('establishedYear')}
          error={errors.establishedYear?.message}
        />

        <Input
          label="Company Website"
          placeholder="https://company.com"
          className="md:col-span-2"
          {...register('companyWebsite')}
          error={errors.companyWebsite?.message}
        />
      </div>

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
