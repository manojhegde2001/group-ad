'use client';

import { useState } from 'react';
import { Select, Switch, Button, Text } from 'rizzui';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import { ProfileUser } from '@/types';

interface AccountSettingsTabProps {
  user: ProfileUser;
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
      window.location.reload();
    } catch (error) {
      Toast.error('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Profile Visibility */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
          <Text className="text-lg font-semibold text-secondary-900 dark:text-white">
            Profile Visibility
          </Text>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleVisibilityChange('PUBLIC')}
            disabled={isLoading}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              visibility === 'PUBLIC'
                ? 'border-primary bg-primary/5'
                : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5" />
                <div>
                  <Text className="font-semibold">Public Profile</Text>
                  <Text className="text-sm text-secondary-600 dark:text-secondary-400">
                    Your profile is visible to everyone
                  </Text>
                </div>
              </div>
              {visibility === 'PUBLIC' && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </div>
          </button>

          <button
            onClick={() => handleVisibilityChange('PRIVATE')}
            disabled={isLoading}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              visibility === 'PRIVATE'
                ? 'border-primary bg-primary/5'
                : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <EyeOff className="w-5 h-5" />
                <div>
                  <Text className="font-semibold">Private Profile</Text>
                  <Text className="text-sm text-secondary-600 dark:text-secondary-400">
                    Only you can see your profile
                  </Text>
                </div>
              </div>
              {visibility === 'PRIVATE' && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Account Type */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
          <Text className="text-lg font-semibold text-secondary-900 dark:text-white">
            Account Type
          </Text>
        </div>

        <div className="p-4 bg-secondary-50 dark:bg-secondary-900 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <Text className="font-semibold text-secondary-900 dark:text-white mb-1">
                {user.userType} Account
              </Text>
              <Text className="text-sm text-secondary-600 dark:text-secondary-400">
                {user.userType === 'BUSINESS'
                  ? 'You have access to business features and analytics'
                  : 'Upgrade to business account for additional features'}
              </Text>
            </div>
            {user.userType === 'INDIVIDUAL' && (
              <Button size="sm" variant="outline">
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Verification Status */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
          <Text className="text-lg font-semibold text-secondary-900 dark:text-white">
            Verification Status
          </Text>
        </div>

        <div
          className={`p-4 rounded-lg ${
            user.verificationStatus === 'VERIFIED'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : user.verificationStatus === 'PENDING'
              ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
              : 'bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700'
          }`}
        >
          <Text
            className={`font-semibold mb-1 ${
              user.verificationStatus === 'VERIFIED'
                ? 'text-green-700 dark:text-green-300'
                : user.verificationStatus === 'PENDING'
                ? 'text-orange-700 dark:text-orange-300'
                : 'text-secondary-900 dark:text-white'
            }`}
          >
            {user.verificationStatus}
          </Text>
          <Text className="text-sm text-secondary-600 dark:text-secondary-400">
            {user.verificationStatus === 'VERIFIED'
              ? 'Your account is verified'
              : user.verificationStatus === 'PENDING'
              ? 'Your verification request is under review'
              : 'Request verification to get verified badge'}
          </Text>
          {user.verificationStatus === 'UNVERIFIED' && (
            <Button size="sm" className="mt-3">
              Request Verification
            </Button>
          )}
        </div>
      </div>

      {/* Profile Completion */}
      {!user.isProfileCompleted && (
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <Text className="font-semibold text-orange-700 dark:text-orange-300 mb-1">
            Complete Your Profile
          </Text>
          <Text className="text-sm text-orange-600 dark:text-orange-400">
            Fill in all required information to complete your profile
          </Text>
        </div>
      )}
    </div>
  );
}