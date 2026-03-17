'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';

export default function AdminUsersPage() {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (!loading && (!isAuthenticated || (user as any)?.userType !== 'ADMIN')) {
    redirect('/');
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
          User Management
        </h1>
        <p className="text-secondary-500 mt-1">Manage individuals, businesses, and review account requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Users List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 h-96 flex items-center justify-center">
             <p className="text-secondary-500">Users table component will be rendered here.</p>
          </Card>
        </div>

        {/* Upgrade Requests Sidebar */}
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 text-purple-600 dark:text-purple-400">Upgrade Requests</h3>
            <p className="text-sm text-secondary-500 bg-secondary-50 dark:bg-secondary-800 p-4 rounded-xl border border-secondary-100 dark:border-secondary-700">
              No pending requests to upgrade to Business profile.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
