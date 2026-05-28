'use client';

import { useState } from 'react';
import { Modal } from 'rizzui';
import { 
    X, Copy, Check, Share2, MessageSquare, Twitter, Linkedin, 
    Users, Search, Send, Loader2, ArrowRight 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useConnections } from '@/hooks/use-api/use-connections';
import { useInviteConnections } from '@/hooks/use-api/use-events';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface ShareInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    eventName: string;
    eventSlug: string;
}

export default function ShareInviteModal({
    isOpen,
    onClose,
    eventId,
    eventName,
    eventSlug
}: ShareInviteModalProps) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'link' | 'connections'>('link');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const { data: connectionsData, isLoading: loadingConns } = useConnections();
    const inviteMutation = useInviteConnections();

    // Generate absolute sharing url
    const shareUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/events/${eventSlug}` 
        : '';

    const handleCopy = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    // Social Sharing Links
    const shareWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this amazing event on Vrutta: "${eventName}"\n${shareUrl}`)}`;
    const shareTwitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this event: "${eventName}"`)}&url=${encodeURIComponent(shareUrl)}`;
    const shareLinkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

    // Filter connections list
    const connections = connectionsData?.connections || [];
    const activeConnections = connections.filter(c => c.status === 'ACCEPTED');
    
    const filteredConnections = activeConnections.filter(c => {
        const contact = c.user;
        if (!contact) return false;
        const name = contact.name || '';
        const username = contact.username || '';
        const query = searchQuery.toLowerCase();
        return name.toLowerCase().includes(query) || username.toLowerCase().includes(query);
    });

    const toggleSelectUser = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId]
        );
    };

    const handleSendInvites = () => {
        if (selectedUsers.length === 0) {
            toast.error('Select at least one connection to invite.');
            return;
        }

        inviteMutation.mutate({ eventId, userIds: selectedUsers }, {
            onSuccess: () => {
                setSelectedUsers([]);
                onClose();
            }
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6 bg-white dark:bg-secondary-900 rounded-[2.5rem] max-w-md mx-auto relative border border-secondary-100 dark:border-secondary-800">
                <button 
                    onClick={onClose}
                    className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                >
                    <X className="w-5 h-5 text-secondary-400" />
                </button>

                <div className="flex flex-col space-y-6 pt-2">
                    <div className="text-center space-y-1">
                        <h3 className="text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tight flex items-center justify-center gap-2">
                            <Share2 className="w-6 h-6 text-primary-500" /> Share & Invite
                        </h3>
                        <p className="text-xs text-secondary-500 leading-snug max-w-xs mx-auto">
                            Share this event with the world or invite your team and connections in Vrutta.
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-secondary-100 dark:border-secondary-800 p-1 bg-secondary-50 dark:bg-secondary-950 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('link')}
                            className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                                activeTab === 'link' 
                                    ? 'bg-white dark:bg-secondary-900 text-primary-600 dark:text-white shadow-sm' 
                                    : 'text-secondary-400 hover:text-secondary-600'
                            }`}
                        >
                            Quick Share
                        </button>
                        <button
                            onClick={() => setActiveTab('connections')}
                            className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                                activeTab === 'connections' 
                                    ? 'bg-white dark:bg-secondary-900 text-primary-600 dark:text-white shadow-sm' 
                                    : 'text-secondary-400 hover:text-secondary-600'
                            }`}
                        >
                            Invite Connections
                        </button>
                    </div>

                    {activeTab === 'link' ? (
                        <div className="space-y-6">
                            {/* Copy Link field */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-secondary-400">Event URL</label>
                                <div className="flex gap-2 bg-secondary-50 dark:bg-secondary-950 p-2 rounded-2xl border border-secondary-100 dark:border-secondary-800">
                                    <input 
                                        type="text" 
                                        value={shareUrl} 
                                        readOnly
                                        className="flex-1 bg-transparent text-xs text-secondary-600 dark:text-secondary-300 font-semibold px-2 outline-none select-all"
                                    />
                                    <button 
                                        onClick={handleCopy}
                                        className="p-2.5 rounded-xl bg-white dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 shadow-sm text-secondary-600 dark:text-white hover:text-primary-500 transition-colors"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Social Shares */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-wider text-secondary-400 text-center block">Or Share Via</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <a 
                                        href={shareWhatsApp} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center p-4 rounded-3xl bg-emerald-50 hover:bg-emerald-100/80 transition-colors border border-emerald-100/50"
                                    >
                                        <MessageSquare className="w-6 h-6 text-emerald-600 mb-1" />
                                        <span className="text-[9px] font-black uppercase text-emerald-700">WhatsApp</span>
                                    </a>
                                    <a 
                                        href={shareLinkedIn} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center p-4 rounded-3xl bg-blue-50 hover:bg-blue-100/80 transition-colors border border-blue-100/50"
                                    >
                                        <Linkedin className="w-6 h-6 text-blue-600 mb-1" />
                                        <span className="text-[9px] font-black uppercase text-blue-700">LinkedIn</span>
                                    </a>
                                    <a 
                                        href={shareTwitter} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center p-4 rounded-3xl bg-secondary-50 hover:bg-secondary-100/80 transition-colors border border-secondary-100/50"
                                    >
                                        <Twitter className="w-6 h-6 text-secondary-800 dark:text-white mb-1" />
                                        <span className="text-[9px] font-black uppercase text-secondary-700 dark:text-secondary-300">Twitter</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Search bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search connections by name..."
                                    className="w-full bg-secondary-50 dark:bg-secondary-950 rounded-2xl pl-10 pr-4 py-2.5 text-xs outline-none border border-secondary-100 dark:border-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Connections list */}
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-secondary-200">
                                {loadingConns ? (
                                    <div className="flex flex-col items-center py-8 text-secondary-400 gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                                        <span className="text-[10px] uppercase font-black">Loading Connections...</span>
                                    </div>
                                ) : filteredConnections.length === 0 ? (
                                    <div className="text-center py-8 text-secondary-400 flex flex-col items-center gap-2">
                                        <Users className="w-8 h-8 opacity-40" />
                                        <span className="text-[10px] uppercase font-black">No Connections Found</span>
                                    </div>
                                ) : (
                                    filteredConnections.map((c) => {
                                        const contact = c.user;
                                        const isSelected = selectedUsers.includes(contact.id);
                                        return (
                                            <div 
                                                key={contact.id}
                                                onClick={() => toggleSelectUser(contact.id)}
                                                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer border transition-all ${
                                                    isSelected 
                                                        ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-900/40' 
                                                        : 'bg-white dark:bg-secondary-900 border-secondary-50 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-800'
                                                }`}
                                            >
                                                <Avatar 
                                                    src={contact.avatar || undefined} 
                                                    name={contact.name} 
                                                    size="sm" 
                                                />
                                                <div className="flex-1 text-left min-w-0">
                                                    <p className="text-xs font-bold text-secondary-900 dark:text-white truncate">{contact.name}</p>
                                                    <p className="text-[10px] text-secondary-400 truncate">@{contact.username} · {contact.companyName || 'Individual'}</p>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                                    isSelected 
                                                        ? 'bg-primary-500 border-primary-500 text-white' 
                                                        : 'border-secondary-200 dark:border-secondary-700 bg-transparent'
                                                }`}>
                                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Invite button */}
                            {selectedUsers.length > 0 && (
                                <Button
                                    onClick={handleSendInvites}
                                    disabled={inviteMutation.isPending}
                                    className="w-full mt-2 py-6 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-primary-200 dark:shadow-none flex items-center justify-center gap-2"
                                >
                                    {inviteMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send {selectedUsers.length} Invitation{selectedUsers.length > 1 ? 's' : ''}
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
