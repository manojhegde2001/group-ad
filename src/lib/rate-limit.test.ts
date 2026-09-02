import { describe, it, expect, vi, afterEach } from 'vitest';
import { rateLimit, getClientIp, rateLimitResponse, enforceRateLimit } from './rate-limit';

describe('rateLimit', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the limit', () => {
    const key = `test-${Math.random()}`;
    const r1 = rateLimit(key, 3, 60_000);
    const r2 = rateLimit(key, 3, 60_000);
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it('blocks requests once the limit is reached', () => {
    const key = `test-${Math.random()}`;
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    const blocked = rateLimit(key, 2, 60_000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('resets the window after it expires', () => {
    vi.useFakeTimers();
    const key = `test-${Math.random()}`;
    rateLimit(key, 1, 1_000);
    expect(rateLimit(key, 1, 1_000).success).toBe(false);

    vi.advanceTimersByTime(1_001);

    expect(rateLimit(key, 1, 1_000).success).toBe(true);
  });
});

describe('getClientIp', () => {
  it('reads the first entry of x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '9.9.9.9' },
    });
    expect(getClientIp(req)).toBe('9.9.9.9');
  });

  it('returns unknown when no IP headers are present', () => {
    const req = new Request('http://localhost');
    expect(getClientIp(req)).toBe('unknown');
  });
});

describe('rateLimitResponse', () => {
  it('returns a 429 with a Retry-After header', async () => {
    const res = rateLimitResponse(Date.now() + 5_000);
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
  });
});

describe('enforceRateLimit', () => {
  const req = new Request('http://localhost', { headers: { 'x-real-ip': '1.1.1.1' } });

  it('returns null while under the limit', () => {
    const id = `user-${Math.random()}`;
    expect(enforceRateLimit(req, 'test', 2, 60_000, id)).toBeNull();
    expect(enforceRateLimit(req, 'test', 2, 60_000, id)).toBeNull();
  });

  it('returns a 429 response once over the limit', () => {
    const id = `user-${Math.random()}`;
    enforceRateLimit(req, 'test', 1, 60_000, id);
    const res = enforceRateLimit(req, 'test', 1, 60_000, id);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
  });

  it('keeps separate buckets independent', () => {
    const id = `user-${Math.random()}`;
    enforceRateLimit(req, 'bucket-a', 1, 60_000, id);
    expect(enforceRateLimit(req, 'bucket-a', 1, 60_000, id)).not.toBeNull();
    expect(enforceRateLimit(req, 'bucket-b', 1, 60_000, id)).toBeNull();
  });

  it('falls back to the client IP when no identifier is given', () => {
    const bucket = `ip-test-${Math.random()}`;
    const a = new Request('http://localhost', { headers: { 'x-real-ip': '2.2.2.2' } });
    const b = new Request('http://localhost', { headers: { 'x-real-ip': '3.3.3.3' } });
    enforceRateLimit(a, bucket, 1, 60_000);
    expect(enforceRateLimit(a, bucket, 1, 60_000)).not.toBeNull();
    expect(enforceRateLimit(b, bucket, 1, 60_000)).toBeNull();
  });
});
