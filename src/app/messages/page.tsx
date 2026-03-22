'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Search, Send, Plus, MessageSquare, X, Loader2, ArrowLeft, MoreVertical, Info, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import { useUnreadMessages } from '@/hooks/use-unread-messages';

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollConvsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollMsgsRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Load conversations on mount + poll
  useEffect(() => {
    fetchConversations().finally(() => setLoadingConvs(false));
    pollConvsRef.current = setInterval(fetchConversations, 15_000);
    return () => { if (pollConvsRef.current) clearInterval(pollConvsRef.current); };
  }, [fetchConversations]);

  // Load following when switching to contacts tab
  useEffect(() => {
    if (activeTab === 'contacts' && followingUsers.length === 0) {
      fetchFollowing();
    }
  }, [activeTab, followingUsers.length, fetchFollowing]);

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

  useEffect(() => {
    if (!selectedConvId) return;
    setLoadingMsgs(true);
    setMessages([]);
    fetchMessages(selectedConvId).finally(() => setLoadingMsgs(false));
    markConversationRead(selectedConvId);

    pollMsgsRef.current = setInterval(() => fetchMessages(selectedConvId), 10_000);
    return () => { if (pollMsgsRef.current) clearInterval(pollMsgsRef.current); };
  }, [selectedConvId, fetchMessages, markConversationRead]);

  const lastConvIdRef = useRef<string | null>(null);

  useEffect(() => {
    const isNewConv = selectedConvId !== lastConvIdRef.current;
    lastConvIdRef.current = selectedConvId;
    
    messagesEndRef.current?.scrollIntoView({ 
      behavior: isNewConv ? 'auto' : 'smooth' 
    });
  }, [messages, selectedConvId]);

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
    <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-0px)] bg-white dark:bg-secondary-950 overflow-hidden">

      {/* Left: Sidebar */}
      <div className={cn(
        'w-full md:w-[320px] lg:w-[360px] border-r border-secondary-100 dark:border-secondary-800 flex flex-col shrink-0 bg-white dark:bg-secondary-950',
        showMobileChat ? 'hidden md:flex' : 'flex'
      )}>
        {/* Header with Tabs */}
        <div className="pt-6 px-4 pb-2 flex flex-col gap-4 shrink-0 bg-white dark:bg-secondary-950">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1 p-1 bg-secondary-50 dark:bg-secondary-900 rounded-[1.25rem] w-full shadow-inner border border-secondary-100 dark:border-secondary-800">
              <button
                onClick={() => setActiveTab('messages')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all',
                  activeTab === 'messages' 
                    ? 'bg-white dark:bg-secondary-800 text-primary-500 shadow-sm' 
                    : 'text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200'
                )}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Messages
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all',
                  activeTab === 'contacts' 
                    ? 'bg-white dark:bg-secondary-800 text-primary-500 shadow-sm' 
                    : 'text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200'
                )}
              >
                <Users className="w-3.5 h-3.5" />
                Contacts
              </button>
            </div>
          </div>

          {/* Unified Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'messages' ? "Search conversations..." : "Search contacts..."}
              className="w-full bg-secondary-50 dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 rounded-2xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-primary-500/20 transition-all font-semibold"
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
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4 animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-secondary-50 dark:bg-secondary-900 rounded-[2.5rem] flex items-center justify-center shadow-inner">
                    <MessageSquare className="w-10 h-10 text-secondary-200" />
                  </div>
                  <div>
                    <p className="font-black text-lg text-secondary-900 dark:text-white">No messages yet</p>
                    <p className="text-xs text-secondary-400 mt-1 max-w-[200px]">Check your contacts list to start a new conversation.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('contacts')}
                    className="mt-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 transition-all active:scale-95"
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
                        'w-full flex items-center gap-3.5 px-4 py-4 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-all text-left relative group',
                        isSelected && 'bg-[#f6f7fb] dark:bg-primary-900/10'
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar src={other?.avatar ?? undefined} name={other?.name || '?'} size="md" className="w-12 h-12 border-2 border-transparent group-hover:border-primary-200 dark:group-hover:border-primary-900/30 transition-all shadow-sm" />
                        {conv.unreadCount > 0 && (
                          <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-500 border-2 border-white dark:border-secondary-950 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-[9px] text-white font-black">{conv.unreadCount}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className={cn('font-black text-sm truncate uppercase tracking-tight', isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-900 dark:text-white')}>
                            {other?.name || 'Unknown'}
                          </p>
                          <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest shrink-0 ml-1">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                          </p>
                        </div>
                        <p className={cn('text-xs truncate font-medium', conv.unreadCount > 0 ? 'text-secondary-900 dark:text-white font-bold' : 'text-secondary-400')}>
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
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4 animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-secondary-50 dark:bg-secondary-900 rounded-[2.5rem] flex items-center justify-center shadow-inner">
                    <Users className="w-10 h-10 text-secondary-200" />
                  </div>
                  <div>
                    <p className="font-black text-lg text-secondary-900 dark:text-white">No contacts found</p>
                    <p className="text-xs text-secondary-400 mt-1 max-w-[200px]">You haven't followed anyone yet or no results match your search.</p>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <div className="px-4 py-2 mb-2">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">All Contacts ({filteredContacts.length})</p>
                  </div>
                  {filteredContacts.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => startConversation(u.id)}
                      className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-all text-left group"
                    >
                      <Avatar src={u.avatar ?? undefined} name={u.name} size="md" className="w-11 h-11 shrink-0 shadow-sm group-hover:ring-2 ring-primary-500/20" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-secondary-900 dark:text-white uppercase tracking-tight truncate">{u.name}</p>
                        <p className="text-[11px] text-secondary-400 font-bold uppercase tracking-widest truncate">@{u.username}</p>
                      </div>
                      <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary-50 dark:bg-secondary-800 text-secondary-400 group-hover:bg-primary-500 group-hover:text-white transition-all shadow-sm">
                        <ArrowLeft className="w-4 h-4 rotate-180" />
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
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-6 bg-[#f6f7fb] dark:bg-secondary-950/50">
            <div className="w-32 h-32 rounded-[3.5rem] bg-white dark:bg-secondary-900 flex items-center justify-center shadow-xl shadow-secondary-200/50 dark:shadow-none relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <MessageSquare className="w-8 h-8 text-primary-500" />
              </div>
            </div>
            <div className="max-w-xs animate-in slide-in-from-bottom-4 duration-700">
              <h3 className="font-black text-3xl text-secondary-900 dark:text-white tracking-tight leading-tight">Your Inbox</h3>
              <p className="text-secondary-400 text-sm mt-3 font-medium leading-relaxed">Select a conversation or browse your contacts to start a new connection.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-secondary-100 dark:border-secondary-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-secondary-950/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm shadow-secondary-900/5">
              <div className="flex items-center gap-4">
                <button onClick={() => { setShowMobileChat(false); }} className="md:hidden -ml-2 p-2 hover:bg-secondary-100 dark:hover:bg-secondary-900 rounded-xl transition-colors">
                    <ArrowLeft className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                </button>
                <Link href={`/profile/${otherUser?.username}`} className="flex items-center gap-3.5 group">
                    <div className="relative">
                        <Avatar src={otherUser?.avatar ?? undefined} name={otherUser?.name || '?'} size="md" className="w-11 h-11 border-2 border-white dark:border-secondary-900 group-hover:border-primary-200 transition-all shadow-sm" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-secondary-950 rounded-full shadow-sm" />
                    </div>
                    <div>
                        <p className="font-black text-secondary-900 dark:text-white text-[15px] leading-tight group-hover:text-primary-600 transition-colors uppercase tracking-tight">{otherUser?.name}</p>
                        <p className="text-[11px] text-secondary-400 font-bold uppercase tracking-widest mt-1">@{otherUser?.username}</p>
                    </div>
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <button title="Conversation Info" className="p-2.5 text-secondary-400 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-50 dark:hover:bg-secondary-900 rounded-xl transition-all">
                    <Info className="w-5 h-5" />
                </button>
                <button title="More Actions" className="p-2.5 text-secondary-400 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-50 dark:hover:bg-secondary-900 rounded-xl transition-all">
                    <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white dark:bg-secondary-950">
              {loadingMsgs ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center animate-in fade-in duration-700">
                  <div className="relative mb-2">
                    <Avatar src={otherUser?.avatar ?? undefined} name={otherUser?.name || '?'} size="xl" className="w-20 h-20 shadow-xl" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-400 border-4 border-white dark:border-secondary-950 rounded-full" />
                  </div>
                  <p className="font-black text-xl text-secondary-900 dark:text-white uppercase tracking-tight">{otherUser?.name}</p>
                  <p className="text-sm text-secondary-400 font-medium">Be the first to say "Hello!"</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === (user?.id as string);
                  return (
                    <div key={msg.id} className={cn('flex flex-col animate-in fade-in slide-in-from-bottom-1 duration-300', isMine ? 'items-end' : 'items-start')}>
                      <div className={cn('flex max-w-[85%] sm:max-w-[75%]', isMine ? 'flex-row-reverse' : 'flex-row')}>
                        {!isMine && (
                          <Link href={`/profile/${msg.sender.username}`} className="shrink-0 self-end mb-1 mr-3 transition-transform hover:scale-110">
                            <Avatar src={msg.sender.avatar ?? undefined} name={msg.sender.name} size="sm" className="w-10 h-10 rounded-2xl border-2 border-white dark:border-secondary-900 shadow-sm" />
                          </Link>
                        )}
                        <div className="flex flex-col">
                          <div className={cn(
                            'px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm font-medium',
                            isMine
                              ? 'bg-gradient-to-br from-primary-500 to-indigo-600 text-white rounded-br-none font-semibold'
                              : 'bg-white dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 rounded-bl-none border border-secondary-100 dark:border-secondary-800 shadow-secondary-100/50 dark:shadow-none'
                          )}>
                            {msg.content}
                          </div>
                          <p className={cn('text-[9px] text-secondary-400 mt-2 font-black uppercase tracking-widest px-1', isMine ? 'text-right' : 'text-left')}>
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-secondary-100 dark:border-secondary-800 shrink-0 bg-white dark:bg-secondary-950">
              <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto w-full">
                <div className="flex-1 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-2xl px-4 py-3 ring-offset-white dark:ring-offset-secondary-950 transition-all focus-within:ring-2 ring-primary-500/20">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full bg-transparent outline-none text-sm text-secondary-800 dark:text-secondary-100 placeholder:text-secondary-400 resize-none max-h-32 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0',
                    messageInput.trim()
                      ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25 active:scale-90 scale-100'
                      : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-300 pointer-events-none'
                  )}
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
