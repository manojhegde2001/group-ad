'use client';

import { useState, useRef, useEffect } from 'react';
import { useCreatePost } from '@/hooks/use-feed';
import { useAuth } from '@/hooks/use-auth';
import { X, Image as ImageIcon, Type, Tag, Globe, Lock, Upload, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={handleClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full max-w-2xl bg-white dark:bg-secondary-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-100 dark:border-secondary-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden text-white text-xs font-bold">
                            {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : (user?.name as string)?.charAt(0)?.toUpperCase()}
                        </div>
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
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors">
                        <X className="w-5 h-5 text-secondary-500" />
                    </button>
                </div>

                {/* Success state */}
                {success ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                        <p className="text-xl font-semibold text-secondary-800 dark:text-white">Post Published!</p>
                        <p className="text-secondary-500 text-sm">Your post is now live</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                        {/* Post Type Toggle */}
                        <div className="flex gap-2 px-6 pt-4">
                            <button
                                type="button"
                                onClick={() => setPostType('IMAGE')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${postType === 'IMAGE' ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200'}`}
                            >
                                <ImageIcon className="w-4 h-4" /> Image Post
                            </button>
                            <button
                                type="button"
                                onClick={() => setPostType('TEXT')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${postType === 'TEXT' ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200'}`}
                            >
                                <Type className="w-4 h-4" /> Text Post
                            </button>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            {/* Image Upload Area */}
                            {postType === 'IMAGE' && (
                                <div>
                                    {imagePreviews.length > 0 ? (
                                        <div className={`grid gap-2 ${imagePreviews.length === 1 ? 'grid-cols-1' : imagePreviews.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
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
                                                    <Plus />
                                                    <span className="text-xs">Add more</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full border-2 border-dashed border-secondary-200 dark:border-secondary-700 rounded-2xl p-10 flex flex-col items-center gap-3 text-secondary-400 hover:border-primary-400 hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all"
                                        >
                                            <Upload className="w-10 h-10" />
                                            <div className="text-center">
                                                <p className="font-medium">Click to upload images</p>
                                                <p className="text-sm text-secondary-400 mt-1">PNG, JPG, GIF up to 10MB · Max 4 images</p>
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
                                placeholder={postType === 'IMAGE' ? 'Add a description...' : 'What\'s on your mind?'}
                                rows={postType === 'TEXT' ? 6 : 3}
                                className={`w-full resize-none bg-transparent outline-none text-secondary-800 dark:text-secondary-100 placeholder:text-secondary-400 text-sm leading-relaxed ${postType === 'TEXT' ? 'text-base min-h-[160px]' : ''}`}
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
                                    placeholder="Add tags, comma separated (e.g. design, ai, startup)"
                                    className="flex-1 bg-transparent outline-none text-sm text-secondary-700 dark:text-secondary-300 placeholder:text-secondary-400"
                                />
                            </div>

                            {/* Category */}
                            {categories.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-secondary-500 mb-2">Category</p>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.slice(0, 10).map((cat) => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setCategoryId(categoryId === cat.id ? '' : cat.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${categoryId === cat.id
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
                        <div className="sticky bottom-0 bg-white dark:bg-secondary-900 px-6 py-4 border-t border-secondary-100 dark:border-secondary-800 flex items-center justify-between gap-3">
                            <button type="button" onClick={handleClose} className="px-5 py-2.5 rounded-full text-sm font-semibold text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || uploading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-full text-sm font-semibold transition-all active:scale-95"
                            >
                                {(submitting || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                                {uploading ? 'Uploading...' : submitting ? 'Publishing...' : 'Publish'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function Plus({ className = '' }) {
    return (
        <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}
