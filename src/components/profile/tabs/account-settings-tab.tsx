'use client';

import { useState } from 'react';
import { Select, Switch, Button, Text } from 'rizzui';
import { User } from '@prisma/client';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { Toast } from '@/components/ui/toast';

interface AccountSettingsTabProps {
  user: User;
}

export default function AccountSettingsTab({ user }: AccountSettingsTabProps) {
  const [visibility, setVisibility] = useState(user.visibility);
  const [isLoading, setIsLoading] = useState(false);

  const handleVisibilityChange = async (newVisibility: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: newVisibility }),
      });

      if (!response.ok) throw new Error('Failed to update settings');

      setVisibility(newVisibility as any);
      Toast.success('Account visibility updated');
    } catch (error) {
      Toast.error('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Account Visibility */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          {visibility === 'PUBLIC' ? (
            <Eye className="w-5 h-5 text-secondary-600" />
          ) : (
            <EyeOff className="w-5 h-5 text-secondary-600" />
          )}
          <Text className="font-semibold text-lg">Account Visibility</Text>
        </div>
        <div className="space-y-4">
          <div
            onClick={() => handleVisibilityChange('PUBLIC')}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              visibility === 'PUBLIC'
                ? 'border-primary bg-primary-50 dark:bg-primary-900/10'
                : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-secondary-900 dark:text-white">Public Profile</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                  Your profile is visible to everyone
                </p>
              </div>
              {visibility === 'PUBLIC' && (
                <Shield className="w-5 h-5 text-primary" />
              )}
            </div>
          </div>

          <div
            onClick={() => handleVisibilityChange('PRIVATE')}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              visibility === 'PRIVATE'
                ? 'border-primary bg-primary-50 dark:bg-primary-900/10'
                : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-secondary-900 dark:text-white">Private Profile</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                  Only you can see your profile
                </p>
              </div>
              {visibility === 'PRIVATE' && (
                <Shield className="w-5 h-5 text-primary" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Type Badge */}
      <div className="border-t border-secondary-200 dark:border-secondary-700 pt-6">
        <Text className="font-semibold text-lg mb-3">Account Type</Text>
        <div className="p-4 bg-secondary-50 dark:bg-secondary-900/50 rounded-lg">
          <p className="text-secondary-900 dark:text-white font-medium">
            {user.userType} Account
          </p>
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
            {user.userType === 'BUSINESS'
              ? 'You have access to business features and analytics'
              : 'Upgrade to business account for additional features'}
          </p>
        </div>
      </div>
    </div>
  );
}
