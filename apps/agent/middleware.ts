/**
 * Luna — Middleware
 *
 * Rate limiting + CORS for all /api/* routes.
 * Mirrors Sigil's middleware pattern from signet.ventures.
 *
 * Rate-limited routes: all /api/* routes
 * Excluded: /api/health (Render health checks)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// In-memory token bucket rate limiter
// ---------------------------------------------------------------------------

const buckets = new Map<string, { tokens: number; lastRefill: number }>();
const MAX_TOKENS = 60;
const REFILL_INTERVAL = 1_000; // 1 token per second

function getRateLimitKey(request: NextRequest): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';
  return ip;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  lazyCleanup();
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    buckets.set(key, bucket);
  }

  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(elapsed / REFILL_INTERVAL);
  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return { allowed: true, remaining: bucket.tokens };
  }

  return { allowed: false, remaining: 0 };
}

let _lastCleanup = Date.now();
function lazyCleanup() {
  const now = Date.now();
  if (now - _lastCleanup < 5 * 60_000) return;
  _lastCleanup = now;
  const cutoff = now - 15 * 60_000;
  for (const [key, bucket] of buckets) {
    if (bucket.lastRefill < cutoff) {
      buckets.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

function getCorsOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_PRODUCTION_URL,
    'http://localhost:3000',
    'http://localhost:3002',
  ].filter(Boolean) as string[];

  if (origin && allowedOrigins.some((ao) => origin.startsWith(ao))) {
    return origin;
  }
  return allowedOrigins[0] || '*';
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only process API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Health check — no rate limiting
  if (pathname === '/api/health') {
    const response = NextResponse.next();
    const origin = getCorsOrigin(request);
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Payment-Id, PAYMENT-SIGNATURE, X-Casper-Payment, X-Idempotency-Key, X-User-Wallet');
    return response;
  }

  // Rate limit all other API routes
  const key = getRateLimitKey(request);
  const { allowed, remaining } = checkRateLimit(key);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before retrying.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(MAX_TOKENS),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  // Pass through with rate limit headers and CORS
  const origin = getCorsOrigin(request);
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(MAX_TOKENS));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Payment-Id, PAYMENT-SIGNATURE, X-Casper-Payment, X-Idempotency-Key, X-User-Wallet, X-API-Key',
  );
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
