import { describe, it, expect } from 'vitest';
import {
  createCommentSchema,
  createMessageSchema,
  createBoardSchema,
  renameBoardSchema,
  startConversationSchema,
  createConnectionSchema,
  inviteToEventSchema,
  createReportSchema,
} from './content';

describe('createCommentSchema', () => {
  it('rejects an empty comment', () => {
    expect(createCommentSchema.safeParse({ content: '  ' }).success).toBe(false);
  });

  it('rejects a comment over 1000 chars', () => {
    expect(createCommentSchema.safeParse({ content: 'a'.repeat(1001) }).success).toBe(false);
  });

  it('trims and accepts a valid comment', () => {
    const result = createCommentSchema.safeParse({ content: '  hello  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.content).toBe('hello');
  });
});

describe('createMessageSchema', () => {
  it('requires non-empty content', () => {
    expect(createMessageSchema.safeParse({ content: '' }).success).toBe(false);
  });

  it('accepts an optional messageType', () => {
    expect(createMessageSchema.safeParse({ content: 'hi' }).success).toBe(true);
    expect(createMessageSchema.safeParse({ content: 'hi', messageType: 'IMAGE' }).success).toBe(true);
  });

  it('rejects an invalid messageType', () => {
    expect(createMessageSchema.safeParse({ content: 'hi', messageType: 'GIF' }).success).toBe(false);
  });
});

describe('createBoardSchema', () => {
  it('requires a non-empty name', () => {
    expect(createBoardSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('accepts a name with an optional description', () => {
    expect(createBoardSchema.safeParse({ name: 'Ideas', description: 'stuff' }).success).toBe(true);
  });
});

describe('renameBoardSchema', () => {
  it('requires a non-empty name', () => {
    expect(renameBoardSchema.safeParse({ name: '' }).success).toBe(false);
    expect(renameBoardSchema.safeParse({ name: 'New name' }).success).toBe(true);
  });
});

describe('startConversationSchema', () => {
  it('requires participantId', () => {
    expect(startConversationSchema.safeParse({}).success).toBe(false);
    expect(startConversationSchema.safeParse({ participantId: 'u1' }).success).toBe(true);
  });
});

describe('createConnectionSchema', () => {
  it('requires receiverId and allows an optional note', () => {
    expect(createConnectionSchema.safeParse({}).success).toBe(false);
    expect(createConnectionSchema.safeParse({ receiverId: 'u1' }).success).toBe(true);
    expect(createConnectionSchema.safeParse({ receiverId: 'u1', note: 'hi' }).success).toBe(true);
  });
});

describe('inviteToEventSchema', () => {
  it('requires at least one userId', () => {
    expect(inviteToEventSchema.safeParse({ userIds: [] }).success).toBe(false);
  });

  it('rejects more than 200 userIds', () => {
    expect(inviteToEventSchema.safeParse({ userIds: Array(201).fill('u') }).success).toBe(false);
  });

  it('accepts a valid list of userIds', () => {
    expect(inviteToEventSchema.safeParse({ userIds: ['u1', 'u2'] }).success).toBe(true);
  });
});

describe('createReportSchema', () => {
  it('requires a valid targetType and reason', () => {
    expect(
      createReportSchema.safeParse({ targetType: 'POST', targetId: 'p1', reason: 'spam' }).success,
    ).toBe(true);
  });

  it('rejects an invalid targetType', () => {
    expect(
      createReportSchema.safeParse({ targetType: 'COMMENT', targetId: 'p1', reason: 'spam' }).success,
    ).toBe(false);
  });

  it('rejects an empty reason', () => {
    expect(
      createReportSchema.safeParse({ targetType: 'POST', targetId: 'p1', reason: '' }).success,
    ).toBe(false);
  });
});
