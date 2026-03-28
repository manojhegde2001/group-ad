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
import { Modal, Button } from 'rizzui';
import { Avatar } from '@/components/ui/avatar';

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
    const [isDragging, setIsDragging] = useState(false);
    
    // Check verification status
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
            setMediaFiles([]);
        }
    }, [editingPost, user]);

    // Validation
    useEffect(() => {
        if (isOpen && !isAllowed) {
            toast.error('Only business accounts can create/edit posts');
            close();
        }
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
        setIsDragging(false);
    };

    const handleClose = () => {
        reset();
        close();
    };

    const processFiles = (files: File[]) => {
        if (files.length === 0) return;

        const validFiles = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
        if (validFiles.length === 0) {
            toast.error('Please select valid image or video files');
            return;
        }

        const currentTotal = mediaFiles.length;
        if (currentTotal + validFiles.length > 5) {
            toast.error('Maximum 5 files allowed');
            return;
        }

        const newFiles: File[] = [];
        const newPreviews: string[] = [];

        validFiles.forEach(file => {
            if (file.type.startsWith('video/')) {
                if (file.size > 100 * 1024 * 1024) {
                    toast.error(`${file.name} is too large (Max: 100MB video)`);
                    return;
                }
            } else {
                if (file.size > 25 * 1024 * 1024) {
                    toast.error(`${file.name} is too large (Max: 25MB image)`);
                    return;
                }
            }
            newFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        });

        if (newFiles.length > 0) {
            setMediaFiles(prev => [...prev, ...newFiles]);
            setMediaPreviews(prev => [...prev, ...newPreviews]);
            const hasVideo = [...mediaFiles, ...newFiles].some(f => f.type.startsWith('video/'));
            setPostType(hasVideo ? 'VIDEO' : 'IMAGE');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        processFiles(files);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const removeMedia = (index: number) => {
        URL.revokeObjectURL(mediaPreviews[index]);
        const newFiles = mediaFiles.filter((_, i) => i !== index);
        const newPreviews = mediaPreviews.filter((_, i) => i !== index);
        setMediaFiles(newFiles);
        setMediaPreviews(newPreviews);
        
        if (newPreviews.length === 0) {
            setPostType('IMAGE');
        }
    };

    const uploadToCloudinary = async (): Promise<string[]> => {
        if (mediaFiles.length === 0) return [];
        setUploading(true);
        setUploadProgress(0);

        const uploaded: string[] = [];

        try {
            for (let i = 0; i < mediaFiles.length; i++) {
                const file = mediaFiles[i];
                const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
                const formData = new FormData();
                formData.append('file', file);
                formData.append('resource_type', resourceType);

                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!res.ok) {
                    if (res.status === 413) {
                        throw new Error(`File too large: ${file.name}`);
                    }
                    let errMsg = 'Upload failed';
                    try {
                        const err = await res.json();
                        errMsg = err.error || errMsg;
                    } catch (e) {
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
            const newMediaUrls = await uploadToCloudinary();
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
            toast.error(err.message || 'Error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            containerClassName="flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <div
                className={`relative w-full sm:max-w-2xl bg-white dark:bg-secondary-900 sm:rounded-3xl shadow-2xl overflow-hidden max-h-[96vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl border border-transparent transition-all duration-300 m-auto ${isDragging ? 'border-primary-500 scale-[1.02] ring-4 ring-primary-500/20' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={handleDrop}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Overlay */}
                {isDragging && (
                    <div className="absolute inset-0 z-50 bg-primary-500/10 backdrop-blur-[2px] flex flex-col items-center justify-center border-4 border-dashed border-primary-500 rounded-3xl animate-in fade-in duration-200 pointer-events-none">
                        <div className="bg-white dark:bg-secondary-900 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
                            <Upload className="w-10 h-10 text-primary-500 animate-bounce" />
                            <p className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight">Drop to Upload</p>
                            <p className="text-sm text-secondary-500">Release to add files to your post</p>
                        </div>
                    </div>
                )}

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
                            <div className="flex items-center gap-2 mt-0.5">
                                <button
                                    type="button"
                                    onClick={() => setVisibility('PUBLIC')}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${visibility === 'PUBLIC' ? 'bg-green-500/10 text-green-600 ring-1 ring-green-500/20' : 'text-secondary-400 hover:text-secondary-600'}`}
                                >
                                    <Globe className="w-2.5 h-2.5" />
                                    Public
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVisibility('PRIVATE')}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${visibility === 'PRIVATE' ? 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20' : 'text-secondary-400 hover:text-secondary-600'}`}
                                >
                                    <Lock className="w-2.5 h-2.5" />
                                    Private
                                </button>
                            </div>
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
                            <p className="text-sm text-secondary-500">Your content is now visible to the community.</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col min-h-0 custom-scrollbar">
                        <div className="px-5 sm:px-6 py-6 space-y-4 flex-1">
                            <textarea
                                autoFocus
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's happening? Share your thoughts..."
                                className="w-full resize-none bg-transparent border-none outline-none text-secondary-900 dark:text-secondary-100 placeholder:text-secondary-400 text-lg font-medium leading-relaxed min-h-[100px] max-h-[300px] focus:ring-0"
                                maxLength={5000}
                            />

                            {mediaPreviews.length > 0 && (
                                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {mediaPreviews.map((src, i) => {
                                        const isVideoItem = (mediaFiles[i]?.type.startsWith('video/')) || (src.includes('/video/upload/') || src.match(/\.(mp4|mov|avi|webm|mkv)/i));
                                        return (
                                            <div key={i} className="relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden group bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-100 dark:border-secondary-800 shadow-sm transition-transform hover:scale-[1.05]">
                                                {isVideoItem ? (
                                                    <video src={src} className="w-full h-full object-cover" muted playsInline />
                                                ) : (
                                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                                )}
                                                {isVideoItem && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                        <Film className="w-6 h-6 text-white drop-shadow-lg" />
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedia(i)}
                                                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {mediaPreviews.length < 5 && (
                                        <button
                                            type="button"
                                            onClick={() => imageInputRef.current?.click()}
                                            className="shrink-0 w-24 h-24 border-2 border-dashed border-secondary-200 dark:border-secondary-700/50 rounded-2xl flex flex-col items-center justify-center gap-1 text-secondary-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all group active:scale-95"
                                        >
                                            <Plus className="w-5 h-5" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Add</span>
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-3 bg-secondary-50 dark:bg-secondary-800/40 rounded-2xl px-4 py-3 border border-secondary-100 dark:border-secondary-800/50 focus-within:ring-2 ring-primary-500/20 transition-all">
                                <Tags className="w-4 h-4 text-secondary-400 shrink-0" />
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="Add tags separated by comma"
                                    className="flex-1 bg-transparent outline-none text-sm font-bold text-secondary-800 dark:text-secondary-200 placeholder:text-secondary-400/80 min-w-0"
                                />
                            </div>
                        </div>

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
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        title="Photo"
                                        onClick={() => imageInputRef.current?.click()}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 hover:text-primary-500 transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        title="Video"
                                        onClick={() => videoInputRef.current?.click()}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 hover:text-primary-500 transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                        <Film className="w-5 h-5" />
                                    </button>
                                    <div className="h-5 w-px bg-secondary-100 dark:bg-secondary-800 mx-1" />
                                    <div className="text-[10px] font-black text-secondary-300 uppercase tracking-widest px-2">
                                        {content.length}/5000
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    variant="solid"
                                    color="primary"
                                    rounded="pill"
                                    isLoading={submitting || uploading}
                                    disabled={submitting || uploading || !content.trim()}
                                    className="h-11 px-8 font-black text-xs uppercase tracking-[0.1em] shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 active:scale-[0.98] transition-all"
                                >
                                    {editingPost ? 'Update' : 'Publish'}
                                </Button>
                            </div>
                        </div>

                        <input ref={imageInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileSelect} className="hidden" />
                        <input ref={videoInputRef} type="file" accept="video/*,image/*" multiple onChange={handleFileSelect} className="hidden" />
                    </form>
                )}
            </div>
        </Modal>
    );
}
