'use client';

import { useState, useRef, useEffect } from 'react';
import { useCreatePost } from '@/hooks/use-feed';
import { useAuth } from '@/hooks/use-auth';
import { X, Image as ImageIcon, Type, Tag, Globe, Lock, Upload, Loader2, CheckCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
}

export function CreatePostModal() {
    const { isOpen, close } = useCreatePost();
    const { user } = useAuth();

    const [postType, setPostType] = useState<'IMAGE' | 'TEXT'>('IMAGE');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
    const [categoryId, setCategoryId] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            fetch('/api/categories')
                .then((r) => r.json())
                .then((d) => setCategories(d.categories || []))
                .catch(() => { });
        }
    }, [isOpen]);

    const reset = () => {
        setContent('');
        setTags('');
        setVisibility('PUBLIC');
        setCategoryId('');
        setImages([]);
        setImageFiles([]);
        setImagePreviews([]);
        setPostType('IMAGE');
        setSuccess(false);
    };

    const handleClose = () => {
        reset();
        close();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const total = imageFiles.length + files.length;
        if (total > 4) {
            toast.error('Maximum 4 images allowed');
            return;
        }

        const previews = files.map((f) => URL.createObjectURL(f));
        setImageFiles((prev) => [...prev, ...files]);
        setImagePreviews((prev) => [...prev, ...previews]);
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(imagePreviews[index]);
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const uploadImages = async (): Promise<string[]> => {
        if (imageFiles.length === 0) return images;
        setUploading(true);
        try {
            const uploaded: string[] = [];
            for (const file of imageFiles) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/user/upload-avatar', { method: 'POST', body: formData });
                if (res.ok) {
                    const data = await res.json();
                    uploaded.push(data.url || data.avatar || '');
                }
            }
            return uploaded;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            toast.error('Please add some content');
            return;
        }
        if (postType === 'IMAGE' && imageFiles.length === 0 && images.length === 0) {
            toast.error('Please add at least one image for an image post');
            return;
        }

        setSubmitting(true);
        try {
            let finalImages = images;
            if (imageFiles.length > 0) {
                finalImages = await uploadImages();
            }

            const parsedTags = tags
                .split(',')
                .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
                .filter(Boolean);

            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: postType,
                    content: content.trim(),
                    images: finalImages,
                    tags: parsedTags,
                    visibility,
                    categoryId: categoryId || undefined,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create post');
            }

            setSuccess(true);
            toast.success('Post published! 🎉');
            setTimeout(() => {
                handleClose();
                window.location.reload();
            }, 1500);
        } catch (err: any) {
            toast.error(err.message || 'Failed to publish post');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={handleClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

            {/* Modal — full width sheet on mobile, constrained on sm+ */}
            <div
                className="relative w-full sm:max-w-2xl bg-white dark:bg-secondary-900 sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-secondary-100 dark:border-secondary-800 shrink-0">
                    {/* Drag handle — mobile only */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-secondary-300 dark:bg-secondary-700 rounded-full sm:hidden" />

                    <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                        <Avatar
                            src={user?.avatar as string | undefined}
                            name={(user?.name as string) || 'User'}
                            size="sm"
                            rounded="full"
                            color="primary"
                            className="w-8 h-8"
                        />
                        <div>
                            <p className="text-sm font-semibold text-secondary-900 dark:text-white">{user?.name as string}</p>
                            <button
                                onClick={() => setVisibility(visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
                                className="flex items-center gap-1 text-xs text-secondary-500 hover:text-primary-500 transition-colors"
                            >
                                {visibility === 'PUBLIC' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                {visibility === 'PUBLIC' ? 'Public' : 'Private'}
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors mt-2 sm:mt-0"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-secondary-500" />
                    </button>
                </div>

                {/* Success state */}
                {success ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4">
                        <CheckCircle className="w-14 sm:w-16 h-14 sm:h-16 text-green-500" />
                        <p className="text-lg sm:text-xl font-semibold text-secondary-800 dark:text-white">Post Published!</p>
                        <p className="text-secondary-500 text-sm">Your post is now live</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
                        {/* Post Type Toggle */}
                        <div className="flex gap-2 px-4 sm:px-6 pt-4 shrink-0">
                            <button
                                type="button"
                                onClick={() => setPostType('IMAGE')}
                                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${postType === 'IMAGE' ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200'}`}
                            >
                                <ImageIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                                <span>Image Post</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPostType('TEXT')}
                                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${postType === 'TEXT' ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200'}`}
                            >
                                <Type className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                                <span>Text Post</span>
                            </button>
                        </div>

                        <div className="px-4 sm:px-6 py-4 space-y-4 flex-1">
                            {/* Image Upload Area */}
                            {postType === 'IMAGE' && (
                                <div>
                                    {imagePreviews.length > 0 ? (
                                        <div className={`grid gap-2 ${imagePreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                            {imagePreviews.map((src, i) => (
                                                <div key={i} className="relative rounded-xl overflow-hidden group aspect-square">
                                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(i)}
                                                        className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {imagePreviews.length < 4 && (
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="aspect-square border-2 border-dashed border-secondary-200 dark:border-secondary-700 rounded-xl flex flex-col items-center justify-center gap-2 text-secondary-400 hover:border-primary-400 hover:text-primary-400 transition-colors"
                                                >
                                                    <Plus className="w-6 h-6" />
                                                    <span className="text-xs">Add more</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full border-2 border-dashed border-secondary-200 dark:border-secondary-700 rounded-2xl p-6 sm:p-10 flex flex-col items-center gap-3 text-secondary-400 hover:border-primary-400 hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all"
                                        >
                                            <Upload className="w-8 sm:w-10 h-8 sm:h-10" />
                                            <div className="text-center">
                                                <p className="font-medium text-sm sm:text-base">Click to upload images</p>
                                                <p className="text-xs sm:text-sm text-secondary-400 mt-1">PNG, JPG, GIF up to 10MB · Max 4 images</p>
                                            </div>
                                        </button>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>
                            )}

                            {/* Content */}
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={postType === 'IMAGE' ? 'Add a description...' : "What's on your mind?"}
                                rows={postType === 'TEXT' ? 5 : 3}
                                className={`w-full resize-none bg-transparent outline-none text-secondary-800 dark:text-secondary-100 placeholder:text-secondary-400 text-sm leading-relaxed ${postType === 'TEXT' ? 'text-base min-h-[120px] sm:min-h-[160px]' : ''}`}
                                maxLength={5000}
                            />
                            <div className="text-right text-xs text-secondary-400">{content.length}/5000</div>

                            {/* Tags */}
                            <div className="flex items-center gap-2 bg-secondary-50 dark:bg-secondary-800 rounded-xl px-3 py-2">
                                <Tag className="w-4 h-4 text-secondary-400 shrink-0" />
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="Add tags (e.g. design, ai, startup)"
                                    className="flex-1 bg-transparent outline-none text-sm text-secondary-700 dark:text-secondary-300 placeholder:text-secondary-400 min-w-0"
                                />
                            </div>

                            {/* Category */}
                            {categories.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-secondary-500 mb-2">Category</p>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {categories.slice(0, 10).map((cat) => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setCategoryId(categoryId === cat.id ? '' : cat.id)}
                                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-all ${categoryId === cat.id
                                                    ? 'bg-primary-600 text-white'
                                                    : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200'
                                                    }`}
                                            >
                                                {cat.icon} {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-white dark:bg-secondary-900 px-4 sm:px-6 py-3 sm:py-4 border-t border-secondary-100 dark:border-secondary-800 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
                            <Button
                                type="button"
                                onClick={handleClose}
                                variant="text"
                                color="secondary"
                                size="sm"
                                rounded="pill"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="solid"
                                color="primary"
                                size="sm"
                                rounded="pill"
                                isLoading={submitting || uploading}
                                disabled={submitting || uploading}
                                leftIcon={!submitting && !uploading ? undefined : undefined}
                                className="px-5 sm:px-6"
                            >
                                {uploading ? 'Uploading...' : submitting ? 'Publishing...' : 'Publish'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
