/**
 * Chat Service
 *
 * Orchestrates a full chat turn:
 *  1. Validates and sanitises incoming messages
 *  2. Builds the system prompt (with optional context injection)
 *  3. Converts Vrutta ChatMessage format → Gemini AIRequestMessage format
 *  4. Calls the Gemini AI service
 *  5. Returns a normalised AIResponse
 *
 * Future extensions:
 *  - Load/save ChatSession from MongoDB via Prisma:
 *      prisma.chatSession.upsert({ where: { sessionId }, ... })
 *  - Execute tool calls returned by the model and feed results back
 *  - Rate limiting per userId via Redis or Prisma
 */

import type { AIResponse, ChatMessage } from '@/lib/ai/types';
import { buildSystemPrompt } from '@/lib/ai/prompts/system-prompt';
import { generateContent, GeminiServiceError } from '@/services/ai/gemini';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of history turns sent to the model (keeps context window small and saves tokens) */
const MAX_HISTORY_TURNS = 8;

/** Maximum characters per message (safety guard) */
const MAX_MESSAGE_LENGTH = 4000;

// ---------------------------------------------------------------------------
// Context passed in per request (populated from session)
// ---------------------------------------------------------------------------

export interface ChatContext {
  /** Session ID for this conversation */
  sessionId: string;
  /** Authenticated user ID */
  userId: string;
  /** Display name, injected into system prompt context */
  userName?: string;
  /** User's platform category, e.g. "Technology" */
  userCategory?: string;
}

// ---------------------------------------------------------------------------
// Main service function
// ---------------------------------------------------------------------------

/**
 * Processes a full chat turn and returns the AI response.
 *
 * @param incomingMessages - The full message history from the client
 * @param context - Per-request metadata (user identity, session, etc.)
 */
export async function processChatTurn(
  incomingMessages: Pick<ChatMessage, 'role' | 'content'>[],
  context: ChatContext
): Promise<AIResponse> {
  // 1. Sanitise messages — strip system role messages from the client
  //    (only the server should inject system instructions)
  const userMessages = incomingMessages.filter((m) => m.role !== 'system');

  if (userMessages.length === 0) {
    throw new ChatServiceError('No messages provided', 400);
  }

  // 2. Trim history to the last N turns
  const trimmedMessages = userMessages.slice(-MAX_HISTORY_TURNS);

  // 3. Guard against oversized messages
  for (const msg of trimmedMessages) {
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      throw new ChatServiceError(
        `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
        400
      );
    }
  }

  // 4. Build system prompt (with user context if available)
  const systemPrompt = buildSystemPrompt({
    userName: context.userName,
    userCategory: context.userCategory,
  });

  // Future: Load additional context from DB here
  // const session = await prisma.chatSession.findUnique({ where: { sessionId: context.sessionId } });

  // 5. Call the AI service
  try {
    const response = await generateContent({
      messages: trimmedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      systemPrompt,
      maxOutputTokens: 2048,
      temperature: 0.7,
    });

    // Future: persist the new assistant message to DB
    // await prisma.chatMessage.create({
    //   data: { sessionId: context.sessionId, role: 'assistant', content: response.reply }
    // });

    return response;
  } catch (err) {
    if (err instanceof GeminiServiceError) {
      // 429 — free-tier rate limit hit; give a clear, actionable message
      if (err.statusCode === 429) {
        throw new ChatServiceError(
          'You\'ve hit the AI rate limit. Please wait a few seconds and try again.',
          429
        );
      }
      
      // Pass through specific auth, access, or model not found errors to aid in diagnostics
      if (err.statusCode === 401 || err.statusCode === 403 || err.statusCode === 404) {
        throw new ChatServiceError(err.message, err.statusCode);
      }

      // 5xx — Gemini service-side failure
      throw new ChatServiceError(
        'The AI service is temporarily unavailable. Please try again.',
        503
      );
    }
    throw err;
  }

}

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

export class ChatServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'ChatServiceError';
  }
}
