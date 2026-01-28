'use client';

import { useState } from 'react';
import { Input, Select, Button } from 'rizzui';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import { ProfileUser } from '@/types';

const businessInfoSchema = z.object({
  companyName: z.string().min(2, 'Company name is required').optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  turnover: z.string().optional(),
  gstNumber: z.string().optional(),
  establishedYear: z.string().optional(),
  companyWebsite: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;

interface BusinessInfoTabProps {
  user: ProfileUser;
}

export default function BusinessInfoTab({ user }: BusinessInfoTabProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      industry: user.industry || '',
      companySize: user.companySize || '',
      turnover: user.turnover || '',
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
      window.location.reload();
    } catch (error) {
      Toast.error('Failed to update business information');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
      {/* Company Info */}
      {user.company && (
        <div className="bg-secondary-50 dark:bg-secondary-900 rounded-lg p-4 mb-4">
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
            Linked Company
          </p>
          <p className="font-semibold text-secondary-900 dark:text-white">
            {user.company.name}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Industry"
          placeholder="e.g., Technology, Healthcare"
          {...register('industry')}
          error={errors.industry?.message}
        />

        <Controller
          name="companySize"
          control={control}
          render={({ field }) => (
            <Select
              label="Company Size"
              value={field.value}
              onChange={field.onChange}
              options={[
                { label: '1-10 employees', value: '1-10' },
                { label: '11-50 employees', value: '11-50' },
                { label: '51-200 employees', value: '51-200' },
                { label: '201-500 employees', value: '201-500' },
                { label: '501-1000 employees', value: '501-1000' },
                { label: '1000+ employees', value: '1000+' },
              ]}
              error={errors.companySize?.message}
            />
          )}
        />
      </div>

      <Controller
        name="turnover"
        control={control}
        render={({ field }) => (
          <Select
            label="Annual Turnover"
            value={field.value}
            onChange={field.onChange}
            options={[
              { label: 'Less than 1 Cr', value: '<1cr' },
              { label: '1-5 Cr', value: '1-5cr' },
              { label: '5-10 Cr', value: '5-10cr' },
              { label: '10-50 Cr', value: '10-50cr' },
              { label: '50-100 Cr', value: '50-100cr' },
              { label: '100+ Cr', value: '100+cr' },
            ]}
            error={errors.turnover?.message}
          />
        )}
      />

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!isDirty || isLoading}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </form>
  );
}