import { describe, it, expect } from 'vitest';
import {
  adminUpdateUserSchema,
  bulkCreateUsersSchema,
  reviewVerificationRequestSchema,
  createVenueSchema,
  updateReportStatusSchema,
} from './admin';

describe('adminUpdateUserSchema', () => {
  it('accepts an empty object since all fields are optional', () => {
    expect(adminUpdateUserSchema.safeParse({}).success).toBe(true);
  });

  it('rejects an invalid userType', () => {
    expect(adminUpdateUserSchema.safeParse({ userType: 'SUPERUSER' }).success).toBe(false);
  });

  it('accepts a valid userType', () => {
    expect(adminUpdateUserSchema.safeParse({ userType: 'ADMIN' }).success).toBe(true);
  });
});

describe('bulkCreateUsersSchema', () => {
  const user = {
    name: 'Jane',
    username: 'jane1',
    email: 'jane@example.com',
    password: 'password1',
  };

  it('requires at least one user', () => {
    expect(bulkCreateUsersSchema.safeParse({ users: [] }).success).toBe(false);
  });

  it('rejects more than 500 users', () => {
    expect(bulkCreateUsersSchema.safeParse({ users: Array(501).fill(user) }).success).toBe(false);
  });

  it('accepts a valid batch', () => {
    expect(bulkCreateUsersSchema.safeParse({ users: [user] }).success).toBe(true);
  });

  it('rejects a user with an invalid username', () => {
    expect(
      bulkCreateUsersSchema.safeParse({ users: [{ ...user, username: 'a b' }] }).success,
    ).toBe(false);
  });
});

describe('reviewVerificationRequestSchema', () => {
  it('accepts APPROVED and REJECTED statuses', () => {
    expect(reviewVerificationRequestSchema.safeParse({ status: 'APPROVED' }).success).toBe(true);
    expect(reviewVerificationRequestSchema.safeParse({ status: 'REJECTED' }).success).toBe(true);
  });

  it('rejects an unrecognized status', () => {
    expect(reviewVerificationRequestSchema.safeParse({ status: 'PENDING' }).success).toBe(false);
  });
});

describe('createVenueSchema', () => {
  it('requires name, city, and state', () => {
    expect(createVenueSchema.safeParse({ name: 'Hall', city: 'Pune', state: 'MH' }).success).toBe(true);
    expect(createVenueSchema.safeParse({ name: '', city: 'Pune', state: 'MH' }).success).toBe(false);
  });
});

describe('updateReportStatusSchema', () => {
  it('accepts a valid status transition', () => {
    expect(
      updateReportStatusSchema.safeParse({ reportId: 'r1', status: 'RESOLVED' }).success,
    ).toBe(true);
  });

  it('rejects an invalid status', () => {
    expect(
      updateReportStatusSchema.safeParse({ reportId: 'r1', status: 'CLOSED' }).success,
    ).toBe(false);
  });
});
