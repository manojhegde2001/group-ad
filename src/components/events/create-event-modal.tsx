'use client';

import { useState, useRef, useEffect } from 'react';
import { useCreateEvent } from '@/hooks/use-feed';
import { useAuth } from '@/hooks/use-auth';
import { useCreateEvent as useCreateEventApi } from '@/hooks/use-api/use-events';
import { useCategories } from '@/hooks/use-api/use-common';
import {
    X, Calendar, MapPin, Globe, Link2, Users,
    Upload, Loader2, CheckCircle, Plus, Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function CreateEventModal() {
    const { isOpen, close, notifyCreated } = useCreateEvent();
    const { user } = useAuth();
    const { data: categories } = useCategories();
    const createEventMutation = useCreateEventApi();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventType, setEventType] = useState('MEETUP');
    const [categoryId, setCategoryId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isOnline, setIsOnline] = useState(false);
    const [venue, setVenue] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [maxAttendees, setMaxAttendees] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const reset = () => {
        setTitle('');
        setDescription('');
        setEventType('MEETUP');
        setCategoryId('');
        setStartDate('');
        setEndDate('');
        setIsOnline(false);
        setVenue('');
        setMeetingLink('');
        setMaxAttendees('');
        setCoverImage(null);
        setImagePreview(null);
        setSuccess(false);
    };

    const handleClose = () => {
        reset();
        close();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            setCoverImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const uploadToCloudinary = async (): Promise<string | null> => {
        if (!coverImage) return null;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', coverImage);
            formData.append('resource_type', 'image');

            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            return data.url;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !startDate || !endDate || !categoryId) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const imageUrl = await uploadToCloudinary();

            const data = {
                title,
                description,
                eventType,
                categoryId,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                isOnline,
                venue: isOnline ? null : venue,
                meetingLink: isOnline ? meetingLink : null,
                maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
                coverImage: imageUrl,
                status: 'PUBLISHED',
            };

            createEventMutation.mutate(data, {
                onSuccess: (newEvent) => {
                    setSuccess(true);
                    toast.success('Event published! 🎉');
                    setTimeout(() => {
                        handleClose();
                        notifyCreated(newEvent);
                    }, 1500);
                },
            });
        } catch (err: any) {
            toast.error(err.message || 'Failed to create event');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={handleClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

            <div
                className="relative z-10 w-full sm:max-w-2xl bg-white dark:bg-secondary-900 sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in max-h-[96vh] sm:max-h-[90vh] flex flex-col rounded-t-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-secondary-100 dark:border-secondary-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-secondary-900 dark:text-white leading-tight">Create Event</h2>
                            <p className="text-xs text-secondary-500">Host an online or offline gathering</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors"
                    >
                        <X className="w-4 h-4 text-secondary-500" />
                    </button>
                </div>

                {success ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <p className="text-xl font-bold text-secondary-900 dark:text-white">Event Published!</p>
                        <p className="text-secondary-500 text-sm">Your event is now visible to the community</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
                        {/* Cover Image */}
                        <div>
                            <p className="text-sm font-semibold mb-2 text-secondary-700 dark:text-secondary-300">Cover Image</p>
                            {imagePreview ? (
                                <div className="relative aspect-video rounded-2xl overflow-hidden group border border-secondary-100 dark:border-secondary-800">
                                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setCoverImage(null); setImagePreview(null); }}
                                        className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full aspect-video border-2 border-dashed border-secondary-200 dark:border-secondary-700 rounded-2xl flex flex-col items-center justify-center gap-3 text-secondary-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all group"
                                >
                                    <ImageIcon className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                    <div className="text-center">
                                        <p className="font-semibold text-sm">Upload a cover image</p>
                                        <p className="text-xs text-secondary-400 mt-1">Recommended: 16:9 ratio, max 5MB</p>
                                    </div>
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>

                        {/* Title & Type */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="text-sm font-semibold mb-1.5 block text-secondary-700 dark:text-secondary-300">Event Title *</label>
                                <Input
                                    placeholder="Enter event name"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="rounded-xl border-secondary-200 dark:border-secondary-700 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-1.5 block text-secondary-700 dark:text-secondary-300">Event Type</label>
                                <select
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value)}
                                    className="w-full h-[44px] px-4 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                >
                                    <option value="MEETUP">Meetup</option>
                                    <option value="CONFERENCE">Conference</option>
                                    <option value="WEBINAR">Webinar</option>
                                    <option value="WORKSHOP">Workshop</option>
                                    <option value="NETWORKING">Networking</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-1.5 block text-secondary-700 dark:text-secondary-300">Category *</label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full h-[44px] px-4 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                >
                                    <option value="">Select Category</option>
                                    {categories?.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold mb-1.5 block text-secondary-700 dark:text-secondary-300">Start Date & Time *</label>
                                <Input
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="rounded-xl border-secondary-200 dark:border-secondary-700 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-1.5 block text-secondary-700 dark:text-secondary-300">End Date & Time *</label>
                                <Input
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="rounded-xl border-secondary-200 dark:border-secondary-700 focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        {/* Toggle Online/Offline */}
                        <div className="flex items-center gap-4 bg-secondary-50 dark:bg-secondary-800/60 p-4 rounded-2xl">
                            <div className={`p-2 rounded-lg ${isOnline ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                {isOnline ? <Globe className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-secondary-900 dark:text-white">{isOnline ? 'Online Event' : 'In-Person Event'}</p>
                                <p className="text-xs text-secondary-500">{isOnline ? 'Participants will join via link' : 'Participants will meet at a venue'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOnline(!isOnline)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${isOnline ? 'bg-primary-500' : 'bg-secondary-300'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isOnline ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Venue or Link */}
                        <div className="animate-in fade-in duration-300">
                            {isOnline ? (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold block text-secondary-700 dark:text-secondary-300">Meeting Link</label>
                                    <div className="relative">
                                        <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                        <Input
                                            placeholder="https://zoom.us/j/..."
                                            value={meetingLink}
                                            onChange={(e) => setMeetingLink(e.target.value)}
                                            className="pl-10 rounded-xl border-secondary-200 dark:border-secondary-700 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold block text-secondary-700 dark:text-secondary-300">Venue / Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                        <Input
                                            placeholder="Enter address or venue name"
                                            value={venue}
                                            onChange={(e) => setVenue(e.target.value)}
                                            className="pl-10 rounded-xl border-secondary-200 dark:border-secondary-700 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-sm font-semibold mb-1.5 block text-secondary-700 dark:text-secondary-300">About the Event *</label>
                            <Textarea
                                placeholder="What is this event about? Highlights, guest speakers, agenda..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="rounded-xl border-secondary-200 dark:border-secondary-700 focus:ring-primary-500 resize-none"
                            />
                        </div>

                        {/* Max Attendees */}
                        <div className="w-1/2">
                            <label className="text-sm font-semibold mb-1.5 block text-secondary-700 dark:text-secondary-300 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Max Capacity
                            </label>
                            <Input
                                type="number"
                                placeholder="Unlimited"
                                value={maxAttendees}
                                onChange={(e) => setMaxAttendees(e.target.value)}
                                className="rounded-xl border-secondary-200 dark:border-secondary-700 focus:ring-primary-500"
                            />
                        </div>
                    </form>
                )}

                {/* Footer */}
                {!success && (
                    <div className="sticky bottom-0 bg-white dark:bg-secondary-900 px-5 py-4 border-t border-secondary-100 dark:border-secondary-800 flex items-center justify-between gap-3 shrink-0">
                        <Button
                            type="button"
                            onClick={handleClose}
                            variant="text"
                            color="secondary"
                            rounded="pill"
                            className="font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="solid"
                            color="primary"
                            rounded="pill"
                            isLoading={submitting || uploading}
                            disabled={submitting || uploading}
                            className="px-8 font-bold shadow-lg shadow-primary-500/20"
                        >
                            {uploading ? 'Uploading...' : submitting ? 'Publishing...' : 'Publish Event'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
