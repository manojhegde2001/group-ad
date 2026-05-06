'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Textarea } from 'rizzui';
import { X, Building, Layout, Globe, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePowerTeamModal } from '@/hooks/use-power-teams';
import { useCreatePowerTeam } from '@/hooks/use-api/use-power-teams';
import { useCategories } from '@/hooks/use-api/use-categories';
import { useProfile } from '@/hooks/use-api/use-user';
import toast from 'react-hot-toast';

export function CreateTeamModal() {
  const { isOpen, close, notifyCreated } = usePowerTeamModal();
  const { data: profileData } = useProfile();
  const profile = profileData?.user ?? profileData;
  const { data: catData } = useCategories();
  const categories = catData?.categories || [];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');

  const createMutation = useCreatePowerTeam();

  // Constraints Check
  // Constraints Check - Use fresh profile data to avoid session staleness
  const isBusiness = profile?.userType === 'BUSINESS';
  const isVerified = profile?.verificationStatus === 'VERIFIED';
  const isAdmin = profile?.userType === 'ADMIN';
  const canCreate = isAdmin || (isBusiness && isVerified);

  useEffect(() => {
    if (isOpen && !canCreate) {
      toast.error('Only verified business accounts can create Power Teams');
      close();
    }
  }, [isOpen, canCreate, close]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) {
      toast.error('Please fill in required fields');
      return;
    }

    createMutation.mutate({
      name,
      description,
      categoryId,
      visibility,
      logo: logo || undefined,
      banner: banner || undefined,
    }, {
      onSuccess: (data: any) => {
        reset();
        notifyCreated(data.team);
      }
    });
  };

  const reset = () => {
    setName('');
    setDescription('');
    setCategoryId('');
    setVisibility('PUBLIC');
    setLogo('');
    setBanner('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      containerClassName="flex items-center justify-center"
    >
      <div className="w-full max-w-xl bg-white dark:bg-secondary-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-secondary-100 dark:border-secondary-800">
        {/* Header */}
        <div className="px-8 py-6 border-b border-secondary-50 dark:border-secondary-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary-500/10 text-primary-500">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">Create Power Team</h2>
              <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-0.5">Start your industry alliance</p>
            </div>
          </div>
          <button onClick={close} className="p-2 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Team Name */}
          <Input
            label="Team Name *"
            placeholder="e.g. Real Estate Growth Network"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="font-bold"
          />

          {/* Category Selection */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-secondary-900 dark:text-secondary-300">Target Industry *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-transparent text-sm font-bold focus:ring-2 ring-primary-500/20 outline-none transition-all"
            >
              <option value="" disabled className="dark:bg-secondary-900">Select an industry focus</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id} className="dark:bg-secondary-900">{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <Textarea
            label="Team Mission"
            placeholder="Describe the goals and target market of your power team..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="font-medium"
          />

          {/* Visibility & Verification Badge */}
          <div className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-800/40 rounded-2xl border border-secondary-100 dark:border-secondary-800/50">
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-xl ${visibility === 'PUBLIC' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {visibility === 'PUBLIC' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
               </div>
               <div>
                  <p className="text-xs font-black text-secondary-900 dark:text-white uppercase tracking-tight">{visibility} TEAM</p>
                  <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest">{visibility === 'PUBLIC' ? 'Visible to everyone' : 'By invite only'}</p>
               </div>
            </div>
            <div className="flex items-center gap-1">
               <button
                 type="button"
                 onClick={() => setVisibility('PUBLIC')}
                 className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${visibility === 'PUBLIC' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-white dark:bg-secondary-900 text-secondary-400 border border-secondary-100 dark:border-secondary-700'}`}
               >
                 <Globe className="w-4 h-4" />
               </button>
               <button
                 type="button"
                 onClick={() => setVisibility('PRIVATE')}
                 className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${visibility === 'PRIVATE' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-white dark:bg-secondary-900 text-secondary-400 border border-secondary-100 dark:border-secondary-700'}`}
               >
                 <Lock className="w-4 h-4" />
               </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center gap-3">
            <Button
              variant="text"
              onClick={close}
              className="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              className="flex-[2] h-12 rounded-2xl bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              {createMutation.isPending ? 'Creating...' : 'Initialize Team'}
            </Button>
          </div>
        </form>

        {/* Verification Footer */}
        <div className="px-8 py-4 bg-secondary-50 dark:bg-secondary-800/40 border-t border-secondary-100 dark:border-secondary-800 flex items-center justify-center gap-2">
           <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
           <p className="text-[9px] font-black text-secondary-400 uppercase tracking-[0.2em]">Verified Business Creation Protocol</p>
        </div>
      </div>
    </Modal>
  );
}
