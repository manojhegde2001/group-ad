'use client';

import { Card } from '@/components/ui/card';
import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminVenuesPage() {
  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-secondary-200 dark:border-secondary-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white flex items-center gap-3">
             <MapPin className="w-8 h-8 text-orange-500" />
            Manage Venues
          </h1>
          <p className="text-secondary-500 mt-1">Add predefined event location contexts (State, City).</p>
        </div>
        <Button 
          color="primary" 
          variant="solid" 
          leftIcon={<Plus className="w-4 h-4"/>}
        >
          Add Venue
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Form side */}
         <Card className="p-6 md:col-span-1 space-y-4">
            <h3 className="font-bold text-lg text-secondary-900 dark:text-white border-b border-secondary-100 dark:border-secondary-800 pb-2">New Venue</h3>
            <Input label="Venue Name" placeholder="e.g. Bombay Exhibition Center" />
            <Input label="City" placeholder="e.g. Mumbai" />
            <Input label="State" placeholder="e.g. Maharashtra" />
            <Button className="w-full mt-4" color="primary" variant="solid">Save Venue</Button>
         </Card>

         {/* List side */}
         <Card className="p-6 md:col-span-2">
            <h3 className="font-bold text-lg mb-4 text-secondary-900 dark:text-white border-b border-secondary-100 dark:border-secondary-800 pb-2">Existing Venues</h3>
            <p className="text-secondary-500 text-sm py-4">No venues added yet.</p>
         </Card>
      </div>
    </div>
  );
}
