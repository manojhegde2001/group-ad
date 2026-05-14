'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Input, Textarea, ActionIcon } from 'rizzui';
import { 
    X, Upload, Building, Globe, Lock, ShieldCheck, 
    Image as ImageIcon, Loader2, Save, Trash2 
} from 'lucide-react';
import { useUpdatePowerTeam, useDeletePowerTeam } from '@/hooks/use-api/use-power-teams';
import { useCategories, useUpload } from '@/hooks/use-api/use-common';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { CloudinaryImage } from '@/components/ui/cloudinary-image';

interface TeamSettingsFormProps {
  team: any;
}

export function TeamSettingsForm({ team }: TeamSettingsFormProps) {
  const router = useRouter();
  const { data: categories = [] } = useCategories();

  const [name, setName] = useState(team.name || '');
  const [description, setDescription] = useState(team.description || '');
  const [categoryId, setCategoryId] = useState(team.categoryId || '');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(team.visibility || 'PUBLIC');
  
  // Media State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(team.logo || null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(team.banner || null);
  
  const uploadMutation = useUpload();
  const uploading = uploadMutation.isPending;
  const [saving, setSaving] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = useUpdatePowerTeam();
  const deleteMutation = useDeletePowerTeam();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }
      
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      } else {
        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
      }
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    try {
      const data = await uploadMutation.mutateAsync({ file, resourceType: 'image' });
      return data.url;
    } catch (err) {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) {
      toast.error('Name and Category are required');
      return;
    }

    setSaving(true);
    try {
      let finalLogo = logoPreview;
      let finalBanner = bannerPreview;

      // Handle new uploads
      if (logoFile) {
        const url = await uploadToCloudinary(logoFile);
        if (url) finalLogo = url;
      }
      if (bannerFile) {
        const url = await uploadToCloudinary(bannerFile);
        if (url) finalBanner = url;
      }

      updateMutation.mutate({
        slug: team.slug,
        data: {
          name,
          description,
          categoryId,
          visibility,
          logo: finalLogo || undefined,
          banner: finalBanner || undefined,
        },
      }, {
        onSuccess: () => {
          setSaving(false);
          router.refresh();
          toast.success('Alliance settings updated');
        },
        onError: () => setSaving(false)
      });
    } catch (err) {
      toast.error('Failed to update team settings');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you absolutely sure? This will delete the Power Team and remove all members. This action cannot be undone.')) return;
    
    deleteMutation.mutate(team.slug, {
      onSuccess: () => {
        router.push('/power-teams');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12 pb-20">
      
      {/* Visual Identity Section */}
      <section className="space-y-6">
        <div>
          <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight">Visual Identity</h3>
          <p className="text-xs text-secondary-500 font-medium mt-1 uppercase tracking-widest">Update your team's logo and banner</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Logo Upload */}
          <div className="space-y-4">
             <label className="text-xs font-black text-secondary-400 uppercase tracking-[0.2em]">Alliance Logo</label>
             <div 
                onClick={() => logoInputRef.current?.click()}
                className="relative aspect-square rounded-[3rem] border-2 border-dashed border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-900/50 flex flex-col items-center justify-center cursor-pointer group hover:border-primary-500/50 hover:bg-primary-500/5 transition-all overflow-hidden"
             >
                {logoPreview ? (
                   <>
                    <CloudinaryImage src={logoPreview} alt="Logo" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Upload className="w-8 h-8 text-white" />
                    </div>
                   </>
                ) : (
                   <div className="text-center p-6 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center mx-auto text-secondary-400 group-hover:text-primary-500 group-hover:scale-110 transition-all">
                        <Building className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-black text-secondary-500 uppercase tracking-widest">Click to upload</p>
                   </div>
                )}
             </div>
             <input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'logo')} className="hidden" />
          </div>

          {/* Banner Upload */}
          <div className="lg:col-span-2 space-y-4">
             <label className="text-xs font-black text-secondary-400 uppercase tracking-[0.2em]">Alliance Banner</label>
             <div 
                onClick={() => bannerInputRef.current?.click()}
                className="relative h-[200px] rounded-[3rem] border-2 border-dashed border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-900/50 flex flex-col items-center justify-center cursor-pointer group hover:border-primary-500/50 hover:bg-primary-500/5 transition-all overflow-hidden"
             >
                {bannerPreview ? (
                   <>
                    <CloudinaryImage src={bannerPreview} alt="Banner" fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Upload className="w-10 h-10 text-white" />
                    </div>
                   </>
                ) : (
                   <div className="text-center p-6 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center mx-auto text-secondary-400 group-hover:text-primary-500 group-hover:scale-110 transition-all">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-black text-secondary-500 uppercase tracking-widest">Click to upload banner</p>
                   </div>
                )}
             </div>
             <input ref={bannerInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'banner')} className="hidden" />
          </div>
        </div>
      </section>

      {/* Core Information */}
      <section className="space-y-8 bg-white dark:bg-secondary-900 p-8 sm:p-12 rounded-[3.5rem] border border-secondary-100 dark:border-secondary-800 shadow-xl shadow-black/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Input
             label="Alliance Name *"
             placeholder="Enter team name"
             value={name}
             onChange={(e) => setName(e.target.value)}
             className="font-bold"
           />

           <div className="space-y-1.5">
             <label className="block text-sm font-bold text-secondary-900 dark:text-secondary-300">Target Industry *</label>
             <select
               value={categoryId}
               onChange={(e) => setCategoryId(e.target.value)}
               className="w-full h-11 px-4 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50 text-sm font-bold focus:ring-2 ring-primary-500/20 outline-none transition-all"
             >
               <option value="" disabled>Select Category</option>
               {categories.map((cat: any) => (
                 <option key={cat.id} value={cat.id} className="dark:bg-secondary-900">{cat.name}</option>
               ))}
             </select>
           </div>
        </div>

        <Textarea
          label="Mission Statement"
          placeholder="What are the goals of this alliance?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="font-medium"
        />

        {/* Privacy Control */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-secondary-50/50 dark:bg-secondary-800/30 rounded-[2.5rem] border border-secondary-100 dark:border-secondary-800/50 gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
             <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                visibility === 'PUBLIC' ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-amber-500/10 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
             )}>
                {visibility === 'PUBLIC' ? <Globe className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
             </div>
             <div>
                <h4 className="font-black text-secondary-900 dark:text-white uppercase tracking-tight">{visibility} ALLIANCE</h4>
                <p className="text-[10px] text-secondary-500 font-bold uppercase tracking-widest mt-1">
                  {visibility === 'PUBLIC' ? 'Visible to all members' : 'Visible only to team members'}
                </p>
             </div>
          </div>
          
          <div className="flex bg-white dark:bg-secondary-800 p-1.5 rounded-2xl shadow-sm border border-secondary-100 dark:border-secondary-700">
             <button
                type="button"
                onClick={() => setVisibility('PUBLIC')}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                  visibility === 'PUBLIC' ? "bg-secondary-900 dark:bg-white text-white dark:text-secondary-900" : "text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                )}
             >
                Public
             </button>
             <button
                type="button"
                onClick={() => setVisibility('PRIVATE')}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                  visibility === 'PRIVATE' ? "bg-secondary-900 dark:bg-white text-white dark:text-secondary-900" : "text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                )}
             >
                Private
             </button>
          </div>
        </div>
      </section>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-secondary-100 dark:border-secondary-800">
         <Button
           type="submit"
           isLoading={saving}
           className="w-full sm:w-auto h-14 px-12 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-500/20 active:scale-95 transition-all flex items-center gap-2"
         >
           <Save className="w-4 h-4" />
           Save Changes
         </Button>
         
         <Button
           type="button"
           variant="outline"
           onClick={handleDelete}
           className="w-full sm:w-auto h-14 px-12 rounded-2xl border-red-500 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-950/10 active:scale-95 transition-all flex items-center gap-2"
         >
           <Trash2 className="w-4 h-4" />
           Dissolve Alliance
         </Button>
      </div>

    </form>
  );
}
