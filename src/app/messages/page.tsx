'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Search, Send, Plus, MessageSquare, X, Loader2, ArrowLeft, MoreVertical, Info, Users, Phone, Camera, Mic, Image as ImageIcon, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { useSocket } from '@/components/providers/socket-provider';

interface Conversation {
  id: string;
  participants: { id: string; name: string; username: string; avatar: string | null }[];
  lastMessage: { content: string; sender: { name: string } } | null;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  conversationId: string;
  sender: { id: string; name: string; username: string; avatar: string | null };
}

interface FollowedUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  userType: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { refresh: refreshUnreadBadge } = useUnreadMessages();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('userId');
  
  // Tabs & Lists
  const [activeTab, setActiveTab] = useState<'messages' | 'contacts'>('messages');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [followingUsers, setFollowingUsers] = useState<FollowedUser[]>([]);
  
  // Loading states
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  
  // Selected Chat
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  
  // Input & UI
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { socket, isConnected } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollConvsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live state for other user typing
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  // We keep a slow poll as a fallback, but primary updates are live via socket

  // Filtered lists
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c => {
      const other = c.participants[0];
      return other?.name.toLowerCase().includes(q) || other?.username.toLowerCase().includes(q) || c.lastMessage?.content.toLowerCase().includes(q);
    });
  }, [conversations, searchQuery]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return followingUsers;
    const q = searchQuery.toLowerCase();
    return followingUsers.filter(u => 
      u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
  }, [followingUsers, searchQuery]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const otherUser = selectedConv?.participants[0];

  const fetchConversations = useCallback(async () => {
    try {
      const r = await fetch('/api/conversations');
      const d = await r.json();
      setConversations(d.conversations || []);
    } catch { /* silent */ }
  }, []);

  const fetchFollowing = useCallback(async () => {
    setLoadingFollowing(true);
    try {
      const r = await fetch('/api/users/following');
      const d = await r.json();
      setFollowingUsers(d.users || []);
    } catch { /* silent */ }
    finally { setLoadingFollowing(false); }
  }, []);

  // Load conversations on mount + slow fallback poll
  useEffect(() => {
    fetchConversations().finally(() => setLoadingConvs(false));
    pollConvsRef.current = setInterval(fetchConversations, 60_000); // Slowed down from 15s to 60s
    return () => { if (pollConvsRef.current) clearInterval(pollConvsRef.current); };
  }, [fetchConversations]);

  // Load following when switching to contacts tab
  useEffect(() => {
    if (activeTab === 'contacts' && followingUsers.length === 0) {
      fetchFollowing();
    }
  }, [activeTab, followingUsers.length, fetchFollowing]);

  // Handle initial user from redirect
  useEffect(() => {
    if (initialUserId && !loadingConvs && conversations.length > 0) {
      // Check if we already have a conversation with this user
      const existing = conversations.find(c => c.participants.some(p => p.id === initialUserId));
      if (existing) {
        setSelectedConvId(existing.id);
        setShowMobileChat(true);
      } else {
        // Start a new conversation
        startConversation(initialUserId);
      }
    }
  }, [initialUserId, loadingConvs, conversations]);

  const markConversationRead = useCallback(async (convId: string) => {
    try {
      await fetch(`/api/conversations/${convId}/read`, { method: 'PATCH' });
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
      refreshUnreadBadge();
    } catch { /* silent */ }
  }, [refreshUnreadBadge]);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const r = await fetch(`/api/conversations/${convId}/messages`);
      const d = await r.json();
      setMessages(d.messages || []);
    } catch { /* silent */ }
  }, []);

  // Join Room & Live Listeners
  useEffect(() => {
    if (!socket || !isConnected || !selectedConvId) return;

    // Join the conversation room (Ensures re-join on reconnect)
    socket.emit('join-conversation', selectedConvId);

    const onNewMessage = (msg: Message) => {
      console.log('💬 Socket: new_message received', msg.id);
      if (msg.conversationId === selectedConvId) {
        setMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        markConversationRead(selectedConvId);
        setIsOtherTyping(false); // Stop typing immediately when msg arrives
      }
      
      // Update sidebar
      setConversations((prev) => {
        const existing = prev.find(c => c.id === msg.conversationId);
        if (!existing) {
          fetchConversations();
          return prev;
        }
        return prev.map(c => c.id === msg.conversationId 
          ? { ...c, lastMessage: { content: msg.content, sender: msg.sender }, lastMessageAt: msg.createdAt, unreadCount: msg.conversationId === selectedConvId ? 0 : c.unreadCount + 1 } 
          : c
        ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      });
    };

    const onUserTyping = (data: { conversationId: string; userId: string; name: string }) => {
        if (data.conversationId === selectedConvId && data.userId !== user?.id) {
            setIsOtherTyping(true);
            setTypingUser(data.name);
        }
    };

    const onUserStopTyping = (data: { conversationId: string; userId: string }) => {
        if (data.conversationId === selectedConvId && data.userId !== user?.id) {
            setIsOtherTyping(false);
        }
    };

    socket.on('new_message', onNewMessage);
    socket.on('user_typing', onUserTyping);
    socket.on('user_stop_typing', onUserStopTyping);

    return () => {
      socket.emit('leave-conversation', selectedConvId);
      socket.off('new_message', onNewMessage);
      socket.off('user_typing', onUserTyping);
      socket.off('user_stop_typing', onUserStopTyping);
    };
  }, [socket, isConnected, selectedConvId, user?.id, markConversationRead, fetchConversations]);

  // Handle Input Changes with Typing Emission
  useEffect(() => {
    if (!socket || !selectedConvId || !messageInput.trim()) {
        if (socket && selectedConvId) {
            socket.emit('stop_typing', { conversationId: selectedConvId, userId: user?.id });
        }
        return;
    }

    // Emit typing
    socket.emit('typing', { conversationId: selectedConvId, userId: user?.id, name: user?.name });

    // Set timeout to stop typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { conversationId: selectedConvId, userId: user?.id });
    }, 3000);

    return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
  }, [messageInput, socket, selectedConvId, user]);

  // Handle Global Notifications for other updates
  useEffect(() => {
    if (!socket) return;
    
    const onNotification = (payload: any) => {
      if (payload.type === 'MESSAGE_RECEIVED') {
        // Handled by new_message listener if it's a message
        // But we might want to refresh unread badges
        refreshUnreadBadge();
      } else {
          // For other notifications, refresh the conversations list just in case
          fetchConversations();
      }
    };
    
    socket.on('notification', onNotification);
    socket.on('refresh_unread', () => {
        fetchConversations();
        refreshUnreadBadge();
    });
    
    return () => {
      socket.off('notification', onNotification);
      socket.off('refresh_unread');
    };
  }, [socket, fetchConversations, refreshUnreadBadge]);

  // Initial load for selected conversation
  useEffect(() => {
    if (!selectedConvId) return;
    setLoadingMsgs(true);
    setMessages([]);
    fetchMessages(selectedConvId).finally(() => setLoadingMsgs(false));
    markConversationRead(selectedConvId);
  }, [selectedConvId, fetchMessages, markConversationRead]);

  const lastConvIdRef = useRef<string | null>(null);

  useEffect(() => {
    const isNewConv = selectedConvId !== lastConvIdRef.current;
    lastConvIdRef.current = selectedConvId;
    
    messagesEndRef.current?.scrollIntoView({ 
      behavior: isNewConv ? 'auto' : 'smooth' 
    });
  }, [messages, selectedConvId, isOtherTyping]);

  const startConversation = async (participantId: string) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId }),
      });
      const data = await res.json();
      if (data.conversation) {
        await fetchConversations();
        setSelectedConvId(data.conversation.id);
        setActiveTab('messages');
        setShowMobileChat(true);
        setSearchQuery('');
      }
    } catch { /* silent */ }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConvId || sending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      content,
      conversationId: selectedConvId,
      createdAt: new Date().toISOString(),
      senderId: user?.id as string,
      sender: { id: user?.id as string, name: user?.name as string, username: (user as any)?.username, avatar: (user as any)?.avatar },
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/conversations/${selectedConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => prev.map((m) => m.id === optimistic.id ? data.message : m));
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConvId
              ? { ...c, lastMessage: { content, sender: { name: user?.name as string } }, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-64px)] md:h-screen bg-white dark:bg-secondary-950 overflow-hidden">

      {/* Left: Sidebar */}
      <div className={cn(
        'w-full md:w-[320px] lg:w-[360px] border-r border-secondary-100 dark:border-secondary-800 flex flex-col shrink-0 bg-white dark:bg-secondary-950',
        showMobileChat ? 'hidden md:flex' : 'flex'
      )}>
        {/* Header with Tabs */}
        <div className="pt-5 md:pt-8 px-4 md:px-6 pb-4 flex flex-col gap-4 md:gap-6 shrink-0 bg-white dark:bg-secondary-950">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter">Messages</h1>
            <button className="w-10 h-10 rounded-full bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center text-secondary-900 dark:text-white hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors">
                <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-1.5 p-1 bg-secondary-50/50 dark:bg-secondary-900/50 rounded-2xl w-full border border-secondary-100 dark:border-secondary-800">
            <button
              onClick={() => setActiveTab('messages')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-black uppercase tracking-widest rounded-[0.8rem] transition-all',
                activeTab === 'messages' 
                  ? 'bg-white dark:bg-secondary-800 text-primary-600 shadow-sm border border-secondary-100 dark:border-secondary-700' 
                  : 'text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200'
              )}
            >
              Primary
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-black uppercase tracking-widest rounded-[0.8rem] transition-all',
                activeTab === 'contacts' 
                  ? 'bg-white dark:bg-secondary-800 text-primary-600 shadow-sm border border-secondary-100 dark:border-secondary-700' 
                  : 'text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200'
              )}
            >
              General
            </button>
          </div>

          {/* Unified Search Bar - Instagram style */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-secondary-50 dark:bg-secondary-900 border-none rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold outline-none ring-1 ring-secondary-200 dark:ring-secondary-800 focus:ring-2 ring-primary-500/20 transition-all placeholder:text-secondary-400"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'messages' ? (
            /* Recent Conversations */
            <>
              {loadingConvs ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-20 px-6 text-center gap-3 md:gap-4 animate-in fade-in duration-500">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-secondary-50 dark:bg-secondary-900 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center shadow-inner">
                    <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-secondary-200" />
                  </div>
                  <div>
                    <p className="font-black text-base md:text-lg text-secondary-900 dark:text-white leading-tight">No messages yet</p>
                    <p className="text-[10px] md:text-xs text-secondary-400 mt-1 max-w-[180px] md:max-w-[200px]">Check your contacts list to start a new conversation.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('contacts')}
                    className="mt-1 md:mt-2 px-5 md:px-6 py-2 md:py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                  >
                    View Contacts
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const other = conv.participants[0];
                  const isSelected = conv.id === selectedConvId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => { setSelectedConvId(conv.id); setShowMobileChat(true); }}
                      className={cn(
                        'w-full flex items-center gap-4 px-4 md:px-6 py-4 md:py-5 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-all text-left relative group',
                        isSelected && 'bg-primary-50/30 dark:bg-primary-900/10'
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar src={other?.avatar ?? undefined} name={other?.name || '?'} size="lg" className="w-14 h-14 md:w-16 md:h-16 border-2 border-transparent group-hover:border-primary-200 dark:group-hover:border-primary-900/30 transition-all shadow-sm" />
                        {conv.unreadCount > 0 && (
                          <div className="absolute top-0 right-0 w-5 h-5 bg-primary-500 border-2 border-white dark:border-secondary-950 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-[10px] text-white font-black">{conv.unreadCount}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <p className={cn('font-black text-sm md:text-[15px] truncate tracking-tight', isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-900 dark:text-white')}>
                            {other?.name || 'Unknown'}
                          </p>
                          <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest shrink-0 ml-2">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                          </p>
                        </div>
                        <p className={cn('text-xs md:text-sm truncate font-medium max-w-[90%]', conv.unreadCount > 0 ? 'text-secondary-900 dark:text-white font-bold' : 'text-secondary-400')}>
                          {conv.lastMessage?.content || 'Sent a message'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </>
          ) : (
            /* Contacts List */
            <>
              {loadingFollowing ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-20 px-6 text-center gap-4 animate-in fade-in duration-500">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-secondary-50 dark:bg-secondary-900 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center shadow-inner">
                    <Users className="w-8 h-8 md:w-10 md:h-10 text-secondary-200" />
                  </div>
                  <div>
                    <p className="font-black text-base md:text-lg text-secondary-900 dark:text-white">No contacts found</p>
                    <p className="text-[10px] md:text-xs text-secondary-400 mt-1 max-w-[200px]">You haven't followed anyone yet or no results match your search.</p>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <div className="px-4 py-2 mb-1 md:mb-2">
                     <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">All Contacts ({filteredContacts.length})</p>
                  </div>
                  {filteredContacts.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => startConversation(u.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 md:py-3 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-all text-left group"
                    >
                      <Avatar src={u.avatar ?? undefined} name={u.name} size="md" className="w-10 h-10 md:w-11 md:h-11 shrink-0 shadow-sm group-hover:ring-2 ring-primary-500/20" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-xs md:text-sm text-secondary-900 dark:text-white uppercase tracking-tight truncate">{u.name}</p>
                        <p className="text-[10px] md:text-[11px] text-secondary-400 font-bold uppercase tracking-widest truncate">@{u.username}</p>
                      </div>
                      <div className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-secondary-50 dark:bg-secondary-800 text-secondary-400 group-hover:bg-primary-500 group-hover:text-white transition-all shadow-sm">
                        <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 rotate-180" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right: Chat View */}
      <div className={cn(
        'flex-1 flex-col min-w-0 h-full',
        showMobileChat ? 'flex' : 'hidden md:flex'
      )}>
        {!selectedConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-8 gap-4 md:gap-6 bg-[#f6f7fb] dark:bg-secondary-950/50">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] md:rounded-[3.5rem] bg-white dark:bg-secondary-900 flex items-center justify-center shadow-xl shadow-secondary-200/50 dark:shadow-none relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl md:rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-primary-500" />
              </div>
            </div>
            <div className="max-w-xs animate-in slide-in-from-bottom-4 duration-700">
              <h3 className="font-black text-2xl md:text-3xl text-secondary-900 dark:text-white tracking-tight leading-tight">Your Inbox</h3>
              <p className="text-secondary-400 text-[13px] md:text-sm mt-2 md:mt-3 font-medium leading-relaxed">Select a conversation or browse your contacts to start a new connection.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header - Instagram style */}
            <div className="px-4 md:px-8 py-4 md:py-6 border-b border-secondary-100 dark:border-secondary-800 flex items-center justify-between shrink-0 bg-white/95 dark:bg-secondary-950/95 backdrop-blur-xl sticky top-0 z-20 shadow-sm shadow-secondary-900/5">
              <div className="flex items-center gap-3 md:gap-5">
                <button onClick={() => { setShowMobileChat(false); }} className="md:hidden -ml-2 p-2.5 hover:bg-secondary-100 dark:hover:bg-secondary-900 rounded-full transition-colors active:scale-95">
                    <ArrowLeft className="w-6 h-6 text-secondary-900 dark:text-white" />
                </button>
                <Link href={`/profile/${otherUser?.username}`} className="flex items-center gap-3 md:gap-4 group">
                    <div className="relative">
                        <Avatar src={otherUser?.avatar ?? undefined} name={otherUser?.name || '?'} size="lg" className="w-11 h-11 md:w-14 md:h-14 border-2 border-white dark:border-secondary-900 group-hover:border-primary-200 transition-all shadow-md" />
                        <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-secondary-950 rounded-full shadow-sm" />
                    </div>
                    <div>
                        <p className="font-black text-secondary-900 dark:text-white text-base md:text-[18px] leading-tight group-hover:text-primary-600 transition-colors tracking-tight">{otherUser?.name}</p>
                        <p className="text-[10px] md:text-xs text-secondary-400 font-bold uppercase tracking-widest mt-1">Active Now</p>
                    </div>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <button title="Phone" className="hidden sm:flex p-3 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-50 dark:hover:bg-secondary-900 rounded-full transition-all">
                    <Phone className="w-5 h-5" />
                </button>
                <button title="Info" className="p-3 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-50 dark:hover:bg-secondary-900 rounded-full transition-all">
                    <Info className="w-5.5 h-5.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4 space-y-2 md:space-y-3 bg-white dark:bg-secondary-950">
              {loadingMsgs ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-16 gap-3 text-center animate-in fade-in duration-700">
                  <div className="relative mb-2">
                    <Avatar src={otherUser?.avatar ?? undefined} name={otherUser?.name || '?'} size="xl" className="w-16 h-16 md:w-20 md:h-20 shadow-xl" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 md:w-5 md:h-5 bg-emerald-400 border-4 border-white dark:border-secondary-950 rounded-full" />
                  </div>
                  <p className="font-black text-lg md:text-xl text-secondary-900 dark:text-white uppercase tracking-tight">{otherUser?.name}</p>
                  <p className="text-xs md:text-sm text-secondary-400 font-medium">Be the first to say "Hello!"</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.senderId === (user?.id as string);
                  const showAvatar = !isMine && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
                  
                  return (
                    <div key={msg.id} className={cn('flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500', isMine ? 'items-end' : 'items-start', idx > 0 && messages[idx-1].senderId === msg.senderId ? 'mt-1' : 'mt-6')}>
                      <div className={cn('flex max-w-[85%] sm:max-w-[70%]', isMine ? 'flex-row-reverse' : 'flex-row')}>
                        {!isMine && (
                          <div className="w-10 md:w-12 shrink-0 self-end mb-1">
                            {showAvatar ? (
                                <Link href={`/profile/${msg.sender.username}`} className="transition-transform hover:scale-110 block">
                                    <Avatar src={msg.sender.avatar ?? undefined} name={msg.sender.name} size="sm" className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-white dark:border-secondary-900 shadow-sm" />
                                </Link>
                            ) : <div className="w-8 h-8 md:w-9 md:h-9" />}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div className={cn(
                            'px-4 md:px-5 py-3 md:py-3.5 text-[14px] md:text-[15px] leading-relaxed shadow-sm font-medium transition-all hover:brightness-[0.98]',
                            isMine
                              ? 'bg-gradient-to-br from-primary-500 to-indigo-600 text-white rounded-[1.4rem] rounded-br-[0.3rem] font-semibold'
                              : 'bg-[#f0f2f5] dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 rounded-[1.4rem] rounded-bl-[0.3rem] shadow-secondary-100/50 dark:shadow-none'
                          )}>
                            {msg.content}
                          </div>
                          {(idx === messages.length - 1 || messages[idx + 1].senderId !== msg.senderId) && (
                              <p className={cn('text-[9px] text-secondary-400 mt-2 font-bold uppercase tracking-widest px-1 opacity-70', isMine ? 'text-right' : 'text-left')}>
                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                              </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {isOtherTyping && (
                <div className="px-4 py-1 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 text-[11px] text-secondary-400 font-bold uppercase tracking-widest italic">
                        <div className="flex gap-1">
                            <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce"></span>
                        </div>
                        {typingUser || otherUser?.name} is typing...
                    </div>
                </div>
            )}

            {/* Input - Instagram style Pill */}
            <div className="px-4 md:px-6 py-4 md:py-6 border-t border-secondary-100 dark:border-secondary-800 shrink-0 bg-white dark:bg-secondary-950">
              <form onSubmit={handleSend} className="flex items-center gap-3 max-w-5xl mx-auto w-full">
                <div className="flex-1 flex items-center bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-[2rem] px-4 md:px-6 py-2 md:py-2.5 transition-all focus-within:ring-2 ring-primary-500/20 group shadow-sm">
                  <button type="button" className="p-2 text-secondary-400 hover:text-primary-500 transition-colors hidden sm:block">
                    <Camera className="w-5 h-5" />
                  </button>
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); }
                    }}
                    placeholder="Message..."
                    rows={1}
                    className="flex-1 bg-transparent outline-none text-[14px] md:text-base text-secondary-900 dark:text-secondary-100 placeholder:text-secondary-400 placeholder:font-medium resize-none max-h-32 py-2 px-2 md:px-3"
                  />
                  <div className="flex items-center gap-1 md:gap-2">
                    <button type="button" className="p-2 text-secondary-400 hover:text-primary-500 transition-colors">
                        <Smile className="w-5 h-5" />
                    </button>
                    {!messageInput.trim() && (
                        <>
                            <button type="button" className="p-2 text-secondary-400 hover:text-primary-500 transition-colors">
                                <Mic className="w-5 h-5" />
                            </button>
                            <button type="button" className="p-2 text-secondary-400 hover:text-primary-500 transition-colors">
                                <ImageIcon className="w-5 h-5" />
                            </button>
                        </>
                    )}
                  </div>
                </div>
                
                {messageInput.trim() && (
                    <button
                        type="submit"
                        disabled={sending}
                        className={cn(
                            'text-primary-500 hover:text-primary-600 font-bold text-[15px] md:text-base px-3 transition-all active:scale-95',
                            sending && 'opacity-50'
                        )}
                    >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send'}
                    </button>
                )}
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
