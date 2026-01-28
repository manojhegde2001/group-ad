'use client';

import { useState } from 'react';
import { Input, Button } from 'rizzui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Linkedin, Twitter, Facebook, Instagram, Save } from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import { ProfileUser } from '@/types';

const socialLinksSchema = z.object({
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid URL').optional().or(z.literal('')),
  facebook: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagram: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type SocialLinksFormData = z.infer<typeof socialLinksSchema>;

interface SocialLinksTabProps {
  user: ProfileUser;
}

export default function SocialLinksTab({ user }: SocialLinksTabProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SocialLinksFormData>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: {
      linkedin: user.linkedin || '',
      twitter: user.twitter || '',
      facebook: user.facebook || '',
      instagram: user.instagram || '',
    },
  });

  const onSubmit = async (data: SocialLinksFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update social links');

      Toast.success('Social links updated successfully');
      window.location.reload();
    } catch (error) {
      Toast.error('Failed to update social links');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
      <Input
        label="LinkedIn"
        placeholder="https://linkedin.com/in/username"
        prefix={<Linkedin className="w-4 h-4 text-secondary-500" />}
        {...register('linkedin')}
        error={errors.linkedin?.message}
      />

      <Input
        label="Twitter"
        placeholder="https://twitter.com/username"
        prefix={<Twitter className="w-4 h-4 text-secondary-500" />}
        {...register('twitter')}
        error={errors.twitter?.message}
      />

      <Input
        label="Facebook"
        placeholder="https://facebook.com/username"
        prefix={<Facebook className="w-4 h-4 text-secondary-500" />}
        {...register('facebook')}
        error={errors.facebook?.message}
      />

      <Input
        label="Instagram"
        placeholder="https://instagram.com/username"
        prefix={<Instagram className="w-4 h-4 text-secondary-500" />}
        {...register('instagram')}
        error={errors.instagram?.message}
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