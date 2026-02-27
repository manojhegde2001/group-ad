'use client';

import { useState, useRef, useEffect } from 'react';
import { useCreatePost } from '@/hooks/use-feed';
import { useAuth } from '@/hooks/use-auth';
import {
    X, Image as ImageIcon, Type, Tag, Globe, Lock,
    Upload, Loader2, CheckCircle, Plus, Video, Film,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
}

type PostType = 'IMAGE' | 'VIDEO' | 'TEXT';

export function CreatePostModal() {
    const { isOpen, close } = useCreatePost();
    const { user } = useAuth();

    const [postType, setPostType] = useState<PostType>('IMAGE');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
    const [categoryId, setCategoryId] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [success, setSuccess] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            fetch('/api/categories')
                .then((r) => r.json())
                .then((d) => setCategories(d.categories || []))
                .catch(() => { });
        }
    }, [isOpen]);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const reset = () => {
        setContent('');
        setTags('');
        setVisibility('PUBLIC');
        setCategoryId('');
        setMediaFiles([]);
        setMediaPreviews([]);
        setPostType('IMAGE');
        setSuccess(false);
        setUploadProgress(0);
    };

    const handleClose = () => {
        reset();
        close();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (type === 'video') {
            // Only 1 video allowed
            const videoFile = files[0];
            if (!videoFile.type.startsWith('video/')) {
                toast.error('Please select a valid video file');
                return;
            }
            if (videoFile.size > 100 * 1024 * 1024) {
                toast.error('Video must be under 100MB');
                return;
            }
            setMediaFiles([videoFile]);
            setMediaPreviews([URL.createObjectURL(videoFile)]);
        } else {
            const total = mediaFiles.length + files.length;
            if (total > 4) {
                toast.error('Maximum 4 images allowed');
                return;
            }
            const newFiles = files.filter((f) => f.type.startsWith('image/'));
            if (newFiles.length === 0) {
                toast.error('Please select valid image files');
                return;
            }
            const previews = newFiles.map((f) => URL.createObjectURL(f));
            setMediaFiles((prev) => [...prev, ...newFiles]);
            setMediaPreviews((prev) => [...prev, ...previews]);
        }

        // Reset input value so same file can be re-selected
        e.target.value = '';
    };

    const removeMedia = (index: number) => {
        URL.revokeObjectURL(mediaPreviews[index]);
        setMediaFiles((prev) => prev.filter((_, i) => i !== index));
        setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const uploadToCloudinary = async (): Promise<string[]> => {
        if (mediaFiles.length === 0) return [];
        setUploading(true);
        setUploadProgress(0);

        const resourceType = postType === 'VIDEO' ? 'video' : 'image';
        const uploaded: string[] = [];

        try {
            for (let i = 0; i < mediaFiles.length; i++) {
                const file = mediaFiles[i];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('resource_type', resourceType);

                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Upload failed');
                }
                const data = await res.json();
                uploaded.push(data.url);
                setUploadProgress(Math.round(((i + 1) / mediaFiles.length) * 100));
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
        if ((postType === 'IMAGE' || postType === 'VIDEO') && mediaFiles.length === 0) {
            toast.error(`Please add at least one ${postType === 'VIDEO' ? 'video' : 'image'}`);
            return;
        }

        setSubmitting(true);
        try {
            const mediaUrls = await uploadToCloudinary();

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
                    images: postType !== 'VIDEO' ? mediaUrls : [],
                    // Store video URL in images array for simplicity (or you can extend schema)
                    ...(postType === 'VIDEO' && { images: mediaUrls }),
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

    const isMediaPost = postType === 'IMAGE' || postType === 'VIDEO';

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={handleClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

            {/* Modal */}
            <div
                className="relative z-10 w-full sm:max-w-2xl bg-white dark:bg-secondary-900 sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in max-h-[96vh] sm:max-h-[90vh] flex flex-col rounded-t-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-secondary-100 dark:border-secondary-800 shrink-0">
                    {/* Drag handle — mobile only */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-9 h-1 bg-secondary-200 dark:bg-secondary-700 rounded-full sm:hidden" />

                    <div className="flex items-center gap-2.5 mt-1.5 sm:mt-0">
                        <Avatar
                            src={user?.avatar as string | undefined}
                            name={(user?.name as string) || 'User'}
                            size="sm"
                            rounded="full"
                            color="primary"
                            className="w-8 h-8"
                        />
                        <div>
                            <p className="text-sm font-semibold text-secondary-900 dark:text-white leading-tight">
                                {user?.name as string}
                            </p>
                            <button
                                onClick={() => setVisibility(visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
                                className="flex items-center gap-1 text-[11px] text-secondary-400 hover:text-primary-500 transition-colors"
                            >
                                {visibility === 'PUBLIC'
                                    ? <><Globe className="w-3 h-3" /> Public</>
                                    : <><Lock className="w-3 h-3" /> Private</>
                                }
                            </button>
                        </div>
                    </div>

                    {/* Close — in-flow, never overlapping content */}
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors mt-1.5 sm:mt-0"
                        aria-label="Close modal"
                    >
                        <X className="w-4 h-4 text-secondary-500" />
                    </button>
                </div>

                {/* Success state */}
                {success ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4">
                        <CheckCircle className="w-14 h-14 text-green-500" />
                        <p className="text-lg font-semibold text-secondary-800 dark:text-white">Post Published!</p>
                        <p className="text-secondary-400 text-sm">Your post is now live</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col min-h-0">
                        {/* Post Type Tabs */}
                        <div className="flex gap-1.5 px-4 sm:px-5 pt-3.5 shrink-0">
                            {([
                                { type: 'IMAGE', icon: ImageIcon, label: 'Photo' },
                                { type: 'VIDEO', icon: Film, label: 'Video' },
                                { type: 'TEXT', icon: Type, label: 'Text' },
                            ] as const).map(({ type, icon: Icon, label }) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => { setPostType(type); setMediaFiles([]); setMediaPreviews([]); }}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${postType === type
                                        ? 'bg-primary-600 text-white shadow-sm shadow-primary-200 dark:shadow-primary-900'
                                        : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-500 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="px-4 sm:px-5 py-4 space-y-4 flex-1">
                            {/* Media Upload Area */}
                            {isMediaPost && (
                                <div>
                                    {mediaPreviews.length > 0 ? (
                                        <div className={`grid gap-2 ${mediaPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                            {mediaPreviews.map((src, i) => (
                                                <div key={i} className="relative rounded-xl overflow-hidden group aspect-square bg-secondary-100 dark:bg-secondary-800">
                                                    {postType === 'VIDEO' ? (
                                                        <video
                                                            src={src}
                                                            className="w-full h-full object-cover"
                                                            muted
                                                            playsInline
                                                            onMouseEnter={(e) => e.currentTarget.play()}
                                                            onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                                        />
                                                    ) : (
                                                        <img src={src} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                    {/* Video badge */}
                                                    {postType === 'VIDEO' && (
                                                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                                            <Video className="w-3 h-3" /> Video
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMedia(i)}
                                                        className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {postType === 'IMAGE' && mediaPreviews.length < 4 && (
                                                <button
                                                    type="button"
                                                    onClick={() => imageInputRef.current?.click()}
                                                    className="aspect-square border-2 border-dashed border-secondary-200 dark:border-secondary-700 rounded-xl flex flex-col items-center justify-center gap-1.5 text-secondary-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                    <span className="text-xs font-medium">Add more</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => postType === 'VIDEO' ? videoInputRef.current?.click() : imageInputRef.current?.click()}
                                            className="w-full border-2 border-dashed border-secondary-200 dark:border-secondary-700 rounded-2xl p-8 sm:p-10 flex flex-col items-center gap-3 text-secondary-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all group"
                                        >
                                            {postType === 'VIDEO' ? (
                                                <Film className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                            ) : (
                                                <Upload className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                            )}
                                            <div className="text-center">
                                                <p className="font-semibold text-sm">
                                                    {postType === 'VIDEO' ? 'Upload a video' : 'Upload photos'}
                                                </p>
                                                <p className="text-xs text-secondary-400 mt-1">
                                                    {postType === 'VIDEO'
                                                        ? 'MP4, MOV, WebM up to 100MB'
                                                        : 'PNG, JPG, WebP up to 25MB · Max 4 images'}
                                                </p>
                                            </div>
                                        </button>
                                    )}

                                    {/* Hidden file inputs */}
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => handleFileSelect(e, 'image')}
                                        className="hidden"
                                    />
                                    <input
                                        ref={videoInputRef}
                                        type="file"
                                        accept="video/*"
                                        onChange={(e) => handleFileSelect(e, 'video')}
                                        className="hidden"
                                    />
                                </div>
                            )}

                            {/* Content / Caption */}
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={
                                    postType === 'IMAGE' ? 'Add a caption...'
                                        : postType === 'VIDEO' ? 'Describe your video...'
                                            : "What's on your mind?"
                                }
                                rows={postType === 'TEXT' ? 5 : 3}
                                className={`w-full resize-none bg-transparent outline-none text-secondary-800 dark:text-secondary-100 placeholder:text-secondary-400 text-sm leading-relaxed ${postType === 'TEXT' ? 'min-h-[140px]' : ''}`}
                                maxLength={5000}
                            />
                            <div className="text-right text-[11px] text-secondary-300 -mt-3">{content.length}/5000</div>

                            {/* Tags */}
                            <div className="flex items-center gap-2 bg-secondary-50 dark:bg-secondary-800/60 rounded-xl px-3 py-2.5 border border-secondary-100 dark:border-secondary-700">
                                <Tag className="w-4 h-4 text-secondary-400 shrink-0" />
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="Add tags, comma separated (design, ai, startup)"
                                    className="flex-1 bg-transparent outline-none text-sm text-secondary-700 dark:text-secondary-300 placeholder:text-secondary-400 min-w-0"
                                />
                            </div>

                            {/* Category Pills */}
                            {categories.length > 0 && (
                                <div>
                                    <p className="text-[11px] font-semibold text-secondary-400 uppercase tracking-wide mb-2">Category</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {categories.slice(0, 12).map((cat) => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setCategoryId(categoryId === cat.id ? '' : cat.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${categoryId === cat.id
                                                    ? 'bg-primary-600 text-white shadow-sm'
                                                    : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                                                    }`}
                                            >
                                                {cat.icon} {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Upload progress bar */}
                        {uploading && (
                            <div className="px-4 sm:px-5 pb-2 shrink-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
                                    <span className="text-xs text-secondary-500">Uploading media... {uploadProgress}%</span>
                                </div>
                                <div className="h-1.5 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary-500 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-white dark:bg-secondary-900 px-4 sm:px-5 py-3 border-t border-secondary-100 dark:border-secondary-800 flex items-center justify-between gap-2 shrink-0">
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
                                className="px-6 font-semibold"
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
