/** Small in-memory sliding-window rate limiter (per key, per process). */

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  now?: () => number;
}

const MAX_TRACKED_KEYS = 10_000;

export function createRateLimiter({ windowMs, max, now = Date.now }: RateLimiterOptions) {
  const hits = new Map<string, number[]>();

  return function check(key: string): { allowed: boolean; retryAfterSec: number } {
    const t = now();
    const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);

    if (recent.length >= max) {
      hits.set(key, recent);
      return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((recent[0] + windowMs - t) / 1000)) };
    }
    recent.push(t);
    hits.set(key, recent);

    if (hits.size > MAX_TRACKED_KEYS) {
      for (const [k, list] of hits) {
        if (list.every((ts) => t - ts >= windowMs)) hits.delete(k);
      }
    }
    return { allowed: true, retryAfterSec: 0 };
  };
}
