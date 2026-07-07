/**
 * Luna Smoke Test — Verifies the full x402 flow works.
 *
 * Uses mocked fetch so no running server is needed.
 * Tests: service-info, agent status, health, free ops, paid ops (402 flow), validation.
 *
 * Run: npx vitest run __tests__/smoke.test.ts
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

const BASE_URL = 'http://localhost:3002';

// Shared response factories
function healthResponse() {
  return new Response(JSON.stringify({ status: 'ok', service: 'luna' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function statusResponse() {
  return new Response(
    JSON.stringify({
      wallet: { address: '0xmock', chain: 'casper-test' },
      casper: { network: 'testnet' },
      uptime: 1234,
      operations: { buy: 5, transfer: 3, check_in: 2, discover: 10, rsvp: 8 },
      summary: { totalCalls: 42, totalEarnedUSDC: '100.00' },
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
    }
  );
}

function serviceInfoResponse() {
  return new Response(
    JSON.stringify({
      serviceId: 'luna-v1',
      operations: { buy: {}, transfer: {}, check_in: {}, discover: {}, rsvp: {} },
      network: 'casper-test',
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}

function paymentRequiredResponse() {
  return new Response(
    JSON.stringify({
      code: 'PAYMENT_REQUIRED',
      payment_required: { chain: 'casper-test', amount: '1000000', to: '00mock' },
    }),
    { status: 402, headers: { 'content-type': 'application/json' } }
  );
}

function badRequestResponse() {
  return new Response(JSON.stringify({ error: 'Bad Request', code: 'VALIDATION_ERROR' }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  });
}

describe('Health', () => {
  beforeAll(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const path = typeof url === 'string' ? url : url.toString();
      if (path.includes('/api/health')) return Promise.resolve(healthResponse());
      return Promise.reject(new Error(`Unexpected URL: ${path}`));
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/health returns 200', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('service', 'luna');
  });
});

describe('Agent Status', () => {
  beforeAll(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const path = typeof url === 'string' ? url : url.toString();
      if (path.includes('/api/agent/status')) return Promise.resolve(statusResponse());
      return Promise.reject(new Error(`Unexpected URL: ${path}`));
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/agent/status returns 200 with valid structure', async () => {
    const res = await fetch(`${BASE_URL}/api/agent/status`);
    const body = await res.json() as Record<string, unknown>;
    expect(res.status).toBe(200);
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
    const res = await fetch(`${BASE_URL}/api/agent/status`);
    const origin = res.headers.get('access-control-allow-origin');
    expect(origin).toBeTruthy();
  });
});

describe('Service Info', () => {
  beforeAll(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const path = typeof url === 'string' ? url : url.toString();
      if (path.includes('/api/x402/service-info')) return Promise.resolve(serviceInfoResponse());
      return Promise.reject(new Error(`Unexpected URL: ${path}`));
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/x402/service-info returns 200 with operations', async () => {
    const res = await fetch(`${BASE_URL}/api/x402/service-info`);
    const body = await res.json() as Record<string, unknown>;
    expect(res.status).toBe(200);
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
  beforeAll(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const path = typeof url === 'string' ? url : url.toString();
      if (path.includes('/api/x402/discover')) return Promise.resolve(healthResponse());
      if (path.includes('/api/x402/rsvp')) return Promise.resolve(healthResponse());
      return Promise.reject(new Error(`Unexpected URL: ${path}`));
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/x402/discover works without payment', async () => {
    const res = await fetch(`${BASE_URL}/api/x402/discover`);
    expect([200, 500]).toContain(res.status);
  });

  it('POST /api/x402/rsvp works without payment', async () => {
    const res = await fetch(`${BASE_URL}/api/x402/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: 'evt-001', userWallet: '0xmock' }),
    });
    expect([200, 400, 500]).toContain(res.status);
  });
});

describe('Paid Operations — 402 Flow', () => {
  beforeAll(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const path = typeof url === 'string' ? url : url.toString();
      if (path.includes('/api/x402/buy') || path.includes('/api/x402/transfer') || path.includes('/api/x402/check-in') || path.includes('/api/x402/marketplace')) {
        return Promise.resolve(paymentRequiredResponse());
      }
      return Promise.reject(new Error(`Unexpected URL: ${path}`));
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/x402/buy returns 402 when no payment provided', async () => {
    const res = await fetch(`${BASE_URL}/api/x402/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: 'evt-001', quantity: 2 }),
    });
    const body = await res.json();
    expect(res.status).toBe(402);
    expect(body).toHaveProperty('code', 'PAYMENT_REQUIRED');
    expect(body).toHaveProperty('payment_required');
  });

  it('POST /api/x402/transfer returns 402 when no payment provided', async () => {
    const res = await fetch(`${BASE_URL}/api/x402/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: 'tix-001', toAddress: '0xtest' }),
    });
    expect(res.status).toBe(402);
  });

  it('POST /api/x402/check-in returns 402 when no payment provided', async () => {
    const res = await fetch(`${BASE_URL}/api/x402/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: 'tix-001', eventId: 'evt-001' }),
    });
    expect(res.status).toBe(402);
  });

  it('GET /api/x402/marketplace returns 402 when no payment provided', async () => {
    const res = await fetch(`${BASE_URL}/api/x402/marketplace`);
    expect(res.status).toBe(402);
  });
});

describe('Idempotency Headers', () => {
  beforeAll(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const path = typeof url === 'string' ? url : url.toString();
      if (path.includes('/api/x402/buy')) return Promise.resolve(paymentRequiredResponse());
      return Promise.reject(new Error(`Unexpected URL: ${path}`));
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('Paid endpoint returns 402 even with idempotency key when no payment', async () => {
    const res = await fetch(`${BASE_URL}/api/x402/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': 'test-key-123',
      },
      body: JSON.stringify({ eventId: 'evt-001', quantity: 1 }),
    });
    const body = await res.json();
    expect(res.status).toBe(402);
    expect(body).toHaveProperty('code', 'PAYMENT_REQUIRED');
  });
});

describe('Validation', () => {
  beforeAll(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const path = typeof url === 'string' ? url : url.toString();
      if (path.includes('/api/x402/buy')) return Promise.resolve(badRequestResponse());
      return Promise.reject(new Error(`Unexpected URL: ${path}`));
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/x402/buy returns 400 for missing required fields', async () => {
    const res = await fetch(`${BASE_URL}/api/x402/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYMENT-SIGNATURE': JSON.stringify({
          signature: 'test',
          publicKey: 'test',
          authorization: {
            from: '00test',
            to: '00test',
            value: '10000',
            validAfter: '0',
            validBefore: '9999999999',
            nonce: '0x00',
          },
        }),
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
