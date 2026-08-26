import { z } from 'zod';

// Only DATABASE_URL and an auth secret are truly required to boot. Everything
// else (AWS, Resend, Gemini, Google OAuth) is optional here on purpose — the
// app already degrades those features gracefully per-feature at request time
// (see e.g. isS3Configured() in src/lib/s3.ts), so treating them as mandatory
// at startup would break local/partial setups that work fine today.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),

  NEXTAUTH_SECRET: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

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

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
