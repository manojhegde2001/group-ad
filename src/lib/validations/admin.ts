import { z } from 'zod';
import { userTypeEnum } from './auth';

export const adminUpdateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  email: z.string().email('Invalid email address').optional(),
  userType: userTypeEnum.optional(),
  categoryId: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  websiteLabel: z.string().max(100).optional(),
});

const bulkUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  userType: userTypeEnum.optional(),
  categoryId: z.string().optional(),
});

export const bulkCreateUsersSchema = z.object({
  users: z.array(bulkUserSchema).min(1, 'At least one user is required').max(500, 'At most 500 users per batch'),
});

export const reviewVerificationRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().max(1000).optional(),
});

export const createVenueSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
});

export const updateReportStatusSchema = z.object({
  reportId: z.string().min(1, 'Report ID is required'),
  status: z.enum(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']),
  adminNote: z.string().max(1000).optional(),
});
