'use client';

import { create } from 'zustand';
import type { ChatMessage, ChatSession } from '@/lib/ai/types';

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

interface ChatbotStore {
  /** Whether the chatbot drawer is visible */
  isOpen: boolean;
  /** Ordered array of messages for the current session */
  messages: ChatMessage[];
  /** True while waiting for the AI response */
  isLoading: boolean;
  /**
   * Stable session ID generated once per browser session.
   * Future: map to a DB record (prisma.chatSession.create) on first message.
   */
  sessionId: string;

  // --- Actions ---
  open: () => void;
  close: () => void;
  toggle: () => void;

  addMessage: (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => ChatMessage;
  updateLastAssistantMessage: (content: string) => void;
  clearMessages: () => void;

  setLoading: (loading: boolean) => void;

  /**
   * Helper that returns a snapshot of the current ChatSession.
   * Future: pass this to prisma.chatSession.upsert() for DB persistence.
   */
  getSession: () => ChatSession;
}

// ---------------------------------------------------------------------------
// ID Generator (works in both server and client contexts)
// ---------------------------------------------------------------------------

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChatbot = create<ChatbotStore>((set, get) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  sessionId: generateId(),

  // ── Drawer control ──────────────────────────────────────────────────────
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  // ── Message management ───────────────────────────────────────────────────
  addMessage: (msg) => {
    const newMessage: ChatMessage = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...msg,
    };
    set((s) => ({ messages: [...s.messages, newMessage] }));
    return newMessage;
  },

  /**
   * Patches the last assistant message in place.
   * Use this for streaming updates or to set final content.
   */
  updateLastAssistantMessage: (content: string) => {
    set((s) => {
      const msgs = [...s.messages];
      const lastIdx = msgs.map((m) => m.role).lastIndexOf('assistant');
      if (lastIdx !== -1) {
        msgs[lastIdx] = { ...msgs[lastIdx], content, isStreaming: false };
      }
      return { messages: msgs };
    });
  },

  clearMessages: () =>
    set({
      messages: [],
      // Generate a fresh session ID when the conversation is cleared
      sessionId: generateId(),
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  // ── Session snapshot ─────────────────────────────────────────────────────
  getSession: (): ChatSession => {
    const { sessionId, messages } = get();
    return {
      sessionId,
      startedAt: messages[0]?.createdAt ?? new Date().toISOString(),
      messages,
    };
  },
}));
