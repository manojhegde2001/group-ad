'use client';

import { useState } from 'react';
import { Input, Button } from 'rizzui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '@prisma/client';
import { Linkedin, Twitter, Facebook, Instagram, Save } from 'lucide-react';
import { Toast } from '@/components/ui/toast';

const socialLinksSchema = z.object({
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid URL').optional().or(z.literal('')),
  facebook: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagram: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type SocialLinksFormData = z.infer<typeof socialLinksSchema>;

interface SocialLinksTabProps {
  user: User;
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
    } catch (error) {
      Toast.error('Failed to update social links');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
      <div className="space-y-4">
        <Input
          label="LinkedIn Profile"
          placeholder="https://linkedin.com/in/username"
          prefix={<Linkedin className="w-4 h-4 text-blue-600" />}
          {...register('linkedin')}
          error={errors.linkedin?.message}
        />

        <Input
          label="Twitter Profile"
          placeholder="https://twitter.com/username"
          prefix={<Twitter className="w-4 h-4 text-sky-500" />}
          {...register('twitter')}
          error={errors.twitter?.message}
        />

        <Input
          label="Facebook Profile"
          placeholder="https://facebook.com/username"
          prefix={<Facebook className="w-4 h-4 text-blue-700" />}
          {...register('facebook')}
          error={errors.facebook?.message}
        />

        <Input
          label="Instagram Profile"
          placeholder="https://instagram.com/username"
          prefix={<Instagram className="w-4 h-4 text-pink-600" />}
          {...register('instagram')}
          error={errors.instagram?.message}
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
