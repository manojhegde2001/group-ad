'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Search, Send, Plus, MessageSquare, X, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';

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

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const otherUser = selectedConv?.participants[0];

  // Load conversations
  useEffect(() => {
    fetch('/api/conversations')
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []))
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (!selectedConvId) return;
    setLoadingMsgs(true);
    setMessages([]);
    fetch(`/api/conversations/${selectedConvId}/messages`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [selectedConvId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Search users for new conversation
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (searchQ.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(searchQ)}`)
        .then((r) => r.json())
        .then((d) => setSearchResults(d.users || []))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
  }, [searchQ]);

  const startConversation = async (participantId: string) => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId }),
    });
    const data = await res.json();
    if (data.conversation) {
      // Refresh conversations
      const convsRes = await fetch('/api/conversations');
      const convsData = await convsRes.json();
      setConversations(convsData.conversations || []);
      setSelectedConvId(data.conversation.id);
      setShowNewConv(false);
      setShowMobileChat(true);
      setSearchQ('');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConvId || sending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    // Optimistic
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
        // Update conv last message
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

  const handleSelectConv = (id: string) => {
    setSelectedConvId(id);
    setShowMobileChat(true);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-0px)] bg-white dark:bg-secondary-950 overflow-hidden">

      {/* Left: Conversation List */}
      <div className={cn(
        'w-full md:w-[320px] lg:w-[360px] border-r border-secondary-100 dark:border-secondary-800 flex flex-col shrink-0 bg-white dark:bg-secondary-950',
        showMobileChat ? 'hidden md:flex' : 'flex'
      )}>
        {/* Header */}
        <div className="p-4 border-b border-secondary-100 dark:border-secondary-800 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-black text-secondary-900 dark:text-white">Messages</h1>
          <button
            onClick={() => { setShowNewConv(!showNewConv); setSearchQ(''); }}
            className="w-9 h-9 flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white rounded-2xl transition-colors shadow-sm"
          >
            {showNewConv ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {/* New conversation search */}
        {showNewConv && (
          <div className="p-3 border-b border-secondary-100 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-900/50">
            <p className="text-xs font-bold text-secondary-500 mb-2 uppercase tracking-wide">New Message</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-400" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search people..."
                className="w-full bg-white dark:bg-secondary-800 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 ring-primary-500/20 border border-secondary-100 dark:border-secondary-700"
                autoFocus
              />
            </div>
            {searching && <p className="text-xs text-secondary-400 py-2 text-center"><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Searching...</p>}
            {searchResults.map((u) => (
              <button
                key={u.id}
                onClick={() => startConversation(u.id)}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors mt-1 text-left"
              >
                <Avatar src={u.avatar} name={u.name} size="sm" className="w-8 h-8 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-secondary-900 dark:text-white">{u.name}</p>
                  <p className="text-xs text-secondary-500">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
              <MessageSquare className="w-12 h-12 text-secondary-200" />
              <p className="font-semibold text-secondary-500">No conversations yet</p>
              <p className="text-xs text-secondary-400">Tap the + button to start a new chat</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = conv.participants[0];
              const isSelected = conv.id === selectedConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors text-left relative border-b border-secondary-50 dark:border-secondary-800/50',
                    isSelected && 'bg-primary-50/60 dark:bg-primary-900/20'
                  )}
                >
                  <Avatar src={other?.avatar ?? undefined} name={other?.name || '?'} size="md" className="w-11 h-11 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className={cn('font-bold text-sm truncate', isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-secondary-900 dark:text-white')}>
                        {other?.name || 'Unknown'}
                      </p>
                      <p className="text-[10px] text-secondary-400 font-medium shrink-0 ml-1">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                      </p>
                    </div>
                    <p className={cn('text-xs truncate', conv.unreadCount > 0 ? 'font-bold text-secondary-900 dark:text-white' : 'text-secondary-500')}>
                      {conv.lastMessage?.content || 'Start a conversation'}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-[9px] text-white font-black">{conv.unreadCount}</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Chat View */}
      <div className={cn(
        'flex-1 flex-col min-w-0 h-full',
        showMobileChat ? 'flex' : 'hidden md:flex'
      )}>
        {!selectedConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
            <div className="w-20 h-20 rounded-3xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-primary-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-secondary-900 dark:text-white">Your Messages</h3>
              <p className="text-secondary-500 text-sm mt-1">Select a conversation or start a new one</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-secondary-100 dark:border-secondary-800 flex items-center gap-3 shrink-0 bg-white/90 dark:bg-secondary-950/90 backdrop-blur-md sticky top-0 z-10">
              <button onClick={() => { setShowMobileChat(false); }} className="md:hidden -ml-1 p-1.5 hover:bg-secondary-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-secondary-600" />
              </button>
              <Avatar src={otherUser?.avatar ?? undefined} name={otherUser?.name || '?'} size="sm" className="w-10 h-10" />
              <div>
                <p className="font-bold text-secondary-900 dark:text-white text-sm leading-tight">{otherUser?.name}</p>
                <p className="text-xs text-secondary-400">@{otherUser?.username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Avatar src={otherUser?.avatar ?? undefined} name={otherUser?.name || '?'} size="xl" className="w-16 h-16" />
                  <p className="font-bold text-secondary-700 dark:text-secondary-300">{otherUser?.name}</p>
                  <p className="text-xs text-secondary-400">Send a message to start the conversation</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === (user?.id as string);
                  return (
                    <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                      {!isMine && (
                        <Avatar src={msg.sender.avatar ?? undefined} name={msg.sender.name} size="sm" className="w-7 h-7 mr-2 shrink-0 self-end" />
                      )}
                      <div className="max-w-[70%]">
                        <div className={cn(
                          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                          isMine
                            ? 'bg-primary-500 text-white rounded-br-none shadow-sm shadow-primary-500/20'
                            : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200 rounded-bl-none'
                        )}>
                          {msg.content}
                        </div>
                        <p className={cn('text-[10px] text-secondary-400 mt-0.5', isMine ? 'text-right' : 'text-left')}>
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-secondary-100 dark:border-secondary-800 shrink-0 bg-white dark:bg-secondary-950">
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <div className="flex-1 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-2xl px-4 py-2.5">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full bg-transparent outline-none text-sm text-secondary-800 dark:text-secondary-100 placeholder:text-secondary-400 resize-none max-h-32"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className={cn(
                    'w-10 h-10 rounded-2xl flex items-center justify-center transition-all shrink-0',
                    messageInput.trim()
                      ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm shadow-primary-500/20 active:scale-95'
                      : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-300 pointer-events-none'
                  )}
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
