import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { enforceRateLimit } from '@/lib/rate-limit';
import { processChatTurn, ChatServiceError } from '@/services/chat/chat-service';
import type { ChatRequestBody, ChatResponseBody } from '@/lib/ai/types';

// ---------------------------------------------------------------------------
// Request validation schema
// ---------------------------------------------------------------------------

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(4000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  sessionId: z.string().min(1),
});

// ---------------------------------------------------------------------------
// POST /api/chat
//
// Flow:
//   Client (messages + sessionId)
//   → Zod validation
//   → Auth check
//   → Chat Service (system prompt + history → Gemini)
//   → JSON response { reply, sessionId, usage }
//
// Future flow:
//   → Chat Service → Gemini → Tool Call → Prisma/Mongo → Gemini → Response
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth guard — only authenticated users can use the AI assistant
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Bound Gemini usage/cost per user.
    const limited = enforceRateLimit(request, 'chat', 30, 5 * 60_000, session.user.id);
    if (limited) return limited;

    // 2. Parse and validate request body
    const body: unknown = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { messages, sessionId } = parsed.data as ChatRequestBody;

    // 3. Delegate to the chat service
    const aiResponse = await processChatTurn(messages, {
      sessionId,
      userId: session.user.id,
      userName: session.user.name ?? undefined,
      // Future: fetch user category from DB
      // userCategory: await getUserCategory(session.user.id),
    });

    // 4. Return normalised response
    const responseBody: ChatResponseBody = {
      reply: aiResponse.reply,
      sessionId,
      usage: aiResponse.usage,
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch (err) {
    if (err instanceof ChatServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    // Unexpected errors — do not leak internals
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
