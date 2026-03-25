'use client';

import { useState, useEffect } from 'react';
import { X, Save, User, Mail, Shield, Tags, Ban, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';

interface UserEditModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function UserEditModal({ user, isOpen, onClose, onRefresh }: UserEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    userType: '',
    categoryId: '',
    verificationStatus: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        userType: user.userType || 'INDIVIDUAL',
        categoryId: user.categoryId || 'NONE',
        verificationStatus: user.verificationStatus || 'UNVERIFIED',
      });
    }
  }, [user]);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const result = await res.json();
      if (res.ok) {
        toast.success('User updated successfully');
        onRefresh();
        onClose();
      } else {
        toast.error(result.error || 'Update failed');
      }
    } catch {
      toast.error('Internal server error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-secondary-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-xl bg-white dark:bg-secondary-950 rounded-[3rem] shadow-2xl border-2 border-secondary-50 dark:border-secondary-800 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-secondary-100 dark:border-secondary-900 bg-secondary-50/50 dark:bg-secondary-900/40 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden">
                 {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <User className="w-6 h-6" />}
              </div>
              <div>
                 <h2 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">Edit Profile</h2>
                 <p className="text-[10px] font-bold text-secondary-400 tracking-widest uppercase">ID: {user.id.slice(-8)}</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-2xl transition-all">
              <X className="w-6 h-6 text-secondary-400" />
           </button>
        </div>

        <div className="p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Full Name" 
                placeholder="John Doe" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})}
              />
              <Input 
                label="Email Address" 
                placeholder="john@example.com" 
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})}
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select 
                label="Account Type"
                value={form.userType}
                onChange={val => setForm({...form, userType: val})}
                options={[
                  { label: 'Individual', value: 'INDIVIDUAL' },
                  { label: 'Business', value: 'BUSINESS' },
                  { label: 'Admin', value: 'ADMIN' },
                ]}
              />
              <Select 
                label="Interest Category"
                value={form.categoryId}
                onChange={val => setForm({...form, categoryId: val})}
                options={[
                  { label: 'None / Mixed', value: 'NONE' },
                  ...categories.map(c => ({ label: c.name, value: c.id }))
                ]}
              />
           </div>

           <Select 
             label="Verification Status"
             value={form.verificationStatus}
             onChange={val => setForm({...form, verificationStatus: val})}
             options={[
               { label: 'Unverified', value: 'UNVERIFIED' },
               { label: 'Pending', value: 'PENDING' },
               { label: 'Verified', value: 'VERIFIED' },
               { label: 'Rejected', value: 'REJECTED' },
             ]}
           />
        </div>

        <div className="p-8 bg-secondary-50 dark:bg-secondary-900/50 border-t border-secondary-100 dark:border-secondary-800 flex items-center justify-end gap-3">
           <Button variant="outline" onClick={onClose} className="rounded-2xl h-12 px-6 font-black uppercase text-xs tracking-widest">
              Cancel
           </Button>
           <Button 
             onClick={handleSave} 
             disabled={loading}
             className="rounded-2xl h-12 px-8 bg-primary-500 hover:bg-primary-600 font-black uppercase text-xs tracking-widest text-white shadow-xl shadow-primary-500/20"
           >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
           </Button>
        </div>
      </Card>
    </div>
  );
}
