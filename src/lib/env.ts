import { z } from 'zod';

// In development only DATABASE_URL and an auth secret are required — every other
// integration degrades gracefully per-feature at request time (see e.g.
// isS3Configured() in src/lib/s3.ts), so a partial local setup still works.
//
// In production the bar is higher: signup now requires a working mailer, and
// uploads require S3, so those are hard-required below (see the superRefine).
// Google OAuth, Gemini, cron and Sentry stay optional everywhere.
const REQUIRED_IN_PRODUCTION = [
  'NEXT_PUBLIC_APP_URL', // verification / reset links are built from this
  'RESEND_API_KEY',      // email verification is mandatory for signup
  'EMAIL_FROM',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET_NAME',
] as const;

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),

  NEXTAUTH_SECRET: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  // Set automatically by Railway; used as a base-URL fallback for emails/links.
  RAILWAY_PUBLIC_DOMAIN: z.string().min(1).optional(),

  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),

  AWS_REGION: z.string().min(1).optional(),
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  AWS_S3_BUCKET_NAME: z.string().min(1).optional(),
  AWS_S3_PUBLIC_URL: z.string().url().optional(),

  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).optional(),

  CRON_SECRET: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),

  // Error tracking (optional — Sentry stays inert when unset).
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_RELEASE: z.string().min(1).optional(),
  NEXT_PUBLIC_SENTRY_RELEASE: z.string().min(1).optional(),
}).refine((data) => data.NEXTAUTH_SECRET || data.AUTH_SECRET, {
  message: 'Either NEXTAUTH_SECRET or AUTH_SECRET must be set',
}).superRefine((data, ctx) => {
  if (process.env.NODE_ENV !== 'production') return;
  for (const key of REQUIRED_IN_PRODUCTION) {
    if (!data[key as keyof typeof data]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: 'required in production',
      });
    }
  }
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

/**
 * Validates required environment variables. Throws with a readable summary
 * of everything missing/invalid instead of failing later with unrelated
 * runtime errors (e.g. a mysterious S3/mailer/auth failure at request time).
 */
export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  // Some hosts (e.g. Render) set optional vars to an empty string rather than
  // leaving them unset. Treat "" as unset so min(1) doesn't reject them.
  const sanitizedEnv = Object.fromEntries(
    Object.entries(process.env).map(([key, value]) => [key, value === '' ? undefined : value])
  );

  const parsed = envSchema.safeParse(sanitizedEnv);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
