import { NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store — fine while the app runs as a single instance (current Railway
// setup). If it is ever scaled to multiple instances/replicas, this must move to Redis.
const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = 0;

function cleanup(now: number) {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Fixed-window rate limiter keyed by an arbitrary string (e.g. `login:1.2.3.4`).
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    cleanup(now);
    lastCleanup = now;
  }

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}

/**
 * Route-handler convenience wrapper. Returns a 429 `NextResponse` when the caller
 * is over the limit, or `null` when the request may proceed.
 *
 * `identifier` is the stable caller key — pass the session user id for
 * authenticated routes; it falls back to the client IP otherwise.
 *
 *   const limited = enforceRateLimit(request, 'posts:create', 20, 10 * 60_000, session.user.id);
 *   if (limited) return limited;
 */
export function enforceRateLimit(
  request: Request,
  bucket: string,
  limit: number,
  windowMs: number,
  identifier?: string | null,
): NextResponse | null {
  const key = `${bucket}:${identifier || getClientIp(request)}`;
  const { success, resetAt } = rateLimit(key, limit, windowMs);
  return success ? null : rateLimitResponse(resetAt);
}
