import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import {
    Calendar,
    MapPin,
    Clock,
    Users,
    Globe,
    Share2,
    ExternalLink,
    ShieldCheck,
    ArrowLeft,
    CheckCircle2,
    Info
} from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import EnrollmentButton from '@/components/events/EnrollmentButton';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    const event = await prisma.event.findFirst({
        where: {
            OR: [
                { slug: slug },
                ...(isObjectId ? [{ id: slug }] : [])
            ]
        }
    });

    if (!event) return { title: 'Event Not Found' };

    return {
        title: `${event.title} | Group Ad Events`,
        description: event.description.slice(0, 160),
        openGraph: {
            title: event.title,
            description: event.description.slice(0, 160),
            images: event.coverImage ? [event.coverImage] : [],
        }
    };
}

export default async function EventDetailPage({ params }: Props) {
    const { slug } = await params;
    const session = await auth();

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    const event = await prisma.event.findFirst({
        where: {
            OR: [
                { slug: slug },
                ...(isObjectId ? [{ id: slug }] : [])
            ]
        },
        include: {
            category: true,
            organizer: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true,
                    bio: true,
                    userType: true
                }
            },
            _count: {
                select: { enrollments: true }
            }
        }
    });

    if (!event || (event.status !== 'PUBLISHED' && (session?.user as any)?.userType !== 'ADMIN')) {
        notFound();
    }

    const isEnrolled = session?.user?.id ? await prisma.eventEnrollment.findUnique({
        where: { eventId_userId: { eventId: event.id, userId: session.user.id } }
    }) : null;

    const isPast = new Date(event.endDate) < new Date();

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
            {/* Hero Section */}
            <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
                {event.coverImage ? (
                    <>
                        <img
                            src={event.coverImage}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-secondary-900 to-transparent opacity-60" />
                    </>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-600 to-primary-900" />
                )}

                <div className="absolute inset-0 flex flex-col justify-end px-4 py-12 md:px-12 max-w-screen-xl mx-auto w-full">
                    <Link
                        href="/events/calendar"
                        className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 text-sm font-medium transition-colors backdrop-blur-md bg-white/10 w-fit px-4 py-2 rounded-full"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Calendar
                    </Link>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 rounded-full bg-primary-500 text-white text-[10px] font-bold uppercase tracking-wider">
                            {event.eventType}
                        </span>
                        {event.isOnline && (
                            <span className="px-3 py-1 rounded-full bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <Globe className="w-3 h-3" /> Online
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-3xl">
                        {event.title}
                    </h1>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-screen-xl mx-auto px-4 py-12 md:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-12">
                        <section>
                            <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-primary-500" /> About this Event
                            </h2>
                            <div className="prose dark:prose-invert max-w-none text-secondary-600 dark:text-secondary-400 leading-relaxed text-lg whitespace-pre-wrap">
                                {event.description}
                            </div>
                        </section>

                        <section className="bg-white dark:bg-secondary-900 p-8 rounded-3xl border border-secondary-100 dark:border-secondary-800">
                            <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-6">Hosted by</h2>
                            <div className="flex items-center gap-4">
                                <Avatar
                                    src={event.organizer.avatar || undefined}
                                    name={event.organizer.name}
                                    size="lg"
                                    className="ring-4 ring-primary-50 dark:ring-primary-900/20"
                                />
                                <div>
                                    <p className="font-bold text-lg text-secondary-900 dark:text-white leading-none">
                                        {event.organizer.name}
                                    </p>
                                    <p className="text-sm text-secondary-500 mt-1">
                                        @{event.organizer.username} · {event.organizer.userType}
                                    </p>
                                </div>
                                <Link
                                    href={`/profile/${event.organizer.username}`}
                                    className="ml-auto text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline uppercase tracking-widest"
                                >
                                    View Profile
                                </Link>
                            </div>
                            {event.organizer.bio && (
                                <p className="mt-4 text-sm text-secondary-500 border-t border-secondary-50 dark:border-secondary-800 pt-4 italic">
                                    "{event.organizer.bio}"
                                </p>
                            )}
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
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${isPast ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                                }`}>
                                                {isPast ? 'Past' : 'Live'}
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
                                        <div className="flex items-center gap-3 text-secondary-600 dark:text-secondary-400">
                                            <Users className="w-5 h-5 text-primary-500" />
                                            <span className="text-sm font-semibold">
                                                {event._count.enrollments} Guests {event.maxAttendees ? `/ ${event.maxAttendees} max` : 'enrolled'}
                                            </span>
                                        </div>
                                    </div>

                                    <EnrollmentButton
                                        eventId={event.id}
                                        isEnrolledInitial={!!isEnrolled}
                                        isPast={isPast}
                                    />

                                    <div className="mt-6 flex items-center justify-center gap-8 border-t border-secondary-50 dark:border-secondary-800 pt-6">
                                        <button className="flex flex-col items-center gap-1 group">
                                            <div className="w-10 h-10 rounded-full border border-secondary-100 dark:border-secondary-800 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-all font-semibold">
                                                <Share2 className="w-4 h-4 text-secondary-400 group-hover:text-primary-500" />
                                            </div>
                                            <span className="text-[10px] font-bold text-secondary-400 group-hover:text-secondary-900 dark:group-hover:text-white uppercase tracking-tighter transition-colors">Share</span>
                                        </button>
                                        <button className="flex flex-col items-center gap-1 group">
                                            <div className="w-10 h-10 rounded-full border border-secondary-100 dark:border-secondary-800 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-all font-semibold">
                                                <ExternalLink className="w-4 h-4 text-secondary-400 group-hover:text-primary-500" />
                                            </div>
                                            <span className="text-[10px] font-bold text-secondary-400 group-hover:text-secondary-900 dark:group-hover:text-white uppercase tracking-tighter transition-colors">Add to Cal</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-primary-50 dark:bg-primary-900/10 rounded-3xl p-6 border border-primary-100 dark:border-primary-900/20">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                    <div>
                                        <p className="text-sm font-bold text-primary-900 dark:text-primary-100 leading-none">Verified Event</p>
                                        <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 opacity-80">Moderated by Group Ad HQ</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
