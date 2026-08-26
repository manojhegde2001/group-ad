'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { ConnectionButton } from '@/components/profile/connection-button';
import { PostCard } from '@/components/feed/post-card';
import Masonry from 'react-masonry-css';
import { Loader2, ImageOff, Link as LinkIcon, BadgeCheck, Share2, Plus, LayoutDashboard, Phone, MapPin, MoreHorizontal, Flag, Ban, MessageSquare, Globe, EyeOff, CalendarRange, ChevronLeft } from 'lucide-react';
import { AppImage } from '@/components/ui/app-image';
import { useUserByUsername, useMe } from '@/hooks/use-api/use-user';
import { useInfinitePosts, useSavedPosts } from '@/hooks/use-api/use-posts';
import { useCreatePostModal } from '@/hooks/use-feed';
import { useReport, useBlock, useUnblock } from '@/hooks/use-api/use-moderation';
import { Button } from '@/components/ui/button';
import { Popover } from 'rizzui';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import type { PostWithRelations } from '@/types';
import { PowerTeamSuggestions } from '@/components/power-teams/PowerTeamSuggestions';
import { TeammateSuggestions } from '@/components/widgets/TeammateSuggestions';
import { LogoLoader } from '@/components/ui/logo-loader';
import RequestMeetingModal from '@/components/meetings/RequestMeetingModal';
import { useMeetings } from '@/hooks/use-api/use-meetings';

const breakpointCols = {
    default: 5,
    1920: 5,
    1536: 4,
    1280: 4,
    1024: 3,
    768: 2,
    480: 2,
};

export default function ProfileView({ username, initialPosts }: { username: string, initialPosts?: any }) {
    const router = useRouter();
    const { data: me } = useMe();
    const isOwnProfile = me?.username === username;

    // Safety net: always restore scroll when this page mounts.
    // Guards against scroll lock left behind by post detail modals on hard navigation.
    useEffect(() => {
        document.body.style.overflow = '';
    }, []);

    const {
        data: profileData,
        isLoading: loadingProfile,
        refetch: refetchProfile
    } = useUserByUsername(username);

    const reportMutation = useReport();
    const blockMutation = useBlock();
    const unblockMutation = useUnblock();

    const profile = profileData?.user;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

    // Fetch meetings to detect an existing request/accepted state with this profile
    const isBothBusiness = (me as any)?.userType === 'BUSINESS' && profile?.userType === 'BUSINESS';
    const { data: meetingsData } = useMeetings();
    const existingMeeting = isBothBusiness && profile
        ? (meetingsData?.meetings || []).find(
            (m: any) =>
                (m.requesterId === me?.id && m.receiverId === profile.id) ||
                (m.receiverId === me?.id && m.requesterId === profile.id)
          ) ?? null
        : null;

    // Refresh logic when a post is created
    const { setOnCreated } = useCreatePostModal();
    useEffect(() => {
        setOnCreated((newPost) => {
            // Refetch posts if we are on the profile
            refetchCreated();
        });
    }, [setOnCreated]);

    const {
        data: createdPostsData,
        fetchNextPage: fetchNextCreated,
        hasNextPage: hasNextCreated,
        isFetchingNextPage: isFetchingMoreCreated,
        isLoading: loadingCreated,
        refetch: refetchCreated
    } = useInfinitePosts({ 
        username,
        type: 'CREATED'
    }, {
        initialData: initialPosts ? { pages: [initialPosts], pageParams: [1] } : undefined
    });

    const {
        data: savedPostsData,
        fetchNextPage: fetchNextSaved,
        hasNextPage: hasNextSaved,
        isFetchingNextPage: isFetchingMoreSaved,
        isLoading: loadingSaved
    } = useSavedPosts({ 
        enabled: false // Saved posts moved to /boards 
    });

    const [activeTab, setActiveTab] = useState<'created' | 'saved'>('created');

    const createdPosts = useMemo(() => 
        createdPostsData?.pages.flatMap((page: any) => page.posts) || [], 
    [createdPostsData]);

    const savedPosts = useMemo(() => 
        savedPostsData?.pages.flatMap((page: any) => page.posts) || [], 
    [savedPostsData]);

    const handleShareProfile = () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({
                title: `${profile?.companyName || profile?.name}'s Profile | Vrutta`,
                text: `Check out ${profile?.companyName || profile?.name}'s profile on Vrutta`,
                url: window.location.href
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Profile link copied!');
        }
    };

    const handleReport = () => {
        if (!me) { toast.error('Please login to report'); return; }
        const reason = window.prompt('Reason for reporting this user:');
        if (reason && profile) {
            reportMutation.mutate({ targetType: 'USER', targetId: profile.id, reason });
        }
    };

    const handleBlock = () => {
        if (!me) { toast.error('Please login to block'); return; }
        if (profile && window.confirm(`Are you sure you want to block ${profile.companyName || profile.name}?`)) {
            blockMutation.mutate(profile.id);
        }
    };

    if (loadingProfile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
                <LogoLoader size={64} className="mb-4" />
                <p className="text-secondary-500 font-medium animate-pulse uppercase tracking-widest text-xs">Loading...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                <div className="w-20 h-20 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-6">
                    <ImageOff className="w-10 h-10 text-secondary-400" />
                </div>
                <h2 className="text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tight mb-2">Profile Not Found</h2>
                <p className="text-secondary-500 max-w-xs mb-8">The user you're looking for doesn't exist or has set their profile to private.</p>
                <Link href="/">
                    <Button rounded="pill" className="px-8 font-black uppercase tracking-widest text-xs h-12 shadow-xl shadow-primary-500/20">Return Home</Button>
                </Link>
            </div>
        );
    }

    return (
        <>
        <div className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
            {/* --- Back Button --- */}
            <button
                onClick={() => router.back()}
                className="mb-6 md:mb-8 flex items-center justify-center w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-800/50 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors active:scale-95"
                aria-label="Go back"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            {/* --- Profile Header --- */}
            <div className="relative mb-8 md:mb-12">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-12">
                    {/* Avatar with Ring */}
                    <div className="relative group shrink-0">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-primary-500 to-violet-500 rounded-4xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                         <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-44 md:h-44 rounded-4xl overflow-hidden border-4 border-white dark:border-secondary-900 shadow-2xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center">
                             {profile.avatar ? (
                                 <AppImage src={profile.avatar} alt={profile.companyName || profile.name} fill className="w-full h-full object-cover" />
                             ) : (
                                 <span className="text-3xl sm:text-4xl font-black text-secondary-400 uppercase">{(profile.companyName || profile.name).charAt(0)}</span>
                             )}
                         </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 w-full text-center md:text-left pt-0 md:pt-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 mb-5 md:mb-6">
                            <div className="min-w-0">
                                <h1 className="min-w-0 text-2xl sm:text-3xl md:text-4xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter flex items-center justify-center md:justify-start gap-2">
                                    <span className="break-words">{profile.companyName || profile.name}</span>
                                    {profile.userType === 'BUSINESS' && <BadgeCheck className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary-500 shrink-0" />}
                                </h1>
                                <p className="text-sm font-bold text-secondary-400 dark:text-secondary-500 break-words mt-0.5 md:mt-1">@{profile.username}</p>
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3 w-full sm:w-auto mt-3 md:mt-0">
                                {isOwnProfile ? (
                                    <>
                                        {/* Edit Profile (Primary) */}
                                        <Link href="/settings" className="flex-1 min-w-0 sm:flex-none sm:w-auto flex items-center justify-center h-10 px-4 sm:px-6 rounded-full bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 hover:bg-secondary-800 dark:hover:bg-secondary-100 shadow-lg shadow-secondary-900/20 dark:shadow-white/10 font-black uppercase tracking-widest text-[10px] whitespace-nowrap transition-all active:scale-95">
                                            Edit Profile
                                        </Link>

                                        {/* Visibility Badge */}
                                        <div className="flex items-center justify-center sm:justify-start gap-1.5 h-10 w-10 sm:w-auto px-0 sm:px-4 shrink-0 rounded-full bg-secondary-100 dark:bg-secondary-800 text-[10px] font-black uppercase tracking-widest text-secondary-600 dark:text-secondary-300">
                                            {(profile as any).visibility === 'PUBLIC' ? <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                            <span className="hidden sm:inline">{(profile as any).visibility}</span>
                                        </div>

                                        {/* Share Icon */}
                                        <ActionIcon onClick={handleShareProfile} className="h-10 w-10 shrink-0 rounded-full bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300 transition-colors">
                                            <Share2 className="w-4 h-4" />
                                        </ActionIcon>

                                        {/* My Boards */}
                                        <Link href="/boards" className="flex items-center justify-center h-10 w-10 sm:w-auto px-0 sm:px-5 shrink-0 rounded-full bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200 dark:hover:bg-secondary-700 text-secondary-900 dark:text-white font-black uppercase tracking-widest text-[10px] transition-colors gap-0 sm:gap-2">
                                            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" /> <span className="hidden sm:inline">My Boards</span>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <ConnectionButton
                                            userId={profile.id}
                                            targetName={profile.companyName || profile.name}
                                            initialStatus={profile.connectionStatus}
                                            isInitiator={profile.connectionInitiator}
                                            mutualConnections={(profile as any).mutualConnections}
                                            className="flex-1 min-w-0 sm:flex-none sm:w-auto h-10 whitespace-nowrap"
                                        />

                                        {profile.messagingEnabled && ((profile as any).visibility === 'PUBLIC' || profile.connectionStatus === 'ACCEPTED') && (
                                            <Link href={`/messages?userId=${profile.id}`} className="flex items-center justify-center h-10 w-10 sm:w-auto px-0 sm:px-5 shrink-0 rounded-full bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200 dark:hover:bg-secondary-700 text-secondary-900 dark:text-white font-black uppercase tracking-widest text-[10px] transition-colors gap-0 sm:gap-2">
                                                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                                                <span className="hidden sm:inline">Message</span>
                                            </Link>
                                        )}

                                        <ActionIcon onClick={handleShareProfile} className="h-10 w-10 shrink-0 rounded-full bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300 transition-colors">
                                            <Share2 className="w-4 h-4" />
                                        </ActionIcon>

                                        <Popover
                                            isOpen={isMenuOpen}
                                            setIsOpen={setIsMenuOpen}
                                            placement="bottom-end"
                                        >
                                            <Popover.Trigger>
                                                <ActionIcon className="h-10 w-10 shrink-0 rounded-full bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300 transition-colors">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </ActionIcon>
                                            </Popover.Trigger>
                                            <Popover.Content className="w-44 p-2 bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-700">
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        onClick={handleReport}
                                                        className="w-full flex items-center gap-2 text-sm font-bold py-2.5 px-3 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors text-secondary-900 dark:text-white"
                                                    >
                                                        <Flag className="w-4 h-4" /> Report
                                                    </button>
                                                    <button
                                                        onClick={handleBlock}
                                                        className="w-full flex items-center gap-2 text-sm font-bold py-2.5 px-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                                                    >
                                                        <Ban className="w-4 h-4" /> Block
                                                    </button>
                                                </div>
                                            </Popover.Content>
                                        </Popover>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-center md:justify-start gap-8 sm:gap-10 md:gap-12 mb-6 md:mb-8">
                            <div className="text-center md:text-left transition-transform hover:scale-105">
                                <p className="text-xl sm:text-2xl font-black text-secondary-900 dark:text-white leading-none">{profile._count?.posts || 0}</p>
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-1">Posts</p>
                            </div>
                            <div className="text-center md:text-left transition-transform hover:scale-105">
                                <p className="text-xl sm:text-2xl font-black text-secondary-900 dark:text-white leading-none">{profile._count?.connections || 0}</p>
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-1">Connections</p>
                            </div>
                        </div>

                        {/* Bio & Links */}
                        <div className="max-w-2xl mx-auto md:mx-0 space-y-3 md:space-y-4">
                            {profile.bio && <p className="text-secondary-700 dark:text-secondary-300 font-medium leading-relaxed break-words">{profile.bio}</p>}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 text-sm font-bold">
                                {profile.location && (
                                    <div className="flex items-center gap-1.5 text-secondary-500 min-w-0">
                                        <MapPin className="w-4 h-4 shrink-0" /> <span className="break-words">{profile.location}</span>
                                    </div>
                                )}
                                {profile.website && (
                                    <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary-500 hover:underline min-w-0">
                                        <LinkIcon className="w-4 h-4 shrink-0" /> <span className="break-words">{profile.websiteLabel || profile.website.replace(/^https?:\/\//, '')}</span>
                                    </a>
                                )}
                                {profile.phone && (isOwnProfile || profile.phoneVisibility === 'PRIMARY' || profile.phoneVisibility === 'BOTH') && (
                                    <div className="flex items-center gap-1.5 text-secondary-500">
                                        <Phone className="w-4 h-4 shrink-0" /> {profile.phone}
                                        {isOwnProfile && profile.phoneVisibility !== 'PRIMARY' && profile.phoneVisibility !== 'BOTH' && (
                                            <span className="text-[10px] bg-secondary-100 dark:bg-secondary-800 px-1.5 py-0.5 rounded text-secondary-400 dark:text-secondary-500 uppercase font-bold">Only you</span>
                                        )}
                                    </div>
                                )}
                                {profile.secondaryPhone && (isOwnProfile || profile.phoneVisibility === 'SECONDARY' || profile.phoneVisibility === 'BOTH') && (
                                    <div className="flex items-center gap-1.5 text-secondary-500">
                                        <Phone className="w-4 h-4 shrink-0" /> {profile.secondaryPhone}
                                        {isOwnProfile && profile.phoneVisibility !== 'SECONDARY' && profile.phoneVisibility !== 'BOTH' && (
                                            <span className="text-[10px] bg-secondary-100 dark:bg-secondary-800 px-1.5 py-0.5 rounded text-secondary-400 dark:text-secondary-500 uppercase font-bold">Only you</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Power Team Suggestions: teammates of the viewed user (Disabled/Commented for future use) */}
                {/* {!isOwnProfile && (profile as any).powerTeam && (
                    <PowerTeamSuggestions
                        team={(profile as any).powerTeam}
                        viewedUserName={profile.companyName || profile.name}
                    />
                )} */}

                {/* Connection Suggestions for own profile */}
                {isOwnProfile && (
                    <div className="mt-6 md:mt-8">
                        <TeammateSuggestions limit={8} />
                    </div>
                )}
            </div>

            {/* --- Tabs --- */}
            <div className="border-t border-secondary-100 dark:border-secondary-800">
                <div className="flex justify-center -mt-px gap-12 sm:gap-16">
                    <div className="py-4 flex items-center gap-2 border-t-2 border-secondary-900 dark:border-white text-secondary-900 dark:text-white">
                        <Plus className="w-4 h-4 fill-current" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">Posts</span>
                    </div>
                </div>
            </div>

            {/* --- Grid Content --- */}
            <div className="mt-8">
                {loadingCreated ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => <div key={i} className="aspect-[4/5] bg-secondary-100 dark:bg-secondary-800 rounded-2xl animate-pulse" />)}
                    </div>
                ) : (profile as any).visibility === 'PRIVATE' && (profile as any).connectionStatus !== 'ACCEPTED' && !isOwnProfile ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 bg-secondary-50 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-6">
                            <MapPin className="w-8 h-8 text-secondary-300" />
                        </div>
                        <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight mb-2">This Account is Private</h3>
                        <p className="text-sm text-secondary-500 max-w-[240px]">Connect with {profile.companyName || profile.name} to see their professional updates.</p>
                    </div>
                ) : createdPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 bg-secondary-50 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-6">
                            <ImageOff className="w-8 h-8 text-secondary-300" />
                        </div>
                        <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight mb-2">No Posts Yet</h3>
                        <p className="text-sm text-secondary-500 max-w-[240px]">Share your first enterprise professional update today.</p>
                    </div>
                ) : (
                    <Masonry
                        breakpointCols={breakpointCols}
                        className="flex -ml-2 sm:-ml-2.5 md:-ml-3 w-auto"
                        columnClassName="pl-2 sm:pl-2.5 md:pl-3 bg-clip-padding"
                    >
                        {createdPosts.map((post: PostWithRelations) => (
                            <div key={post.id} className="mb-2 sm:mb-2.5 md:mb-3">
                                <PostCard post={post} />
                            </div>
                        ))}
                    </Masonry>
                )}

                {/* Load More */}
                {hasNextCreated && (
                    <div className="flex justify-center mt-12 mb-8">
                        <Button
                            variant="outline"
                            rounded="pill"
                            isLoading={isFetchingMoreCreated}
                            onClick={() => fetchNextCreated()}
                            className="px-8 font-black uppercase tracking-widest text-[10px] h-11"
                        >
                            Load More
                        </Button>
                    </div>
                )}
            </div>
        </div>

        {/* 1:1 Meeting Request Modal (Disabled/Commented for future use) */}
        {/* {profile && isMeetingModalOpen && (
            <RequestMeetingModal
                isOpen={isMeetingModalOpen}
                onClose={() => setIsMeetingModalOpen(false)}
                receiver={{
                    id: profile.id,
                    name: profile.name,
                    companyName: profile.companyName,
                    avatar: profile.avatar,
                }}
            />
        )} */}
        </>
    );
}

function ActionIcon({ children, className, ...props }: any) {
    return (
        <button
            className={cn(
                "flex items-center justify-center transition-all active:scale-95 disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
