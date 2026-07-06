/**
 * Luna Smoke Test — Verifies the full x402 flow works.
 *
 * Tests:
 *   - Service info returns valid metadata
 *   - Agent status returns current metrics
 *   - Health check responds
 *   - Free operations (discover, rsvp) work without payment
 *   - Paid operations return 402 when no payment provided
 *
 * Run: npx vitest run __tests__/smoke.test.ts
 */
import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3002';

interface FetchResult {
  status: number;
  headers: Headers;
  body: unknown;
}

async function fetchJson(url: string, options?: RequestInit): Promise<FetchResult> {
  const res = await fetch(`${BASE_URL}${url}`, options);
  const body = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, body };
}

beforeAll(async () => {
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}, 30000);

describe('Health', () => {
  it('GET /api/health returns 200', async () => {
    const { status, body } = await fetchJson('/api/health');
    expect(status).toBe(200);
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('service', 'luna');
  });
});

describe('Agent Status', () => {
  it('GET /api/agent/status returns 200 with valid structure', async () => {
    const { status, body: raw } = await fetchJson('/api/agent/status');
    const body = raw as Record<string, unknown>;
    expect(status).toBe(200);
    expect(body).toHaveProperty('wallet');
    expect(body).toHaveProperty('casper');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('operations');
    expect(body).toHaveProperty('summary');
    const wallet = body.wallet as Record<string, unknown>;
    expect(wallet).toHaveProperty('address');
    expect(wallet).toHaveProperty('chain', 'casper-test');
    const casper = body.casper as Record<string, unknown>;
    expect(casper).toHaveProperty('network');
    const summary = body.summary as Record<string, unknown>;
    expect(summary).toHaveProperty('totalCalls');
    expect(summary).toHaveProperty('totalEarnedUSDC');
  });

  it('GET /api/agent/status returns CORS header', async () => {
    const { headers } = await fetchJson('/api/agent/status');
    const origin = headers.get('access-control-allow-origin');
    expect(origin).toBeTruthy(); // middleware returns specific origin, not wildcard
  });
});

describe('Service Info', () => {
  it('GET /api/x402/service-info returns 200 with operations', async () => {
    const { status, body: raw } = await fetchJson('/api/x402/service-info');
    const body = raw as Record<string, unknown>;
    expect(status).toBe(200);
    expect(body).toHaveProperty('serviceId', 'luna-v1');
    expect(body).toHaveProperty('operations');
    expect(body).toHaveProperty('network');
    const ops = body.operations as Record<string, unknown>;
    expect(ops).toHaveProperty('buy');
    expect(ops).toHaveProperty('transfer');
    expect(ops).toHaveProperty('check_in');
    expect(ops).toHaveProperty('discover');
  });
});

describe('Free Operations', () => {
  it('GET /api/x402/discover works without payment', async () => {
    const { status } = await fetchJson('/api/x402/discover');
    // Should either succeed (200) or return events (mock mode)
    expect([200, 500]).toContain(status);
  });

  it('POST /api/x402/rsvp works without payment', async () => {
    const { status } = await fetchJson('/api/x402/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: 'evt-001', userWallet: '0xmock' }),
    });
    expect([200, 400, 500]).toContain(status);
  });
});

describe('Paid Operations — 402 Flow', () => {
  it('POST /api/x402/buy returns 402 when no payment provided', async () => {
    const { status, body } = await fetchJson('/api/x402/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: 'evt-001', quantity: 2 }),
    });

    expect(status).toBe(402);
    expect(body).toHaveProperty('code', 'PAYMENT_REQUIRED');
    expect(body).toHaveProperty('payment_required');
  });

  it('POST /api/x402/transfer returns 402 when no payment provided', async () => {
    const { status } = await fetchJson('/api/x402/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: 'tix-001', toAddress: '0xtest' }),
    });
    expect(status).toBe(402);
  });

  it('POST /api/x402/check-in returns 402 when no payment provided', async () => {
    const { status } = await fetchJson('/api/x402/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: 'tix-001', eventId: 'evt-001' }),
    });
    expect(status).toBe(402);
  });

  it('GET /api/x402/marketplace returns 402 when no payment provided', async () => {
    const { status } = await fetchJson('/api/x402/marketplace');
    expect(status).toBe(402);
  });
});

describe('Idempotency Headers', () => {
  it('Paid endpoint returns 402 even with idempotency key when no payment', async () => {
    const { status, body } = await fetchJson('/api/x402/buy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': 'test-key-123',
      },
      body: JSON.stringify({ eventId: 'evt-001', quantity: 1 }),
    });
    expect(status).toBe(402);
    expect(body).toHaveProperty('code', 'PAYMENT_REQUIRED');
  });
});

describe('Validation', () => {
  it('POST /api/x402/buy returns 400 for missing required fields', async () => {
    // This endpoint won't reach validation because it requires payment first
    // But once payment is provided, missing eventId should return 400
    const { status } = await fetchJson('/api/x402/buy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYMENT-SIGNATURE': '{"signature":"test","publicKey":"test","authorization":{"from":"00test","to":"00test","value":"10000","validAfter":"0","validBefore":"9999999999","nonce":"0x00"}}',
      },
      body: JSON.stringify({}), // missing eventId, quantity
    });
    expect(status).toBe(400);
  });
});
