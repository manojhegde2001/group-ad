'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';

interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
}

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', state: '' });

  const fetchVenues = async () => {
    try {
      const res = await fetch('/api/admin/venues');
      const data = await res.json();
      setVenues(data.venues || []);
    } catch (error) {
      toast.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim() || !form.state.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success('Venue added successfully');
        setForm({ name: '', city: '', state: '' });
        fetchVenues();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to add venue');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this venue?')) return;

    try {
      const res = await fetch(`/api/admin/venues/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Venue deleted');
        fetchVenues();
      } else {
        toast.error('Failed to delete venue');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-secondary-200 dark:border-secondary-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white flex items-center gap-3">
            <MapPin className="w-8 h-8 text-orange-500" />
            Manage Venues
          </h1>
          <p className="text-secondary-500 mt-1">Add predefined event location contexts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form side */}
        <div className="md:col-span-1">
          <Card className="p-6 space-y-4 sticky top-6">
            <h3 className="font-bold text-lg text-secondary-900 dark:text-white border-b border-secondary-100 dark:border-secondary-800 pb-2">
              New Venue
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Venue Name"
                placeholder="e.g. Bombay Exhibition Center"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="City"
                placeholder="e.g. Mumbai"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
              />
              <Input
                label="State"
                placeholder="e.g. Maharashtra"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
              />
              <Button
                type="submit"
                className="w-full mt-4"
                color="primary"
                variant="solid"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
                  </>
                ) : (
                  'Save Venue'
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* List side */}
        <div className="md:col-span-2">
          <Card className="p-6 h-full min-h-[400px]">
            <h3 className="font-bold text-lg mb-4 text-secondary-900 dark:text-white border-b border-secondary-100 dark:border-secondary-800 pb-2">
              Existing Venues
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-secondary-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Loading venues...</p>
              </div>
            ) : venues.length === 0 ? (
              <div className="text-center py-20">
                <MapPin className="w-12 h-12 text-secondary-200 mx-auto mb-3" />
                <p className="text-secondary-500 font-medium">No venues added yet.</p>
                <p className="text-secondary-400 text-sm">Predefined venues will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {venues.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-secondary-100 dark:border-secondary-800 hover:border-primary-100 dark:hover:border-primary-900 transition-all group"
                  >
                    <div>
                      <p className="font-bold text-secondary-900 dark:text-white">{v.name}</p>
                      <p className="text-xs text-secondary-500 font-medium">
                        {v.city}, {v.state}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="text"
                      className="text-secondary-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDelete(v.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
