import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment cannot be empty').max(1000, 'Comment too long (max 1000 chars)'),
});

export const createMessageSchema = z.object({
  content: z.string().trim().min(1, 'Content is required').max(5000, 'Message too long (max 5000 chars)'),
  messageType: z.enum(['TEXT', 'IMAGE', 'FILE', 'VIDEO']).optional(),
});

export const createBoardSchema = z.object({
  name: z.string().trim().min(1, 'Board name is required').max(100, 'Board name too long (max 100 chars)'),
  description: z.string().trim().max(500, 'Description too long (max 500 chars)').optional(),
});

export const renameBoardSchema = z.object({
  name: z.string().trim().min(1, 'Board name is required').max(100, 'Board name too long (max 100 chars)'),
});

export const startConversationSchema = z.object({
  participantId: z.string().min(1, 'participantId is required'),
});

export const createConnectionSchema = z.object({
  receiverId: z.string().min(1, 'receiverId is required'),
  note: z.string().trim().max(500, 'Note too long (max 500 chars)').optional(),
});

export const inviteToEventSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, 'At least one user ID is required').max(200, 'At most 200 invitations at a time'),
});

export const createReportSchema = z.object({
  targetType: z.enum(['USER', 'POST', 'EVENT', 'MESSAGE']),
  targetId: z.string().min(1, 'Target ID is required'),
  reason: z.string().trim().min(1, 'Reason is required').max(200, 'Reason too long (max 200 chars)'),
  description: z.string().trim().max(1000, 'Description too long (max 1000 chars)').optional(),
});
