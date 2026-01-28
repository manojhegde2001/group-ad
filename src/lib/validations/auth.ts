import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

// User Type enum for validation
export const userTypeEnum = z.enum(['INDIVIDUAL', 'BUSINESS', 'ADMIN']);

// ============================================================================
// 1. SIGNUP SCHEMA (UPDATED WITH CATEGORY)
// ============================================================================

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  userType: userTypeEnum.optional().default('INDIVIDUAL'),
  categoryId: z.string().min(1, 'Please select a category'), // REQUIRED NOW
  companyId: z.string().optional(), // For business users selecting existing company
});

export type SignupFormData = z.infer<typeof signupSchema>;

// ============================================================================
// 2. LOGIN SCHEMA
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ============================================================================
// 3. UPDATE PROFILE SCHEMA
// ============================================================================

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
  location: z.string().max(100).optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  categoryId: z.string().optional(), // Can change category
  interests: z.array(z.string()).optional(),

  // Business fields
  turnover: z.string().optional(),
  companySize: z.string().optional(),
  industry: z.string().optional(),

  // Social links
  linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
  facebook: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
  instagram: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

// ============================================================================
// 4. CHANGE PASSWORD SCHEMA
// ============================================================================

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ============================================================================
// 5. CREATE COMPANY SCHEMA
// ============================================================================

export const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  industry: z.string().optional(),
  gstNumber: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format')
    .optional()
    .or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
  location: z.string().max(100).optional(),
});

export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;

// ============================================================================
// 6. UPGRADE TO BUSINESS SCHEMA (NEW)
// ============================================================================

export const upgradeToBusinessSchema = z.object({
  reason: z.string().min(10, 'Please provide a reason (minimum 10 characters)').optional(),

  // Company selection or new company details
  companyId: z.string().optional(),
  companyName: z.string().min(2, 'Company name must be at least 2 characters').optional(),

  // Business details
  turnover: z.string().optional(),
  companySize: z.string().optional(),
  industry: z.string().optional(),
  gstNumber: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format')
    .optional()
    .or(z.literal('')),
  establishedYear: z
    .string()
    .regex(/^(19|20)\d{2}$/, 'Invalid year format (e.g., 2020)')
    .optional()
    .or(z.literal('')),
  companyWebsite: z.string().url('Invalid website URL').optional().or(z.literal('')),
  companyLogo: z.string().url('Invalid logo URL').optional().or(z.literal('')),
}).refine((data) => data.companyId || data.companyName, {
  message: "Either select an existing company or provide a company name",
  path: ["companyName"],
});

export type UpgradeToBusinessFormData = z.infer<typeof upgradeToBusinessSchema>;