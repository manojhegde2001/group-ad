'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function AdminSettingsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (!loading && (!isAuthenticated || (user as any)?.userType !== 'ADMIN')) {
    redirect('/admin/login');
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 border-b border-secondary-200 dark:border-secondary-800 pb-6">
        <div className="p-3 bg-secondary-100 dark:bg-secondary-800 rounded-2xl text-secondary-600 dark:text-secondary-400">
          <SettingsIcon className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
            Platform Settings
          </h1>
          <p className="text-secondary-500 mt-1">Configure global application variables and controls.</p>
        </div>
      </div>

      <Card className="p-6 space-y-6">
         <h3 className="font-bold text-lg text-secondary-900 dark:text-white border-b border-secondary-100 dark:border-secondary-800 pb-2">Registrations & Upgrades</h3>
         
         <div className="flex items-center justify-between">
            <div>
               <p className="font-semibold text-secondary-900 dark:text-white">Allow new Individual Registrations</p>
               <p className="text-sm text-secondary-500">When disabled, new users cannot sign up.</p>
            </div>
            <Switch defaultChecked />
         </div>

         <div className="flex items-center justify-between">
            <div>
               <p className="font-semibold text-secondary-900 dark:text-white">Require Admin Approval for Businesses</p>
               <p className="text-sm text-secondary-500">When enabled, business signups must be verified manually.</p>
            </div>
            <Switch defaultChecked />
         </div>
      </Card>
      
      <Card className="p-6 space-y-6">
         <h3 className="font-bold text-lg text-secondary-900 dark:text-white border-b border-secondary-100 dark:border-secondary-800 pb-2">Maintenance</h3>
         
         <div className="flex items-center justify-between">
            <div>
               <p className="font-semibold text-red-600 dark:text-red-400">Maintenance Mode</p>
               <p className="text-sm text-secondary-500">Temporarily block access to all non-admin users.</p>
            </div>
            <Switch />
         </div>
      </Card>
    </div>
  );
}
