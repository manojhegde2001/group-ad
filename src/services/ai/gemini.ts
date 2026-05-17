/**
 * Gemini AI Service
 *
 * Single responsibility: communicate with Google Gemini using the official @google/genai SDK.
 *
 * Keep API key server-side only. Do not export/expose the API key to client-side code.
 */

import { GoogleGenAI } from '@google/genai';
import type { ChatMessage, AIResponse } from '@/lib/ai/types';

// ---------------------------------------------------------------------------
// Helper: Debug Logger (Dev-only, avoiding simple console.log to follow rules)
// ---------------------------------------------------------------------------
function debugLog(message: string, data?: unknown) {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug(
      `[GeminiService] ${message}`,
      data ? JSON.stringify(data, null, 2) : ''
    );
  }
}

// ---------------------------------------------------------------------------
// Client Initialisation
// ---------------------------------------------------------------------------
let aiClientInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (aiClientInstance) return aiClientInstance;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiServiceError(
      'GEMINI_API_KEY is not configured in the server environment variables.',
      401
    );
  }

  aiClientInstance = new GoogleGenAI({ apiKey });
  return aiClientInstance;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash-lite';

// ---------------------------------------------------------------------------
// Core Service Methods
// ---------------------------------------------------------------------------

export interface GenerateOptions {
  /** Chat history in generic format */
  messages: Array<{ role: string; content: string }>;
  /** Raw system prompt instruction */
  systemPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}


/**
 * Sends a conversation turn to Gemini and returns the assistant's reply.
 */
export async function generateContent(
  options: GenerateOptions
): Promise<AIResponse> {
  const {
    messages,
    systemPrompt,
    temperature = 0.7,
    maxOutputTokens = 2048,
  } = options;

  debugLog('Request parameters:', {
    model: GEMINI_MODEL,
    messageCount: messages.length,
    temperature,
    maxOutputTokens,
  });

  const ai = getAiClient();

  // Convert ChatMessage format (user/assistant) to Gemini SDK format (user/model)
  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature,
        maxOutputTokens,
        // Future tool/function calling integration placeholder:
        // tools: undefined,
      },
    });

    const reply = response.text || '';
    const promptTokens = response.usageMetadata?.promptTokenCount ?? 0;
    const completionTokens = response.usageMetadata?.candidatesTokenCount ?? 0;
    const totalTokens = response.usageMetadata?.totalTokenCount ?? 0;

    debugLog('Token Usage:', {
      promptTokens,
      completionTokens,
      totalTokens,
    });

    return {
      reply,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
    };
  } catch (err) {
    throw handleApiError(err);
  }
}

/**
 * Sends a conversation turn to Gemini and yields a stream of responses.
 * Ready for future streaming UI integration.
 */
export async function* generateContentStream(
  options: GenerateOptions
): AsyncGenerator<string, void, unknown> {
  const {
    messages,
    systemPrompt,
    temperature = 0.7,
    maxOutputTokens = 2048,
  } = options;

  debugLog('Stream requested for model:', GEMINI_MODEL);

  const ai = getAiClient();

  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  try {
    const responseStream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature,
        maxOutputTokens,
      },
    });

    for await (const chunk of responseStream) {
      const textChunk = chunk.text;
      if (textChunk) {
        yield textChunk;
      }
    }
  } catch (err) {
    throw handleApiError(err);
  }
}

// ---------------------------------------------------------------------------
// Error Mapping / Translating
// ---------------------------------------------------------------------------

function handleApiError(err: unknown): Error {
  debugLog('Caught error:', err);

  if (err instanceof Error) {
    // Handle standard or custom API client errors from SDK
    const status = (err as any).status ?? (err as any).statusCode;
    const message = err.message || '';

    if (status === 401) {
      return new GeminiServiceError(
        'Invalid API Key. Please verify your GEMINI_API_KEY setting.',
        401
      );
    }
    if (status === 403) {
      return new GeminiServiceError(
        'Access denied. Check your Gemini API billing/project settings.',
        403
      );
    }
    if (status === 429) {
      return new GeminiServiceError(
        "You've hit the AI rate limit. Please wait a few seconds and try again.",
        429
      );
    }
    if (status >= 500) {
      return new GeminiServiceError(
        'The Gemini service is temporarily down. Please try again later.',
        503
      );
    }

    // Generic error mapping
    return new GeminiServiceError(
      message || 'Failed to generate content from AI service.',
      status || 500
    );
  }

  return new GeminiServiceError(
    'An unexpected error occurred in the Gemini AI Service.',
    500
  );
}

// ---------------------------------------------------------------------------
// Custom Errors
// ---------------------------------------------------------------------------

export class GeminiServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'GeminiServiceError';
  }
}
