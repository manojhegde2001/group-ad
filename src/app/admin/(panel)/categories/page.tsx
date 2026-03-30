'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2, Plus, Edit, Trash2, Image as ImageIcon, Check,
  UploadCloud, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory, 
  useUploadCategoryBanner 
} from '@/hooks/use-api/use-admin';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  banner: string | null;
  isActive: boolean;
  _count?: { posts: number, events: number, users: number };
}

export default function AdminCategoriesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [banner, setBanner] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data, isLoading } = useCategories();
  const categories = data?.categories || [];

  // Mutations
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const uploadMutation = useUploadCategoryBanner();

  const handleEdit = (cat: Category) => {
    setIsEditing(true);
    setCurrentId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setIcon(cat.icon || '');
    setBanner(cat.banner || '');
    setIsActive(cat.isActive);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setDescription('');
    setIcon('');
    setBanner('');
    setIsActive(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    deleteMutation.mutate(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    const payload = { name, description, icon, banner, isActive };

    if (isEditing && currentId) {
      updateMutation.mutate({ id: currentId, data: payload }, {
        onSuccess: () => handleCancel()
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => handleCancel()
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    if (currentId) formData.append('categoryId', currentId);

    uploadMutation.mutate(formData, {
      onSuccess: (data) => {
        setBanner(data.bannerUrl);
      },
      onSettled: () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  if (session && (session.user as any)?.userType !== 'ADMIN') {
    router.push('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-secondary-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <p className="font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Syncing categories...</p>
      </div>
    );
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isUploading = uploadMutation.isPending;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-secondary-900 dark:text-white tracking-tight uppercase leading-none mb-2">
            Category <span className="text-primary italic">Forge</span>
          </h1>
          <p className="text-secondary-400 font-bold uppercase text-[10px] tracking-widest leading-none">
            Manage platform tags, interests, and discovery hubs
          </p>
        </div>
        <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl">
                {categories.length} Active Hubs
            </div>
        </div>
      </div>

      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Form Area */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-secondary-50 dark:border-secondary-800 p-8 shadow-sm backdrop-blur-xl sticky top-24">
              <h2 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter mb-8 leading-none">
                {isEditing ? 'Modify <' : 'Forge <'} <span className="text-primary italic">Category</span> {'>'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Technology"
                  required
                  className="rounded-2xl"
                />
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this hub..."
                    className="w-full h-32 px-5 py-4 rounded-2xl border-2 border-secondary-50 dark:border-secondary-800 bg-secondary-50/30 dark:bg-slate-800/50 text-secondary-900 dark:text-white focus:outline-none focus:border-primary transition-all resize-none font-medium text-sm leading-relaxed"
                  />
                </div>

                <Input
                  label="Icon Symbol"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="e.g. 🚀 or Code"
                  className="rounded-2xl"
                />

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Banner Visual</label>
                  
                  {banner ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-secondary-50 dark:border-secondary-800 bg-secondary-100 dark:bg-secondary-800 aspect-video group shadow-inner">
                      <img src={banner} alt="Banner Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-secondary-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          className="bg-white/10 hover:bg-white text-white hover:text-black border-white rounded-xl font-black text-[10px] uppercase tracking-widest"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Swap
                        </Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          className="bg-red-500/20 hover:bg-red-500 text-white border-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest"
                          onClick={() => setBanner('')}
                        >
                          Purge
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-secondary-100 dark:border-secondary-800 rounded-2xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group relative overflow-hidden"
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Transmitting...</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-full bg-secondary-50 dark:bg-secondary-800/50 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Deploy Visual Assets</span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-secondary-50/50 dark:bg-slate-800/40 rounded-2xl border-2 border-transparent hover:border-primary/10 transition-all cursor-pointer group" onClick={() => setIsActive(!isActive)}>
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    isActive ? "bg-primary border-primary text-white" : "border-secondary-200 dark:border-secondary-700"
                  )}>
                    {isActive && <Check className="w-4 h-4" />}
                  </div>
                  <label htmlFor="isActive" className="text-[10px] font-black text-secondary-500 group-hover:text-secondary-900 dark:group-hover:text-white uppercase tracking-widest cursor-pointer transition-colors">
                    Public Visibility
                  </label>
                </div>

                <div className="pt-6 flex gap-4">
                  <Button type="submit" color="primary" variant="solid" className="flex-1 rounded-2xl h-14 font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/20" disabled={isSubmitting || isUploading}>
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? 'Apply Changes' : 'Initialize Hub')}
                  </Button>
                  {isEditing && (
                    <Button type="button" variant="outline" onClick={handleCancel} className="rounded-2xl h-14 font-black uppercase text-xs tracking-widest">
                      X
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* List Area */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter mb-10 leading-none">
              Platform <span className="text-primary italic">Ecosystem</span>
            </h2>
            
            {categories.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/50 rounded-[3rem] border-2 border-secondary-50 dark:border-secondary-800 p-20 text-center flex flex-col items-center backdrop-blur-xl">
                <div className="w-20 h-20 rounded-[2.5rem] bg-secondary-50 dark:bg-secondary-800/50 flex items-center justify-center mb-6">
                  <ImageIcon className="w-10 h-10 text-secondary-200 dark:text-secondary-700" />
                </div>
                <h3 className="text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter mb-2">Void Detected</h3>
                <p className="text-secondary-400 font-bold uppercase text-[10px] tracking-[0.2em]">Start by forging your first category hub.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {categories.map((cat) => (
                  <div key={cat.id} className="group bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-secondary-50 dark:border-secondary-800 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col relative">
                    
                    {/* Visual Banner */}
                    <div className="h-40 w-full bg-secondary-50 dark:bg-secondary-800/30 overflow-hidden relative border-b-2 border-secondary-50 dark:border-secondary-800">
                      {cat.banner ? (
                        <img src={cat.banner} alt={cat.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-secondary-100 dark:text-secondary-800" />
                        </div>
                      )}
                      
                      {/* Interaction Badge */}
                      <div className="absolute top-6 right-6">
                        <div className={cn(
                          "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md border shadow-lg",
                          cat.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}>
                          {cat.isActive ? 'Active' : 'Offline'}
                        </div>
                      </div>

                      {/* Icon Overlay */}
                      <div className="absolute -bottom-8 left-8 w-16 h-16 bg-white dark:bg-secondary-900 rounded-[1.5rem] shadow-xl border-4 border-secondary-50 dark:border-secondary-800 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        {cat.icon || '📦'}
                      </div>
                    </div>
                    
                    <div className="p-8 pt-12 flex-1 flex flex-col">
                      <div className="mb-4">
                        <h3 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter truncate leading-none mb-2">{cat.name}</h3>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] tabular-nums">/{cat.slug}</p>
                      </div>
                      
                      <p className="text-xs text-secondary-500 dark:text-secondary-400 font-medium leading-relaxed line-clamp-3 mb-8 flex-1 italic">
                        {cat.description || 'No description provided for this sector.'}
                      </p>
                      
                      <div className="flex items-center justify-between pt-6 border-t-2 border-secondary-50 dark:border-secondary-800">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-lg font-black text-secondary-900 dark:text-white tabular-nums leading-none mb-1">{cat._count?.posts || 0}</span>
                                <span className="text-[8px] font-black text-secondary-400 uppercase tracking-widest">Posts</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-black text-secondary-900 dark:text-white tabular-nums leading-none mb-1">{cat._count?.events || 0}</span>
                                <span className="text-[8px] font-black text-secondary-400 uppercase tracking-widest">Events</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all active:scale-90 border border-indigo-100 dark:border-indigo-800/50" onClick={() => handleEdit(cat)}>
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90 border border-red-100 dark:border-red-800/50" onClick={() => handleDelete(cat.id)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
