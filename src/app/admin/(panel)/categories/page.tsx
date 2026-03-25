'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2, Plus, Edit, Trash2, Image as ImageIcon, Check, X,
  ShieldCheck, ArrowLeft, UploadCloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [banner, setBanner] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session && (session.user as any)?.userType !== 'ADMIN') {
      router.push('/');
    } else if (session) {
      fetchCategories();
    }
  }, [session, router]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      toast.error('Could not load categories');
    } finally {
      setLoading(false);
    }
  };

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
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      toast.success('Category deleted');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { name, description, icon, banner, isActive };
      const url = isEditing ? `/api/admin/categories/${currentId}` : '/api/admin/categories';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save category');
      }

      toast.success(isEditing ? 'Category updated' : 'Category created');
      handleCancel();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
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

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    if (currentId) formData.append('categoryId', currentId);

    try {
      const res = await fetch('/api/admin/categories/upload-banner', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      setBanner(data.bannerUrl);
      toast.success('Banner uploaded successfully');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 pb-20">
      {/* Admin Details Header */}
      <div className="bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 -ml-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </Link>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary-500" />
              <h1 className="text-xl font-bold text-secondary-900 dark:text-white">Category Management</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Area */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-200 dark:border-secondary-800 p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-6">
                {isEditing ? 'Edit Category' : 'Create New Category'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Technology"
                  required
                />
                
                <div>
                  <label className="block text-sm font-semibold text-secondary-900 dark:text-white mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description..."
                    className="w-full h-24 px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none shadow-sm"
                  />
                </div>

                <Input
                  label="Icon (emoji or lucide name)"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="e.g. 🚀 or Code"
                />

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-secondary-900 dark:text-white">Banner Image</label>
                  
                  {banner ? (
                    <div className="relative rounded-xl overflow-hidden border border-secondary-200 dark:border-secondary-800 bg-secondary-100 dark:bg-secondary-800 aspect-video group">
                      <img src={banner} alt="Banner Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          className="bg-white/10 hover:bg-white text-white hover:text-secondary-900 border-white"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change
                        </Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          className="bg-red-500/80 hover:bg-red-500 text-white border-red-500"
                          onClick={() => setBanner('')}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-secondary-300 dark:border-secondary-700 rounded-xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors group"
                    >
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <UploadCloud className="w-5 h-5 text-secondary-500" />
                          </div>
                          <span className="text-sm font-bold text-secondary-600 dark:text-secondary-400">Upload Banner (5MB Max)</span>
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

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    checked={isActive} 
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Active (visible to users)
                  </label>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button type="submit" color="primary" variant="solid" className="flex-1" disabled={isSubmitting || isUploading}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (isEditing ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />)}
                    {isEditing ? 'Save Changes' : 'Create'}
                  </Button>
                  {isEditing && (
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* List Area */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-6">Existing Categories</h2>
            
            {categories.length === 0 ? (
              <div className="bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-200 dark:border-secondary-800 p-12 text-center flex flex-col items-center">
                <ImageIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-700 mb-4" />
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-1">No Categories Yet</h3>
                <p className="text-secondary-500 text-sm">Create your first category using the form on the left.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-200 dark:border-secondary-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    {cat.banner ? (
                      <div className="h-24 w-full bg-secondary-100 overflow-hidden relative">
                        <img src={cat.banner} alt={cat.name} className="w-full h-full object-cover" />
                        {!cat.isActive && (
                          <div className="absolute inset-0 bg-secondary-900/60 flex items-center justify-center backdrop-blur-sm">
                            <span className="bg-secondary-800 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Inactive</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-24 w-full bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-800/20 flex items-center justify-center border-b border-secondary-100 dark:border-secondary-800 relative">
                        <ImageIcon className="w-8 h-8 text-secondary-300 dark:text-secondary-700 opacity-50" />
                        {!cat.isActive && (
                          <div className="absolute inset-0 bg-secondary-900/60 flex items-center justify-center backdrop-blur-sm">
                            <span className="bg-secondary-800 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Inactive</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{cat.icon}</span>
                          <h3 className="font-bold text-secondary-900 dark:text-white truncate">{cat.name}</h3>
                        </div>
                      </div>
                      <p className="text-xs text-secondary-500 line-clamp-2 mb-4 flex-1">
                        {cat.description || 'No description provided.'}
                      </p>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-secondary-100 dark:border-secondary-800">
                        <div className="text-[10px] font-medium text-secondary-400 uppercase tracking-widest bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded-sm">
                          /{cat.slug}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="text" className="h-8 w-8 p-0 text-secondary-500 hover:text-primary-600 dark:hover:text-primary-400" onClick={() => handleEdit(cat)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="text" className="h-8 w-8 p-0 text-secondary-500 hover:text-red-600 dark:hover:text-red-400" onClick={() => handleDelete(cat.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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
