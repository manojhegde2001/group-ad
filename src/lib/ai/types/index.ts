/**
 * AI System — Core Types
 *
 * These interfaces form the contract between the UI, services, and API layer.
 * Designed to be extended when Gemini tool-calling and DB persistence are added.
 */

// ---------------------------------------------------------------------------
// Chat Message
// ---------------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** ISO timestamp */
  createdAt: string;
  /** True while the assistant is streaming its reply */
  isStreaming?: boolean;
  /** Populated when the message triggered a tool call (future) */
  toolCalls?: ToolCall[];
}

// ---------------------------------------------------------------------------
// Chat Session
// ---------------------------------------------------------------------------

export interface ChatSession {
  /** Client-generated UUID; will map to a DB record in the future */
  sessionId: string;
  /** ISO timestamp when the session started */
  startedAt: string;
  messages: ChatMessage[];
  /**
   * Future: userId to persist sessions per user in MongoDB via Prisma.
   * e.g. prisma.chatSession.create({ data: { userId, sessionId, ... } })
   */
  userId?: string;
}

// ---------------------------------------------------------------------------
// AI Service — Request / Response
// ---------------------------------------------------------------------------

export interface AIRequestMessage {
  role: 'user' | 'model'; // Gemini uses "model" instead of "assistant"
  parts: Array<{ text: string }>;
}

export interface AIResponse {
  reply: string;
  /** Raw token usage returned by the provider (future billing/monitoring) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Tool calls requested by the model (future function-calling support) */
  toolCalls?: ToolCall[];
  /** Provider-level error code, if any */
  errorCode?: string;
}

// ---------------------------------------------------------------------------
// Tool Calling (Future)
// ---------------------------------------------------------------------------

/**
 * Represents a function call requested by the AI model.
 * Future: Wire into Gemini's `functionDeclarations` / `functionCall` protocol.
 */
export interface ToolCall {
  /** Unique identifier for this specific invocation */
  id: string;
  /** Tool name, e.g. "searchProducts", "searchUsers" */
  name: string;
  /** Parsed JSON arguments from the model */
  arguments: Record<string, unknown>;
}

/**
 * The result returned after executing a tool.
 * Future: pass back as `functionResponse` in the next Gemini turn.
 */
export interface ToolResult {
  toolCallId: string;
  /** Serialisable result data to feed back to the model */
  result: unknown;
  /** True if the tool execution failed */
  isError?: boolean;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// API Route Contracts
// ---------------------------------------------------------------------------

export interface ChatRequestBody {
  messages: Pick<ChatMessage, 'role' | 'content'>[];
  sessionId: string;
}

export interface ChatResponseBody {
  reply: string;
  sessionId: string;
  usage?: AIResponse['usage'];
}
