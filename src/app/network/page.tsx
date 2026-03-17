'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Users, Plus, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BusinessNetworkPage() {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (!loading && (!isAuthenticated || (user as any)?.userType === 'INDIVIDUAL')) {
    redirect('/'); // Only businesses and admins
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-secondary-200 dark:border-secondary-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
             <Users className="w-8 h-8 text-blue-600" />
            Power Team Network
          </h1>
          <p className="text-secondary-500 mt-1">Create and manage your exclusive business teams.</p>
        </div>
        <Button 
          color="primary" 
          variant="solid" 
          leftIcon={<Plus className="w-4 h-4"/>}
        >
          Create Power Team
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Form Action Box (Simulation of Creation) */}
         <Card className="p-6 md:col-span-1 border-blue-100 dark:border-blue-900 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-secondary-900 dark:text-white pb-2 flex items-center gap-2">
               New Team
            </h3>
            <Input label="Team Name" placeholder="e.g. Media Partners Group" />
            
            <div className="space-y-1">
               <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Select Businesses to Add
               </label>
               <Input placeholder="Search business names..." />
               <p className="text-xs text-secondary-400 mt-1">Search and select registered business entities.</p>
            </div>
            
            <Button className="w-full mt-4" color="primary" variant="solid">Create Team</Button>
         </Card>

         {/* Existing Teams Box */}
         <Card className="p-6 md:col-span-2 shadow-sm border-secondary-100">
            <h3 className="font-bold text-lg mb-4 text-secondary-900 dark:text-white border-b border-secondary-100 dark:border-secondary-800 pb-2">Your Power Teams</h3>
            
            <div className="flex flex-col items-center justify-center py-12 text-center text-secondary-500 gap-3 bg-secondary-50 dark:bg-secondary-900 rounded-2xl border border-secondary-200 dark:border-secondary-800 border-dashed">
               <ShieldAlert className="w-10 h-10 text-secondary-300" />
               <p>You haven't created any Power Teams yet.</p>
            </div>
         </Card>
      </div>
    </div>
  );
}
