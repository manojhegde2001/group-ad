'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, Trash2, Loader2, Plus, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useVenues, useCreateVenue, useDeleteVenue } from '@/hooks/use-api/use-admin';

interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
}

export default function AdminVenuesPage() {
  const [form, setForm] = useState({ name: '', city: '', state: '' });

  // Queries
  const { data, isLoading } = useVenues();
  const venues = data?.venues || [];

  // Mutations
  const createMutation = useCreateVenue();
  const deleteMutation = useDeleteVenue();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form, {
      onSuccess: () => setForm({ name: '', city: '', state: '' })
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this venue?')) return;
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-secondary-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <p className="font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Scanning locations...</p>
      </div>
    );
  }

  const isSubmitting = createMutation.isPending;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-secondary-50 dark:border-secondary-900/60 pb-10">
        <div>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-rose-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-orange-500/20 ring-4 ring-orange-500/10">
              <MapPin className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-secondary-900 dark:text-white tracking-tighter uppercase leading-none mb-2">
                Venue <span className="text-orange-500 italic">Registry</span>
              </h1>
              <p className="text-secondary-400 text-[10px] font-black uppercase tracking-[0.3em]">Configure platform event nodes and locales</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-2 border-secondary-50 dark:border-secondary-800 rounded-2xl flex items-center gap-4 shadow-sm">
            <Globe className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary-500">{venues.length} Logged Sites</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Form side */}
        <div className="lg:col-span-1">
          <Card className="p-8 border-2 border-secondary-50 dark:border-secondary-800 bg-white dark:bg-slate-900/50 rounded-[2.5rem] shadow-sm backdrop-blur-xl sticky top-24">
            <h3 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter mb-8 leading-none">
              Register <span className="text-orange-500 italic">Site</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Site Identity"
                placeholder="e.g. Bombay Exhibition Center"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="rounded-2xl"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Metropolis"
                    placeholder="e.g. Mumbai"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                    className="rounded-2xl"
                />
                <Input
                    label="Province"
                    placeholder="e.g. MH"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    required
                    className="rounded-2xl"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 mt-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-orange-500/10 border-b-4 border-orange-700 hover:bg-orange-600 transition-all active:scale-95"
                color="primary"
                variant="solid"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" /> Commit Entry
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* List side */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter mb-8 leading-none">
            Active <span className="text-orange-500 italic">Nodes</span>
          </h3>

          {venues.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/50 rounded-[3.5rem] border-2 border-secondary-50 dark:border-secondary-800 p-20 text-center flex flex-col items-center backdrop-blur-xl">
              <div className="w-20 h-20 rounded-[2.5rem] bg-secondary-50 dark:bg-secondary-800/50 flex items-center justify-center mb-6">
                <MapPin className="w-10 h-10 text-secondary-200 dark:text-secondary-700" />
              </div>
              <h3 className="text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter mb-2">Unmapped Territory</h3>
              <p className="text-secondary-400 font-bold uppercase text-[10px] tracking-[0.2em]">Start by registering your first site identity.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {venues.map((v: Venue) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-secondary-50 dark:border-secondary-800 hover:border-orange-500/20 hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-secondary-50 dark:bg-secondary-800/50 flex items-center justify-center text-secondary-300 group-hover:bg-orange-500/10 group-hover:text-orange-500 transition-all duration-300">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-secondary-900 dark:text-white uppercase tracking-tight leading-tight mb-1">{v.name}</p>
                      <p className="text-[10px] text-secondary-400 font-black uppercase tracking-widest">
                        {v.city} <span className="text-secondary-200 dark:text-secondary-700 mx-1">/</span> {v.state}
                      </p>
                    </div>
                  </div>
                  <button
                    className="w-10 h-10 rounded-xl bg-secondary-50 dark:bg-secondary-800/50 text-secondary-400 hover:bg-red-500 hover:text-white transition-all active:scale-90 flex items-center justify-center border-2 border-transparent"
                    onClick={() => handleDelete(v.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
