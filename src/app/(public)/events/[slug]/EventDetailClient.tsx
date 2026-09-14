'use client';

import { format } from 'date-fns';
import {
    Calendar,
    MapPin,
    Clock,
    Users,
    Globe,
    Share2,
    ExternalLink,
    ChevronLeft,
    Info,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import EnrollmentButton from '@/components/events/EnrollmentButton';
import { useEvent } from '@/hooks/use-api/use-events';
import { notFound, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AttendanceTicket } from '@/components/events/attendance-ticket';
import { AppImage } from '@/components/ui/app-image';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import ShareInviteModal from '@/components/events/ShareInviteModal';
import AttendeesManager from '@/components/events/AttendeesManager';
import { downloadICSFile } from '@/lib/calendar-export';

const QRScannerModal = dynamic(() => import('@/components/events/qr-scanner-modal').then(mod => mod.QRScannerModal), { ssr: false });

export default function EventDetailClient({ slug }: { slug: string }) {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const { data, isLoading, error, refetch } = useEvent(slug);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            </div>
        );
    }

    const event = data?.event;
    if (!event || error) {
        notFound();
    }

    const userEnrollment = data?.userEnrollment;
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const isPast = end < now;
    const isCancelled = event.status === 'CANCELLED';
    const isLive = start <= now && !isPast;
    const statusLabel = isCancelled ? 'Cancelled' : isPast ? 'Ended' : isLive ? 'Live now' : 'Upcoming';
    const statusTone = isCancelled
        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
        : isPast
            ? 'bg-secondary-200 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-400'
            : isLive
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400';
    const seatsLeft: number | null = event.seatsLeft ?? null;
    const ineligibleReason: string | null =
        event.eligibility && !event.eligibility.ok ? event.eligibility.message : null;
    const hasCover = !!event.coverImage;

    const badges = (
        <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-full bg-primary-500 text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider shadow-sm">
                {event.eventType}
            </span>
            {event.isOnline && (
                <span className="px-2.5 py-1 rounded-full bg-green-500 text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Globe className="w-3 h-3" /> Online
                </span>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
            {hasCover ? (
                /* Hero with cover image */
                <div className="relative h-[32vh] min-h-[240px] md:h-[42vh] md:min-h-[340px] w-full overflow-hidden">
                    <AppImage
                        src={event.coverImage}
                        alt={event.title}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary-900 via-secondary-900/40 to-transparent opacity-80" />
                    <button
                        onClick={() => router.back()}
                        aria-label="Go back"
                        className="absolute top-4 left-4 md:top-6 md:left-6 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 dark:bg-secondary-900/70 backdrop-blur-xl text-secondary-900 dark:text-white shadow-lg border border-white/40 dark:border-secondary-700/50 hover:bg-white dark:hover:bg-secondary-900 transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 w-full px-4 sm:px-6 lg:px-8 pb-6 md:pb-10 space-y-3">
                        {badges}
                        <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight max-w-4xl drop-shadow-2xl">
                            {event.title}
                        </h1>
                    </div>
                </div>
            ) : (
                /* Compact header (no cover image) */
                <div className="w-full px-4 sm:px-6 lg:px-8 pt-6 md:pt-10">
                    <button
                        onClick={() => router.back()}
                        aria-label="Go back"
                        className="mb-6 flex items-center justify-center w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-800/50 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors active:scale-95"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="space-y-3">
                        {badges}
                        <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-secondary-900 dark:text-white leading-tight max-w-4xl">
                            {event.title}
                        </h1>
                    </div>
                </div>
            )}

            {/* Content Section */}
            <div className={`w-full px-4 sm:px-6 lg:px-8 pb-8 md:pb-12 ${hasCover ? 'pt-8 md:pt-12' : 'pt-6 md:pt-8'}`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">

                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-12">
                        {(currentUser?.id === event.organizerId || (currentUser as any)?.userType === 'ADMIN') && (
                            <AttendeesManager eventId={event.id} />
                        )}
                        <section>
                            <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-primary-500" /> About this Event
                            </h2>
                            <div className="prose dark:prose-invert max-w-3xl text-secondary-600 dark:text-secondary-400 leading-relaxed text-lg whitespace-pre-wrap">
                                {event.description}
                            </div>
                        </section>

                        {/* Venue / Link */}
                        <section className="bg-secondary-100/50 dark:bg-secondary-800/30 p-8 rounded-3xl">
                            <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-6 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary-500" /> Venue Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest mb-1">Location Type</p>
                                    <p className="font-semibold text-secondary-800 dark:text-secondary-200">
                                        {event.isOnline ? 'Online via Video' : 'In-Person Venue'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest mb-1">
                                        {event.isOnline ? 'Meeting Platform' : 'Address'}
                                    </p>
                                    <p className="font-semibold text-secondary-800 dark:text-secondary-200">
                                        {event.isOnline ? 'Access provided after enrollment' : (event.venue || 'TBA')}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-white dark:bg-secondary-900 rounded-[2.5rem] shadow-2xl shadow-secondary-200/50 dark:shadow-none border border-secondary-100 dark:border-secondary-800 overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
                                <div className="p-8">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest mb-1">Starts at</p>
                                            <p className="text-lg font-black text-secondary-900 dark:text-white">
                                                {format(new Date(event.startDate), 'h:mm a')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest mb-1">Status</p>
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${statusTone}`}>
                                                {statusLabel}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center gap-3 text-secondary-600 dark:text-secondary-400">
                                            <Calendar className="w-5 h-5 text-primary-500" />
                                            <span className="text-sm font-semibold">{format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-secondary-600 dark:text-secondary-400">
                                            <Clock className="w-5 h-5 text-primary-500" />
                                            <span className="text-sm font-semibold">Ends at {format(new Date(event.endDate), 'h:mm a')}</span>
                                        </div>
                                        {seatsLeft != null && (
                                            <div className="flex items-center gap-3 text-secondary-600 dark:text-secondary-400">
                                                <Users className="w-5 h-5 text-primary-500" />
                                                <span className="text-sm font-semibold">
                                                    {seatsLeft > 0 ? `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left` : 'Fully booked'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <EnrollmentButton
                                        eventId={event.id}
                                        enrollmentStatus={userEnrollment?.status || null}
                                        isPast={isPast}
                                        isCancelled={isCancelled}
                                        seatsLeft={seatsLeft}
                                        ineligibleReason={ineligibleReason}
                                    />

                                    <div className="pt-4 flex flex-col gap-3">
                                        {userEnrollment?.status === 'APPROVED' && (
                                            <AttendanceTicket 
                                                eventId={event.id} 
                                                eventName={event.title} 
                                            />
                                        )}
                                        
                                        {(currentUser?.id === event.organizerId || (currentUser as any)?.userType === 'ADMIN') && (
                                            <QRScannerModal 
                                                eventId={event.id} 
                                                eventName={event.title}
                                                onSuccess={() => refetch()}
                                            />
                                        )}
                                    </div>

                                    <div className="mt-6 flex items-center justify-center gap-8 border-t border-secondary-50 dark:border-secondary-800 pt-6">
                                        <button 
                                            onClick={() => setIsShareModalOpen(true)}
                                            className="flex flex-col items-center gap-1 group"
                                        >
                                            <div className="w-10 h-10 rounded-full border border-secondary-100 dark:border-secondary-800 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-all font-semibold">
                                                <Share2 className="w-4 h-4 text-secondary-400 group-hover:text-primary-500" />
                                            </div>
                                            <span className="text-[10px] font-bold text-secondary-400 group-hover:text-secondary-900 dark:group-hover:text-white uppercase tracking-tighter transition-colors">Share</span>
                                        </button>
                                        <button 
                                            onClick={() => downloadICSFile({
                                                title: event.title,
                                                description: event.description,
                                                startDate: new Date(event.startDate),
                                                endDate: new Date(event.endDate),
                                                location: event.isOnline ? (event.meetingLink || 'Online platform') : (event.venue || 'TBA')
                                            })}
                                            className="flex flex-col items-center gap-1 group"
                                        >
                                            <div className="w-10 h-10 rounded-full border border-secondary-100 dark:border-secondary-800 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-all font-semibold">
                                                <ExternalLink className="w-4 h-4 text-secondary-400 group-hover:text-primary-500" />
                                            </div>
                                            <span className="text-[10px] font-bold text-secondary-400 group-hover:text-secondary-900 dark:group-hover:text-white uppercase tracking-tighter transition-colors">Add to Cal</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <ShareInviteModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                eventId={event.id}
                eventName={event.title}
                eventSlug={event.slug}
            />
        </div>
    );
}
