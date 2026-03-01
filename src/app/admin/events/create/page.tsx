'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ChevronRight, ChevronLeft, Check, Calendar, MapPin, Users, Image, Send } from 'lucide-react';
import { format } from 'date-fns';

const EVENT_TYPES = ['MEETUP', 'WEBINAR', 'WORKSHOP', 'CONFERENCE', 'NETWORKING'];

interface FormData {
    title: string;
    description: string;
    eventType: string;
    categoryId: string;
    startDate: string;
    endDate: string;
    timezone: string;
    isOnline: boolean;
    venue: string;
    meetingLink: string;
    maxAttendees: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    targetUserTypes: string[];
    coverImage: string;
    status: 'DRAFT' | 'PUBLISHED';
}

const steps = [
    { label: 'Basic Info', icon: Calendar },
    { label: 'Date & Location', icon: MapPin },
    { label: 'Targeting', icon: Users },
    { label: 'Media', icon: Image },
    { label: 'Review', icon: Send },
];

export default function CreateEventPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<FormData>({
        title: '',
        description: '',
        eventType: 'MEETUP',
        categoryId: '',
        startDate: '',
        endDate: '',
        timezone: 'Asia/Kolkata',
        isOnline: false,
        venue: '',
        meetingLink: '',
        maxAttendees: '',
        visibility: 'PUBLIC',
        targetUserTypes: [],
        coverImage: '',
        status: 'PUBLISHED',
    });

    const set = (key: keyof FormData, val: any) => setForm((f) => ({ ...f, [key]: val }));
    const toggleUserType = (ut: string) =>
        set('targetUserTypes', form.targetUserTypes.includes(ut)
            ? form.targetUserTypes.filter((x) => x !== ut)
            : [...form.targetUserTypes, ut]);

    const handleSubmit = async (statusOverride: 'DRAFT' | 'PUBLISHED' = form.status) => {
        setLoading(true);
        try {
            const payload = {
                ...form,
                status: statusOverride,
                maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees) : undefined,
                meetingLink: form.meetingLink || undefined,
                categoryId: form.categoryId || undefined,
                coverImage: form.coverImage || undefined,
            };

            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create event');

            toast.success(`Event ${statusOverride === 'DRAFT' ? 'saved as draft' : 'published'}!`);
            router.push('/admin/events');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const canNext = () => {
        if (step === 0) return form.title.length >= 3 && form.description.length >= 10 && form.eventType;
        if (step === 1) return form.startDate && form.endDate && (form.isOnline ? true : form.venue || form.meetingLink);
        return true;
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Create New Event</h1>
                <p className="text-sm text-secondary-500 mt-0.5">Fill in the details below to schedule a meeting or event</p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
                {steps.map((s, i) => {
                    const Icon = s.icon;
                    const done = i < step;
                    const active = i === step;
                    return (
                        <div key={s.label} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? 'bg-primary-600 text-white' :
                                    active ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500' :
                                        'bg-secondary-100 dark:bg-secondary-800 text-secondary-400'
                                }`}>
                                {done ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                            </div>
                            <span className={`text-xs font-medium hidden sm:inline ${active ? 'text-primary-700 dark:text-primary-400' : 'text-secondary-400'}`}>
                                {s.label}
                            </span>
                            {i < steps.length - 1 && <div className={`flex-1 h-px w-4 sm:w-8 ${i < step ? 'bg-primary-400' : 'bg-secondary-200 dark:bg-secondary-700'}`} />}
                        </div>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-100 dark:border-secondary-800 p-6">
                {/* Step 0 — Basic Info */}
                {step === 0 && (
                    <div className="space-y-5">
                        <h2 className="font-semibold text-secondary-800 dark:text-white mb-1">Basic Information</h2>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Event Title *</label>
                            <input
                                value={form.title}
                                onChange={(e) => set('title', e.target.value)}
                                placeholder="e.g. Q1 Business Networking Meetup"
                                className="w-full px-4 py-2.5 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Description *</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => set('description', e.target.value)}
                                rows={5}
                                placeholder="Describe the event, agenda, what attendees should expect..."
                                className="w-full px-4 py-2.5 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Event Type *</label>
                            <div className="flex flex-wrap gap-2">
                                {EVENT_TYPES.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => set('eventType', t)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${form.eventType === t
                                                ? 'bg-primary-600 text-white border-primary-600'
                                                : 'border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-400 hover:border-primary-400'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 1 — Date & Location */}
                {step === 1 && (
                    <div className="space-y-5">
                        <h2 className="font-semibold text-secondary-800 dark:text-white mb-1">Date & Location</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Start Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    value={form.startDate}
                                    onChange={(e) => set('startDate', e.target.value + ':00Z')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">End Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    value={form.endDate}
                                    onChange={(e) => set('endDate', e.target.value + ':00Z')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Event Format</label>
                            <div className="flex gap-3">
                                {[{ label: '📍 In-Person', value: false }, { label: '💻 Online', value: true }].map((opt) => (
                                    <button
                                        key={String(opt.value)}
                                        type="button"
                                        onClick={() => set('isOnline', opt.value)}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${form.isOnline === opt.value
                                                ? 'bg-primary-600 text-white border-primary-600'
                                                : 'border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-400 hover:border-primary-300'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!form.isOnline && (
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Venue / Address</label>
                                <input
                                    value={form.venue}
                                    onChange={(e) => set('venue', e.target.value)}
                                    placeholder="e.g. WeWork, Koramangala, Bangalore"
                                    className="w-full px-4 py-2.5 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                                Meeting Link {form.isOnline ? '*' : '(optional)'}
                            </label>
                            <input
                                value={form.meetingLink}
                                onChange={(e) => set('meetingLink', e.target.value)}
                                placeholder="https://meet.google.com/xxx or https://zoom.us/j/xxx"
                                className="w-full px-4 py-2.5 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                            />
                        </div>
                    </div>
                )}

                {/* Step 2 — Targeting */}
                {step === 2 && (
                    <div className="space-y-5">
                        <h2 className="font-semibold text-secondary-800 dark:text-white mb-1">Targeting & Capacity</h2>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Target Audience</label>
                            <div className="flex gap-2">
                                {['INDIVIDUAL', 'BUSINESS', 'ADMIN'].map((ut) => (
                                    <button
                                        key={ut}
                                        type="button"
                                        onClick={() => toggleUserType(ut)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${form.targetUserTypes.includes(ut)
                                                ? 'bg-primary-600 text-white border-primary-600'
                                                : 'border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-400 hover:border-primary-400'
                                            }`}
                                    >
                                        {ut}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-secondary-400 mt-1.5">Leave empty to target all user types</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Max Attendees (optional)</label>
                            <input
                                type="number"
                                value={form.maxAttendees}
                                onChange={(e) => set('maxAttendees', e.target.value)}
                                placeholder="Leave empty for unlimited"
                                min="1"
                                className="w-full px-4 py-2.5 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Visibility</label>
                            <div className="flex gap-3">
                                {[{ label: '🌐 Public', value: 'PUBLIC' }, { label: '🔒 Private', value: 'PRIVATE' }].map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => set('visibility', opt.value)}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${form.visibility === opt.value
                                                ? 'bg-primary-600 text-white border-primary-600'
                                                : 'border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-400 hover:border-primary-300'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3 — Media */}
                {step === 3 && (
                    <div className="space-y-5">
                        <h2 className="font-semibold text-secondary-800 dark:text-white mb-1">Cover Image</h2>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Cover Image URL (optional)</label>
                            <input
                                value={form.coverImage}
                                onChange={(e) => set('coverImage', e.target.value)}
                                placeholder="Paste a Cloudinary or image URL"
                                className="w-full px-4 py-2.5 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                            />
                        </div>
                        {form.coverImage && (
                            <div className="rounded-xl overflow-hidden aspect-video bg-secondary-100 dark:bg-secondary-800">
                                <img src={form.coverImage} alt="Cover preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            </div>
                        )}
                        {!form.coverImage && (
                            <div className="rounded-xl aspect-video bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center">
                                <p className="text-white font-semibold text-lg opacity-80 text-center px-8">{form.title || 'Event Cover'}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4 — Review */}
                {step === 4 && (
                    <div className="space-y-5">
                        <h2 className="font-semibold text-secondary-800 dark:text-white mb-1">Review & Publish</h2>

                        <div className="rounded-xl overflow-hidden border border-secondary-100 dark:border-secondary-800">
                            {form.coverImage
                                ? <img src={form.coverImage} alt="Cover" className="w-full h-32 object-cover" />
                                : <div className="w-full h-32 bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center">
                                    <p className="text-white text-sm font-semibold opacity-80">{form.title}</p>
                                </div>
                            }
                            <div className="p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-secondary-900 dark:text-white">{form.title}</h3>
                                    <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full font-medium">{form.eventType}</span>
                                </div>
                                <p className="text-xs text-secondary-500">{form.description.slice(0, 120)}{form.description.length > 120 ? '...' : ''}</p>
                                {form.startDate && (
                                    <p className="text-xs text-secondary-600 dark:text-secondary-400">
                                        📅 {format(new Date(form.startDate), 'EEEE, MMM d, yyyy · h:mm a')}
                                    </p>
                                )}
                                {form.isOnline
                                    ? <p className="text-xs text-secondary-500">💻 Online Event</p>
                                    : form.venue && <p className="text-xs text-secondary-500">📍 {form.venue}</p>
                                }
                                {form.maxAttendees && <p className="text-xs text-secondary-500">👥 Max {form.maxAttendees} attendees</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation buttons */}
                <div className={`flex items-center mt-6 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
                    {step > 0 && (
                        <button
                            type="button"
                            onClick={() => setStep((s) => s - 1)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                    )}

                    {step < steps.length - 1 ? (
                        <button
                            type="button"
                            onClick={() => setStep((s) => s + 1)}
                            disabled={!canNext()}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleSubmit('DRAFT')}
                                disabled={loading}
                                className="px-4 py-2.5 border border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-xl text-sm font-semibold hover:bg-secondary-50 dark:hover:bg-secondary-800 disabled:opacity-50 transition-all"
                            >
                                Save Draft
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSubmit('PUBLISHED')}
                                disabled={loading}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all"
                            >
                                {loading ? '...' : <><Send className="w-4 h-4" /> Publish Event</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
