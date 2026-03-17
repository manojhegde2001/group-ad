'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

export default function AdminBusinessesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (!loading && (!isAuthenticated || (user as any)?.userType !== 'ADMIN')) {
    redirect('/');
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
          Business Approvals
        </h1>
        <p className="text-secondary-500 mt-1">Review, approve, or reject business registrations.</p>
      </div>

      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4 text-green-600 dark:text-green-400">Pending Approvals</h3>
        <p className="text-sm text-secondary-500 bg-secondary-50 dark:bg-secondary-800 p-4 rounded-xl border border-secondary-100 dark:border-secondary-700">
          No pending businesses waiting for approval.
        </p>

        {/* Example entry layout 
        <div className="flex items-center justify-between p-4 mt-4 border border-secondary-200 dark:border-secondary-800 rounded-xl">
           <div>
              <p className="font-bold">Group Ad Media LLP</p>
              <p className="text-sm text-secondary-500">Requested by: Manoj Hegde</p>
           </div>
           <div className="flex items-center gap-2">
              <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><Check className="w-5 h-5"/></button>
              <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X className="w-5 h-5"/></button>
           </div>
        </div>
        */}
      </Card>
      
      <Card className="p-6 mt-6">
         <h3 className="font-bold text-lg mb-4 text-secondary-900 dark:text-white">Verified Businesses</h3>
         <p className="text-secondary-500 text-sm">Table rendering the verified businesses.</p>
      </Card>
    </div>
  );
}
