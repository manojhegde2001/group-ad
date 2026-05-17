'use client';

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type KeyboardEvent,
} from 'react';
import { Drawer } from 'rizzui';
import { cn } from '@/lib/utils';
import { useChatbot } from '@/hooks/use-chatbot';
import { ActionIcon } from '@/components/ui/action-icon';
import {
  X,
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  User,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import type { ChatMessage } from '@/lib/ai/types';

// ---------------------------------------------------------------------------
// Suggested prompts shown in the empty state
// ---------------------------------------------------------------------------

const SUGGESTED_PROMPTS = [
  'How do I grow my presence on Vrutta?',
  'What are Boards and how do I use them?',
  'How can I find businesses to connect with?',
  'Tell me about Vrutta Events',
  'How do I create an engaging post?',
  'What is a Power Team?',
] as const;

// ---------------------------------------------------------------------------
// Message Bubble Component
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-2.5 animate-slide-up',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
          isUser
            ? 'bg-primary-500 text-white'
            : 'bg-secondary-100 dark:bg-secondary-800 text-primary-500'
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5" />
        ) : (
          <Bot className="w-3.5 h-3.5" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary-500 text-white rounded-tr-sm'
            : 'bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 rounded-tl-sm border border-secondary-100 dark:border-secondary-700'
        )}
      >
        {message.isStreaming ? (
          <TypingIndicator />
        ) : (
          <FormattedContent content={message.content} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typing Indicator (3 bouncing dots)
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <span className="flex gap-1 items-center h-5 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-secondary-400 dark:bg-secondary-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Formatted Content (markdown-lite: bold, lists)
// ---------------------------------------------------------------------------

function FormattedContent({ content }: { content: string }) {
  // Basic markdown: **bold**, newlines
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const liLine = line.match(/^[-•]\s(.+)/);
        if (liLine) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-60" />
              <span dangerouslySetInnerHTML={{ __html: liLine[1].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
          );
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        return (
          <span key={i} dangerouslySetInnerHTML={{ __html: boldLine }} />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  onPromptClick: (prompt: string) => void;
}

function EmptyState({ onPromptClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4 shadow-sm">
        <Sparkles className="w-8 h-8 text-primary-500" />
      </div>

      <h3 className="font-bold text-secondary-900 dark:text-white text-lg mb-1">
        Vrutta AI Assistant
      </h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-8 max-w-[260px]">
        Ask me anything about the platform, networking tips, or how to grow your
        presence.
      </p>

      {/* Suggested prompts */}
      <div className="w-full space-y-2">
        <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest mb-3">
          Try asking…
        </p>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPromptClick(prompt)}
            className="w-full text-left px-4 py-2.5 rounded-xl bg-secondary-50 dark:bg-secondary-800/60 border border-secondary-100 dark:border-secondary-700 text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 dark:hover:border-primary-800 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-150 active:scale-[0.98]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Input Area
// ---------------------------------------------------------------------------

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
  disabled: boolean;
}

function ChatInput({ value, onChange, onSend, isLoading, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 border-t border-secondary-100 dark:border-secondary-800 bg-white dark:bg-secondary-900">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask anything… (Enter to send)"
          rows={1}
          className={cn(
            'w-full resize-none rounded-xl px-4 py-2.5 text-sm',
            'bg-secondary-50 dark:bg-secondary-800',
            'border border-secondary-200 dark:border-secondary-700',
            'text-secondary-900 dark:text-secondary-100',
            'placeholder:text-secondary-400 dark:placeholder:text-secondary-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400',
            'transition-all duration-150 scrollbar-hide',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
      </div>

      <ActionIcon
        onClick={onSend}
        disabled={disabled || !value.trim()}
        variant="solid"
        rounded="full"
        className={cn(
          'h-11 w-11 shrink-0 mb-0.5',
          'bg-primary-500 hover:bg-primary-600 active:bg-primary-700',
          'text-white shadow-md shadow-primary-500/25',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
          'transition-all duration-150 active:scale-95'
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </ActionIcon>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ChatbotDrawer Component
// ---------------------------------------------------------------------------

export function ChatbotDrawer() {
  const {
    isOpen,
    close,
    messages,
    isLoading,
    sessionId,
    addMessage,
    updateLastAssistantMessage,
    clearMessages,
    setLoading,
  } = useChatbot();

  const [inputValue, setInputValue] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Track scroll position to show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 100);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    setInputValue('');

    // Add user message to store
    addMessage({ role: 'user', content: text });

    // Add a placeholder assistant message for loading state
    addMessage({ role: 'assistant', content: '', isStreaming: true });

    setLoading(true);

    try {
      const payload = {
        messages: [
          // Send current messages + the new user message
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user' as const, content: text },
        ],
        sessionId,
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: { reply?: string; error?: string } = await res.json();

      if (!res.ok || !data.reply) {
        updateLastAssistantMessage(
          data.error ?? 'Sorry, something went wrong. Please try again.'
        );
        return;
      }

      updateLastAssistantMessage(data.reply);
    } catch {
      updateLastAssistantMessage(
        'Unable to reach the AI service. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  }, [
    inputValue,
    isLoading,
    messages,
    sessionId,
    addMessage,
    updateLastAssistantMessage,
    setLoading,
  ]);

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
    // Slight delay so the user sees the input fill, then auto-send
    setTimeout(() => {
      setInputValue('');
      // Directly trigger send with the prompt text
      const fakeEvent = { trim: () => prompt };
      void (async () => {
        addMessage({ role: 'user', content: prompt });
        addMessage({ role: 'assistant', content: '', isStreaming: true });
        setLoading(true);
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: prompt }],
              sessionId,
            }),
          });
          const data: { reply?: string; error?: string } = await res.json();
          updateLastAssistantMessage(
            data.reply ?? data.error ?? 'Something went wrong.'
          );
        } catch {
          updateLastAssistantMessage(
            'Unable to reach the AI service. Please check your connection.'
          );
        } finally {
          setLoading(false);
        }
      })();
    }, 100);
  };

  const hasMessages = messages.length > 0;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={close}
      placement="right"
      containerClassName={cn(
        'w-full sm:w-[400px] flex flex-col',
        'bg-white dark:bg-secondary-900',
        'shadow-2xl shadow-black/20 dark:shadow-black/50',
        'border-l border-secondary-100 dark:border-secondary-800',
        'h-full'
      )}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-secondary-100 dark:border-secondary-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-primary-500" />
          </div>
          <div>
            <h2 className="font-bold text-secondary-900 dark:text-white text-base leading-tight">
              AI Assistant
            </h2>
            <p className="text-[10px] font-semibold text-secondary-400 uppercase tracking-widest">
              Vrutta AI · Powered by Gemini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Clear conversation */}
          {hasMessages && (
            <ActionIcon
              variant="flat"
              rounded="full"
              onClick={clearMessages}
              title="Clear conversation"
              className="text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-800"
            >
              <RotateCcw className="w-4 h-4" />
            </ActionIcon>
          )}
          {/* Close */}
          <ActionIcon
            variant="flat"
            rounded="full"
            onClick={close}
            className="text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-800"
          >
            <X className="w-4 h-4" />
          </ActionIcon>
        </div>
      </div>

      {/* ── Messages / Empty state ──────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative scrollbar-hide"
      >
        {!hasMessages ? (
          <EmptyState onPromptClick={handlePromptClick} />
        ) : (
          <div className="p-4 space-y-4 pb-2">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll-to-bottom button */}
        {showScrollBtn && hasMessages && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white dark:bg-secondary-800 shadow-md border border-secondary-100 dark:border-secondary-700 flex items-center justify-center text-secondary-500 hover:text-primary-500 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0">
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          isLoading={isLoading}
          disabled={isLoading}
        />
        <p className="text-center text-[10px] text-secondary-400 dark:text-secondary-600 pb-3">
          Shift+Enter for new line · Enter to send
        </p>
      </div>
    </Drawer>
  );
}
