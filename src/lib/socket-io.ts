import { Server as NetServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

let io: SocketIOServer | undefined;

// NextAuth v5 cookie names vary by deployment (secure prefix behind TLS, plus the
// legacy `next-auth.*` names). Mirror proxy.ts's robust lookup so the socket
// handshake resolves the session on every host it already works on for HTTP.
const COOKIE_SALTS = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
];

/**
 * Resolves the authenticated user id from the session cookie sent on the
 * WebSocket handshake. Returns null when there is no valid session.
 */
async function getUserIdFromHandshake(socket: Socket): Promise<string | null> {
  // socket.request is a Node IncomingMessage; getToken reads its `cookie` header.
  const req = socket.request as any;
  // Read the secret lazily — on local dev process.env is only fully populated
  // by Next's loader during app.prepare(), after this module is imported.
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

  const attempts: Record<string, unknown>[] = [
    { req, secret },
    { req, secret, secureCookie: false },
    { req, secret, secureCookie: true },
  ];
  for (const salt of COOKIE_SALTS) {
    attempts.push({ req, secret, salt, secureCookie: salt.startsWith('__Secure') });
    attempts.push({ req, secret, salt, secureCookie: !salt.startsWith('__Secure') });
  }

  for (const opts of attempts) {
    try {
      const token = (await getToken(opts as any)) as { id?: string; sub?: string } | null;
      const id = token?.id || token?.sub;
      if (id) return id;
    } catch {
      // try the next cookie configuration
    }
  }
  return null;
}

async function isConversationParticipant(conversationId: string, userId: string): Promise<boolean> {
  if (!/^[a-f\d]{24}$/i.test(conversationId)) return false;
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participantIds: true },
    });
    return !!conversation?.participantIds.includes(userId);
  } catch (err) {
    logger.error('Socket conversation membership check failed', err, { conversationId });
    return false;
  }
}

export const initSocket = (server: NetServer) => {
    if (!io) {
        io = new SocketIOServer(server, {
            path: '/api/socket/io',
            addTrailingSlash: false,
        });

        // ── Handshake auth ────────────────────────────────────────────────────
        // Reject unauthenticated connections and pin the socket to its own user.
        io.use(async (socket, next) => {
            const userId = await getUserIdFromHandshake(socket);
            if (!userId) {
                logger.debug('Socket rejected: no valid session', { socketId: socket.id });
                return next(new Error('unauthorized'));
            }
            socket.data.userId = userId;
            next();
        });

        io.on('connection', (socket) => {
            const userId: string = socket.data.userId;
            logger.debug('Socket connected', { socketId: socket.id, userId });

            // A socket may only ever join its own user room — the client-supplied
            // id is ignored.
            socket.join(`user:${userId}`);
            socket.on('join-user', () => {
                socket.join(`user:${userId}`);
            });

            socket.on('join-conversation', async (conversationId: string) => {
                if (typeof conversationId !== 'string') return;
                if (!(await isConversationParticipant(conversationId, userId))) {
                    logger.debug('Socket denied conversation join', { socketId: socket.id, userId, conversationId });
                    return;
                }
                socket.join(`conv:${conversationId}`);
                logger.debug(`Socket ${socket.id} joined conversation room: conv:${conversationId}`);
            });

            socket.on('typing', async ({ conversationId, userId: _ignored, name, isTyping }: { conversationId: string; userId: string; name: string; isTyping: boolean }) => {
                if (typeof conversationId !== 'string') return;
                // Only relay typing into rooms this socket has actually joined.
                if (!socket.rooms.has(`conv:${conversationId}`)) return;
                socket.to(`conv:${conversationId}`).emit('user-typing', { userId, name, isTyping });
            });

            socket.on('leave-conversation', (conversationId: string) => {
                if (typeof conversationId !== 'string') return;
                socket.leave(`conv:${conversationId}`);
                logger.debug(`Socket ${socket.id} left conversation room: conv:${conversationId}`);
            });

            socket.on('disconnect', () => {
                logger.debug('Socket disconnected', { socketId: socket.id });
            });
        });
    }
    return io;
};

export const getIO = () => io;
