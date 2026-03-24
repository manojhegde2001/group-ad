'use client';

import { useState, useRef, useEffect } from 'react';
import { useCreatePost } from '@/hooks/use-feed';
import { useAuth } from '@/hooks/use-auth';
import {
    X, Image as ImageIcon, Type, Tag, Globe, Lock,
    Upload, Loader2, CheckCircle, Plus, Video, Film,
    Tags,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Select } from 'rizzui';

type PostType = 'IMAGE' | 'VIDEO' | 'TEXT';

export function CreatePostModal() {
    const { isOpen, close, notifyCreated, editingPost } = useCreatePost();
    const { user } = useAuth();

    const [postType, setPostType] = useState<PostType>('IMAGE');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Check verification status
    const isVerified = (user as any)?.verificationStatus === 'VERIFIED';
    const isAdmin = (user as any)?.userType === 'ADMIN';
    const isBusiness = (user as any)?.userType === 'BUSINESS';
    const isAllowed = isAdmin || isBusiness;

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    // Populate editing data
    useEffect(() => {
        if (editingPost) {
            setPostType(editingPost.type as PostType);
            setContent(editingPost.content);
            setTags(editingPost.tags.join(', '));
            setVisibility(editingPost.visibility as 'PUBLIC' | 'PRIVATE');
            setMediaPreviews(editingPost.images);
            // We set mediaFiles to empty because we are using existing URLs
            setMediaFiles([]);
        }
    }, [editingPost, user]);



    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (!isAllowed) {
                toast.error('Only business accounts can create/edit posts');
                close();
            }
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, isAllowed, close]);

    const reset = () => {
        setContent('');
        setTags('');
        setVisibility('PUBLIC');
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
                    if (res.status === 413) {
                        throw new Error('File is too large for the server. Please try a smaller file (Max: 25MB for images, 100MB for videos).');
                    }
                    
                    let errMsg = 'Upload failed';
                    try {
                        const err = await res.json();
                        errMsg = err.error || errMsg;
                    } catch (e) {
                        // Not JSON, use default or status text
                        errMsg = res.statusText || errMsg;
                    }
                    throw new Error(errMsg);
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
        if ((postType === 'IMAGE' || postType === 'VIDEO') && mediaPreviews.length === 0) {
            toast.error(`Please add at least one ${postType === 'VIDEO' ? 'video' : 'image'}`);
            return;
        }

        setSubmitting(true);
        try {
            // Upload only NEW files
            const newMediaUrls = await uploadToCloudinary();
            
            // Get EXISTING URLs from previews (those that aren't blob URLs)
            const existingUrls = mediaPreviews.filter(p => !p.startsWith('blob:'));
            
            const finalMediaUrls = [...existingUrls, ...newMediaUrls];

            const parsedTags = tags
                .split(',')
                .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
                .filter(Boolean);

            const url = editingPost ? `/api/posts/${editingPost.id}` : '/api/posts';
            const method = editingPost ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: postType,
                    content: content.trim(),
                    images: finalMediaUrls,
                    tags: parsedTags,
                    visibility,
                }),
            });

            if (!res.ok) {
                if (res.status === 413) {
                    throw new Error('Post data is too large. Try reducing the number of images or text length.');
                }
                
                let errMsg = `Failed to ${editingPost ? 'update' : 'publish'} post`;
                try {
                    const err = await res.json();
                    errMsg = err.error || errMsg;
                } catch (e) {
                    errMsg = res.statusText || errMsg;
                }
                throw new Error(errMsg);
            }

            const data = await res.json();
            setSuccess(true);
            toast.success(`Post ${editingPost ? 'updated' : 'published'}! 🎉`);
            
            setTimeout(() => {
                reset();
                notifyCreated(data.post);
            }, 1200);
        } catch (err: any) {
            toast.error(err.message || `Failed to ${editingPost ? 'update' : 'publish'} post`);
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
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-secondary-100 dark:border-secondary-800 shrink-0 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <Avatar
                            src={user?.avatar as string | undefined}
                            name={(user?.name as string) || 'User'}
                            size="sm"
                            rounded="full"
                            color="primary"
                            className="w-9 h-9 border-2 border-primary-500/10"
                        />
                        <div>
                            <p className="text-[13px] font-black text-secondary-900 dark:text-white leading-tight uppercase tracking-tight">
                                {user?.name as string}
                            </p>
                            <button
                                onClick={() => setVisibility(visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
                                className="flex items-center gap-1 text-[10px] font-bold text-secondary-400 hover:text-primary-500 transition-colors uppercase tracking-widest mt-0.5"
                            >
                                {visibility === 'PUBLIC'
                                    ? <><Globe className="w-3 h-3" /> Public</>
                                    : <><Lock className="w-3 h-3" /> Private</>
                                }
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-secondary-100/50 dark:bg-secondary-800/50 hover:bg-secondary-200 dark:hover:bg-secondary-700 text-secondary-500 transition-all active:scale-90"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Success state */}
                {success ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 gap-5 px-6 text-center animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <div>
                            <p className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">Post Published!</p>
                            <p className="text-secondary-400 text-sm font-medium mt-1">Your content is now visible to the community.</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col min-h-0 custom-scrollbar">
                        <div className="px-5 sm:px-6 py-6 space-y-6 flex-1">
                            {/* Content / Caption */}
                            <textarea
                                autoFocus
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's happening? Share your thoughts..."
                                className="w-full resize-none bg-transparent border-none outline-none text-secondary-900 dark:text-secondary-100 placeholder:text-secondary-400 text-lg font-medium leading-relaxed min-h-[120px] focus:ring-0"
                                maxLength={5000}
                            />

                            {/* Media Previews */}
                            {mediaPreviews.length > 0 && (
                                <div className={`grid gap-3 ${mediaPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    {mediaPreviews.map((src, i) => (
                                        <div key={i} className="relative rounded-2xl overflow-hidden group aspect-[4/3] bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-100 dark:border-secondary-800 shadow-sm transition-transform hover:scale-[1.01]">
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
                                            
                                            {postType === 'VIDEO' && (
                                                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-lg font-black flex items-center gap-1.5 uppercase tracking-widest border border-white/10">
                                                    <Video className="w-3 h-3" /> Video
                                                </div>
                                            )}
                                            
                                            <button
                                                type="button"
                                                onClick={() => removeMedia(i)}
                                                className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {postType === 'IMAGE' && mediaPreviews.length < 4 && (
                                        <button
                                            type="button"
                                            onClick={() => imageInputRef.current?.click()}
                                            className="aspect-[4/3] border-2 border-dashed border-secondary-200 dark:border-secondary-700/50 rounded-2xl flex flex-col items-center justify-center gap-2 text-secondary-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all group active:scale-95"
                                        >
                                            <div className="p-3 rounded-full bg-secondary-50 dark:bg-secondary-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/20 transition-colors">
                                                <Plus className="w-5 h-5" />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-widest">Add More</span>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Tags Input (Secondary) */}
                            <div className="flex items-center gap-3 bg-secondary-50 dark:bg-secondary-800/40 rounded-2xl px-4 py-3 border border-secondary-100 dark:border-secondary-800/50 focus-within:ring-2 ring-primary-500/20 transition-all">
                                <Tags className="w-4 h-4 text-secondary-400 shrink-0" />
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="Add tags separated by comma (e.g. design, tech)"
                                    className="flex-1 bg-transparent outline-none text-sm font-bold text-secondary-800 dark:text-secondary-200 placeholder:text-secondary-400/80 min-w-0"
                                />
                            </div>
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="sticky bottom-0 bg-white dark:bg-secondary-900 border-t border-secondary-100 dark:border-secondary-800 px-4 sm:px-6 py-4 flex flex-col gap-4">
                            {uploading && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-secondary-500">Uploading Media</span>
                                        </div>
                                        <span className="text-[10px] font-black text-primary-500">{uploadProgress}%</span>
                                    </div>
                                    <div className="h-1 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-500 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                {/* Action Buttons */}
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        title="Photo"
                                        disabled={postType === 'VIDEO'}
                                        onClick={() => { setPostType('IMAGE'); imageInputRef.current?.click(); }}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 hover:text-primary-500 transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        title="Video"
                                        disabled={postType === 'IMAGE' && mediaPreviews.length > 0}
                                        onClick={() => { setPostType('VIDEO'); videoInputRef.current?.click(); }}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 hover:text-primary-500 transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                        <Film className="w-5 h-5" />
                                    </button>
                                    <div className="h-5 w-px bg-secondary-100 dark:bg-secondary-800 mx-1" />
                                    <div className="text-[10px] font-black text-secondary-300 uppercase tracking-widest px-2">
                                        {content.length}/5000
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        type="submit"
                                        variant="solid"
                                        color="primary"
                                        rounded="pill"
                                        isLoading={submitting || uploading}
                                        disabled={submitting || uploading || !content.trim()}
                                        className="h-11 px-8 font-black text-xs uppercase tracking-[0.1em] shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 active:scale-[0.98] transition-all"
                                    >
                                        {editingPost ? 'Update Post' : 'Publish Post'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Hidden Inputs */}
                        <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={(e) => handleFileSelect(e, 'image')} className="hidden" />
                        <input ref={videoInputRef} type="file" accept="video/*" onChange={(e) => handleFileSelect(e, 'video')} className="hidden" />
                    </form>
                )}
            </div>
        </div>
    );
}
