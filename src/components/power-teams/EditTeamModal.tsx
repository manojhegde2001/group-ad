'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Textarea } from 'rizzui';
import { X, Building, Globe, Lock, ShieldCheck } from 'lucide-react';
import { usePowerTeamModal } from '@/hooks/use-power-teams';
import { useUpdatePowerTeam, useDeletePowerTeam } from '@/hooks/use-api/use-power-teams';
import { useCategories } from '@/hooks/use-api/use-categories';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function EditTeamModal() {
  const router = useRouter();
  const { editTeamOpen, closeEditTeam, activeTeam } = usePowerTeamModal();
  const { data: catData } = useCategories();
  const categories = catData?.categories || [];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');

  const updateMutation = useUpdatePowerTeam();
  const deleteMutation = useDeletePowerTeam();

  useEffect(() => {
    if (activeTeam) {
      setName(activeTeam.name || '');
      setDescription(activeTeam.description || '');
      setCategoryId(activeTeam.categoryId || '');
      setVisibility(activeTeam.visibility || 'PUBLIC');
      setLogo(activeTeam.logo || '');
      setBanner(activeTeam.banner || '');
    }
  }, [activeTeam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) {
      toast.error('Please fill in required fields');
      return;
    }

    updateMutation.mutate({
      slug: activeTeam.slug,
      data: {
        name,
        description,
        categoryId,
        visibility,
        logo: logo || undefined,
        banner: banner || undefined,
      },
    }, {
      onSuccess: () => {
        closeEditTeam();
      }
    });
  };

  const handleDelete = async () => {
      if (!confirm('Are you absolutely sure? This will delete the Power Team and remove all members. This action cannot be undone.')) return;
      
      deleteMutation.mutate(activeTeam.slug, {
          onSuccess: () => {
              closeEditTeam();
              router.push('/power-teams');
          }
      });
  };

  return (
    <Modal
      isOpen={editTeamOpen}
      onClose={closeEditTeam}
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
              <h2 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">Edit Power Team</h2>
              <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-0.5">Adjust your alliance settings</p>
            </div>
          </div>
          <button onClick={closeEditTeam} className="p-2 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <Input
            label="Team Name *"
            placeholder="e.g. Real Estate Growth Network"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="font-bold"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-secondary-900 dark:text-secondary-300">Target Industry *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-transparent text-sm font-bold focus:ring-2 ring-primary-500/20 outline-none transition-all"
            >
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id} className="dark:bg-secondary-900">{cat.name}</option>
              ))}
            </select>
          </div>

          <Textarea
            label="Team Mission"
            placeholder="Describe the goals and target market..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="font-medium"
          />

          <div className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-800/40 rounded-2xl border border-secondary-100 dark:border-secondary-800/50">
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-xl ${visibility === 'PUBLIC' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {visibility === 'PUBLIC' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
               </div>
               <div>
                  <p className="text-xs font-black text-secondary-900 dark:text-white uppercase tracking-tight">{visibility} TEAM</p>
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
          <div className="pt-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <Button
                variant="text"
                onClick={closeEditTeam}
                className="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                Cancel
                </Button>
                <Button
                type="submit"
                isLoading={updateMutation.isPending}
                className="flex-[2] h-12 rounded-2xl bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                Save Changes
                </Button>
            </div>
            
            <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                isLoading={deleteMutation.isPending}
                className="w-full h-12 rounded-2xl border-red-100 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
            >
                Dissolve Power Team
            </Button>
          </div>
        </form>

        <div className="px-8 py-4 bg-secondary-50 dark:bg-secondary-800/40 border-t border-secondary-100 dark:border-secondary-800 flex items-center justify-center gap-2">
           <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
           <p className="text-[9px] font-black text-secondary-400 uppercase tracking-[0.2em]">Authorized Management Access</p>
        </div>
      </div>
    </Modal>
  );
}
