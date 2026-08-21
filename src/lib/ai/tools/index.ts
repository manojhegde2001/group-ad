/**
 * AI Tools — Function-Calling Stubs
 *
 * These tool definitions will be passed to Gemini as `functionDeclarations`
 * once tool-calling is enabled in the AI service.
 *
 * Implementation pattern:
 *  1. Define the tool schema (name, description, parameters) for the model
 *  2. Implement the handler function that executes the actual DB query
 *  3. Register the tool in the `AVAILABLE_TOOLS` map and `TOOL_DECLARATIONS` array
 *  4. Wire `executeToolCall()` into the gemini service's response loop
 *
 * Future DB integration example:
 *  - searchProducts → prisma.post.findMany({ where: { ... } })
 *  - searchUsers    → prisma.user.findMany({ where: { ... } })
 */

import type { ToolCall, ToolResult } from '@/lib/ai/types';

// ---------------------------------------------------------------------------
// Tool Declaration Schema (for Gemini functionDeclarations)
// ---------------------------------------------------------------------------

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

// ---------------------------------------------------------------------------
// Tool Declarations (sent to Gemini model)
// ---------------------------------------------------------------------------

export const TOOL_DECLARATIONS: ToolDeclaration[] = [
  {
    name: 'searchProducts',
    description:
      'Search for posts/products on Vrutta matching a keyword or category.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keyword' },
        categoryId: {
          type: 'string',
          description: 'Optional category ID to filter results',
        },
        limit: {
          type: 'string',
          description: 'Maximum number of results to return (default: 5)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'searchCategories',
    description: 'List all available categories on the Vrutta platform.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Optional keyword to filter categories by name',
        },
      },
    },
  },
  {
    name: 'searchUsers',
    description:
      'Find Vrutta users by name, username, or profession for connecting.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Name or username to search' },
        userType: {
          type: 'string',
          description: 'Filter by user type: PERSONAL or BUSINESS',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'searchEvents',
    description: 'Search for upcoming events on Vrutta.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Event title or keyword' },
        upcoming: {
          type: 'string',
          description: 'If "true", only return future events',
        },
      },
    },
  },
  {
    name: 'searchOrders',
    description: 'Search or view recent purchases/orders made by users.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term for orders or items' },
        status: { type: 'string', description: 'Filter by order status: PENDING, COMPLETED, SHIPPED, CANCELLED' },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Tool Handlers (Stubs — not yet implemented)
// ---------------------------------------------------------------------------

/**
 * Future: prisma.post.findMany({ where: { OR: [{ title: { contains: query } }] } })
 */
async function searchProducts(
  _args: { query: string; categoryId?: string; limit?: string }
): Promise<unknown> {
  // TODO: implement with Prisma
  // const limit = parseInt(args.limit ?? '5', 10);
  // return prisma.post.findMany({ where: { title: { contains: args.query } }, take: limit });
  return { results: [], message: 'Tool not yet implemented' };
}

/**
 * Future: prisma.category.findMany({ where: { name: { contains: query } } })
 */
async function searchCategories(
  _args: { query?: string }
): Promise<unknown> {
  // TODO: implement with Prisma
  return { results: [], message: 'Tool not yet implemented' };
}

/**
 * Future: prisma.user.findMany({ where: { OR: [{ name: { contains: query } }, { username: { contains: query } }] } })
 */
async function searchUsers(
  _args: { query: string; userType?: string }
): Promise<unknown> {
  // TODO: implement with Prisma
  return { results: [], message: 'Tool not yet implemented' };
}

/**
 * Future: prisma.event.findMany({ where: { title: { contains: query }, status: 'PUBLISHED' } })
 */
async function searchEvents(
  _args: { query?: string; upcoming?: string }
): Promise<unknown> {
  // TODO: implement with Prisma
  return { results: [], message: 'Tool not yet implemented' };
}

/**
 * Future: prisma.order.findMany({ where: { items: { some: { name: { contains: query } } } } })
 */
async function searchOrders(
  _args: { query?: string; status?: string }
): Promise<unknown> {
  // TODO: implement with Prisma
  return { results: [], message: 'Tool not yet implemented' };
}

// ---------------------------------------------------------------------------
// Tool Dispatcher
// ---------------------------------------------------------------------------

type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

const AVAILABLE_TOOLS: Record<string, ToolHandler> = {
  searchProducts: (args) => searchProducts(args as any),
  searchCategories: (args) => searchCategories(args as any),
  searchUsers: (args) => searchUsers(args as any),
  searchEvents: (args) => searchEvents(args as any),
  searchOrders: (args) => searchOrders(args as any),
};

/**
 * Executes a tool call requested by the AI model and returns the result.
 * Future: this will be called in a loop inside the Gemini service when
 * the model returns `functionCall` parts instead of a plain text response.
 */
export async function executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const handler = AVAILABLE_TOOLS[toolCall.name];

  if (!handler) {
    return {
      toolCallId: toolCall.id,
      result: null,
      isError: true,
      errorMessage: `Unknown tool: ${toolCall.name}`,
    };
  }

  try {
    const result = await handler(toolCall.arguments);
    return { toolCallId: toolCall.id, result };
  } catch (err) {
    return {
      toolCallId: toolCall.id,
      result: null,
      isError: true,
      errorMessage: err instanceof Error ? err.message : 'Tool execution failed',
    };
  }
}
