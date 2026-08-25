'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2, Edit, Trash2, Image as ImageIcon, Check,
  UploadCloud
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
import { CloudinaryImage } from '@/components/ui/cloudinary-image';
import { DataGrid, DataGridColumn, DataGridAction } from '@/components/ui/data-grid';
import { Switch } from '@/components/ui/switch';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { LayoutGrid } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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
  const [banner, setBanner] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data, isLoading } = useCategories();
  const categories: Category[] = data?.categories || [];

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
    setBanner(cat.banner || '');
    setIsActive(cat.isActive);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setDescription('');
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

    const payload = { name, description, banner, isActive };

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

    // Check image dimensions for aspect ratio warning
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      if (aspectRatio < 0.9 || aspectRatio > 1.8) {
        toast('Uploaded, but its aspect ratio is unusual. A 4:3 format is recommended for best presentation.', {
          icon: '⚠️',
          duration: 6000,
        });
      }
    };
    img.src = URL.createObjectURL(file);

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

  const columns: DataGridColumn<Category>[] = [
    {
      key: 'name',
      header: 'Category',
      sortable: true,
      render: (cat) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-secondary-100 dark:bg-secondary-800 shrink-0 relative">
            {cat.banner ? (
              <CloudinaryImage src={cat.banner} alt={cat.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-secondary-300 dark:text-secondary-700">
                <ImageIcon className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-secondary-900 dark:text-white truncate">{cat.name}</p>
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wide">/{cat.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (cat) => (
        <p className="text-xs text-secondary-500 dark:text-secondary-400 max-w-xs truncate">
          {cat.description || '—'}
        </p>
      ),
    },
    {
      key: 'posts',
      header: 'Posts',
      sortable: true,
      accessor: (cat) => cat._count?.posts || 0,
      className: 'text-sm font-bold text-secondary-700 dark:text-secondary-300 tabular-nums',
      render: (cat) => cat._count?.posts || 0,
    },
    {
      key: 'events',
      header: 'Events',
      sortable: true,
      accessor: (cat) => cat._count?.events || 0,
      className: 'text-sm font-bold text-secondary-700 dark:text-secondary-300 tabular-nums',
      render: (cat) => cat._count?.events || 0,
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      accessor: (cat) => (cat.isActive ? 1 : 0),
      render: (cat) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={cat.isActive}
            disabled={updateMutation.isPending && updateMutation.variables?.id === cat.id}
            onChange={(e) =>
              updateMutation.mutate({ id: cat.id, data: { isActive: e.target.checked } })
            }
          />
          <span className={cn(
            'text-[9px] font-bold uppercase tracking-wide',
            cat.isActive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-500 dark:text-red-400'
          )}>
            {cat.isActive ? 'Active' : 'Offline'}
          </span>
        </div>
      ),
    },
  ];

  const actions: DataGridAction<Category>[] = [
    {
      key: 'edit',
      icon: Edit,
      variant: 'primary',
      title: 'Edit',
      onClick: (cat) => handleEdit(cat),
    },
    {
      key: 'delete',
      icon: Trash2,
      variant: 'danger',
      title: 'Delete',
      loading: (cat) => deleteMutation.isPending && deleteMutation.variables === cat.id,
      onClick: (cat) => handleDelete(cat.id),
    },
  ];

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
    <div className="space-y-5 pb-20">
      <AdminPageHeader
        icon={LayoutGrid}
        title="Category"
        accent="Forge"
        description="Manage platform tags, interests, and discovery hubs"
        actions={
          <div className="px-4 py-2 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-lg font-black uppercase text-[10px] tracking-[0.2em]">
            {categories.length} Active Hubs
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Form Area */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-secondary-200 dark:border-secondary-800 p-4 shadow-sm sticky top-24">
            <h2 className="text-base font-black text-secondary-900 dark:text-white uppercase tracking-tighter mb-4 leading-none">
              {isEditing ? 'Modify <' : 'Forge <'} <span className="text-primary italic">Category</span> {'>'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Technology"
                required
                className="rounded-lg"
              />

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this hub..."
                  className="w-full h-24 px-3 py-2.5 rounded-lg border border-secondary-200 dark:border-secondary-800 bg-secondary-50/30 dark:bg-slate-800/50 text-secondary-900 dark:text-white focus:outline-none focus:border-primary transition-all resize-none font-medium text-sm leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-[10px] font-black text-secondary-400 uppercase tracking-widest">Banner Visual</label>
                  <span className="text-[10px] font-medium text-secondary-400 bg-secondary-100 dark:bg-secondary-800 px-2 py-0.5 rounded-md">Rec: 4:3 (800x600)</span>
                </div>

                {banner ? (
                  <div className="relative rounded-lg overflow-hidden border border-secondary-200 dark:border-secondary-800 bg-secondary-100 dark:bg-secondary-900 aspect-[4/3] group">
                    {/* Blur fill preview */}
                    <div
                      className="absolute inset-[-20%] bg-cover bg-center opacity-60 dark:opacity-40 blur-xl scale-110"
                      style={{ backgroundImage: `url('${banner}')` }}
                    />
                    {/* Actual foreground image */}
                    <img src={banner} alt="Banner Preview" className="absolute inset-0 w-full h-full object-contain" />

                    <div className="absolute inset-0 bg-secondary-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm z-10">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="bg-white/10 hover:bg-white text-white hover:text-black border-white rounded-md font-black text-[10px] uppercase tracking-widest"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Swap
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="bg-red-500/20 hover:bg-red-500 text-white border-red-500 rounded-md font-black text-[10px] uppercase tracking-widest"
                        onClick={() => setBanner('')}
                      >
                        Purge
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-secondary-200 dark:border-secondary-800 rounded-lg aspect-[4/3] flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group relative overflow-hidden"
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Transmitting...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-secondary-50 dark:bg-secondary-800/50 flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-all">
                          <UploadCloud className="w-5 h-5" />
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

              <div className="flex items-center gap-3 p-3 bg-secondary-50/50 dark:bg-slate-800/40 rounded-lg border border-transparent hover:border-primary/10 transition-all cursor-pointer group" onClick={() => setIsActive(!isActive)}>
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                  isActive ? "bg-primary border-primary text-white" : "border-secondary-200 dark:border-secondary-700"
                )}>
                  {isActive && <Check className="w-3.5 h-3.5" />}
                </div>
                <label htmlFor="isActive" className="text-[10px] font-black text-secondary-500 group-hover:text-secondary-900 dark:group-hover:text-white uppercase tracking-widest cursor-pointer transition-colors">
                  Public Visibility
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <Button type="submit" color="primary" variant="solid" className="flex-1 rounded-lg h-11 font-black uppercase text-xs tracking-[0.2em]" disabled={isSubmitting || isUploading}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? 'Apply Changes' : 'Initialize Hub')}
                </Button>
                {isEditing && (
                  <Button type="button" variant="outline" onClick={handleCancel} className="rounded-lg h-11 font-black uppercase text-xs tracking-widest">
                    X
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List Area */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-black text-secondary-900 dark:text-white uppercase tracking-tighter mb-3 leading-none">
            Platform <span className="text-primary italic">Ecosystem</span>
          </h2>

          <DataGrid
            columns={columns}
            data={categories}
            emptyMessage="Void detected — start by forging your first category hub"
            getRowId={(cat) => cat.id}
            actions={actions}
          />
        </div>
      </div>
    </div>
  );
}
