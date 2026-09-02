import { z } from 'zod';
import { logger } from './logger';

// Only DATABASE_URL and an auth secret can prevent the app from booting — those
// stay hard-required. Every other integration degrades gracefully per-feature at
// request time (see e.g. isS3Configured() in src/lib/s3.ts).
//
// In production we additionally *warn* (loudly, but non-fatally) when the vars
// below are missing, since signup needs a mailer and uploads need S3. A gap
// there breaks a feature, not the whole deployment.
const RECOMMENDED_IN_PRODUCTION = [
  'RESEND_API_KEY', // email verification is mandatory for signup
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

  // - Some hosts (e.g. Render) set optional vars to an empty string rather than
  //   leaving them unset — treat "" as unset so min(1) doesn't reject them.
  // - Some dashboards (e.g. Railway's raw editor) keep the surrounding quotes
  //   from a pasted `KEY="value"` line — strip a single matching wrapping pair
  //   so `https://...` isn't rejected as an invalid URL.
  const sanitizedEnv = Object.fromEntries(
    Object.entries(process.env).map(([key, value]) => {
      if (value == null) return [key, undefined];
      const unquoted = value.replace(/^(['"])([\s\S]*)\1$/, '$2');
      return [key, unquoted === '' ? undefined : unquoted];
    })
  );

  const parsed = envSchema.safeParse(sanitizedEnv);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  cachedEnv = parsed.data;

  if (process.env.NODE_ENV === 'production') {
    const appUrl = parsed.data.NEXT_PUBLIC_APP_URL || process.env.RAILWAY_PUBLIC_DOMAIN;
    const missing = [
      !appUrl && 'NEXT_PUBLIC_APP_URL',
      ...RECOMMENDED_IN_PRODUCTION.filter((k) => !parsed.data[k]),
    ].filter(Boolean);

    if (missing.length) {
      logger.warn(
        'Production environment is missing recommended variables — the related features will be degraded until they are set',
        { missing },
      );
    }
  }

  return cachedEnv;
}
