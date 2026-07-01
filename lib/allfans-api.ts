// 🏴 Pireph (June 30, 2026) — Hardened AllFans API Client
//
// Resilient API client for calling AllFans platform on Base.
// Features:
//   - Retry with exponential backoff (3 attempts)
//   - Request timeout (10s default)
//   - Structured error responses agents can parse
//   - Graceful degradation when AllFans is unreachable

import type {
  BuyTicketRequest,
  BuyTicketResponse,
  TransferTicketRequest,
  CheckInRequest,
  DiscoverRequest,
  MarketplaceRequest,
} from './luna-types';
import {
  isMockMode,
  mockDiscoverEvents,
  mockBuyTickets,
  mockTransferTicket,
  mockCheckIn,
  mockMarketplaceList,
  mockRsvp,
} from './dev-mode';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ALLFANS_API_URL = process.env.ALLFANS_API_URL || 'http://localhost:3000';
const ALLFANS_API_KEY = process.env.ALLFANS_API_KEY || '';
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// HTTP Client
// ---------------------------------------------------------------------------

class AllFansError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body: string,
  ) {
    super(message);
    this.name = 'AllFansError';
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(ALLFANS_API_KEY ? { 'X-API-Key': ALLFANS_API_KEY } : {}),
          ...(options.headers || {}),
        },
      });

      clearTimeout(timeout);
      return response;
    } catch (err) {
      clearTimeout(timeout);

      const isLastAttempt = attempt === retries;
      if (isLastAttempt) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new AllFansError('AllFans request timed out', 504, 'timeout');
        }
        throw new AllFansError(
          `AllFans unreachable after ${retries} attempts: ${err instanceof Error ? err.message : String(err)}`,
          503,
          'unreachable',
        );
      }

      // Exponential backoff: 200ms, 400ms, 800ms
      const delay = 200 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  // Should never reach here
  throw new AllFansError('Unexpected retry exhaustion', 500, '');
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text().catch(() => 'unknown');
    throw new AllFansError(
      `AllFans returned ${response.status}`,
      response.status,
      body,
    );
  }
  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------------

export async function discoverEvents(
  params: DiscoverRequest,
): Promise<unknown[]> {
  // Dev mode — return mock events
  if (isMockMode()) {
    return mockDiscoverEvents();
  }

  const query = new URLSearchParams();
  if (params.query) query.set('q', params.query);
  if (params.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params.dateTo) query.set('dateTo', params.dateTo);
  if (params.city) query.set('city', params.city);
  if (params.maxPrice) query.set('maxPrice', String(params.maxPrice));
  if (params.category) query.set('category', params.category);

  const res = await fetchWithRetry(
    `${ALLFANS_API_URL}/api/events?${query.toString()}`,
  );
  const data = await parseResponse<{ events?: unknown[]; data?: unknown[] }>(res);
  return data.events || data.data || [];
}

export async function buyTickets(
  params: BuyTicketRequest,
  userWallet: string,
): Promise<BuyTicketResponse> {
  // Dev mode — return mock tickets
  if (isMockMode()) {
    return mockBuyTickets(userWallet);
  }

  const res = await fetchWithRetry(`${ALLFANS_API_URL}/api/tickets/buy`, {
    method: 'POST',
    body: JSON.stringify({
      eventId: params.eventId,
      quantity: params.quantity,
      tierId: params.tierId,
      walletAddress: userWallet,
    }),
  });

  const data = await parseResponse<{
    tickets?: unknown[];
    data?: { tickets?: unknown[] };
    transactionHash?: string;
    txHash?: string;
  }>(res);

  return {
    success: true,
    tickets: (data.tickets || data.data?.tickets || []) as BuyTicketResponse['tickets'],
    payment: {
      amount: String(params.quantity * (params.maxPrice || 0)),
      chain: 'base-sepolia',
      transactionHash: data.transactionHash || data.txHash || '',
    },
  };
}

export async function transferTicket(
  params: TransferTicketRequest,
): Promise<{ success: boolean; transactionHash?: string }> {
  if (isMockMode()) {
    return mockTransferTicket();
  }
  const res = await fetchWithRetry(`${ALLFANS_API_URL}/api/tickets/transfer`, {
    method: 'POST',
    body: JSON.stringify({
      ticketId: params.ticketId,
      toAddress: params.toAddress,
    }),
  });

  const data = await parseResponse<{ transactionHash?: string; txHash?: string }>(res);
  return {
    success: true,
    transactionHash: data.transactionHash || data.txHash,
  };
}

export async function checkIn(
  params: CheckInRequest,
): Promise<{ success: boolean }> {
  if (isMockMode()) {
    return mockCheckIn();
  }
  const res = await fetchWithRetry(
    `${ALLFANS_API_URL}/api/events/${params.eventId}/companion/check-in`,
    {
      method: 'POST',
      body: JSON.stringify({ ticketId: params.ticketId }),
    },
  );

  await parseResponse(res);
  return { success: true };
}

export async function rsvpEvent(
  eventId: string,
  userWallet: string,
): Promise<{ success: boolean }> {
  if (isMockMode()) {
    return mockRsvp();
  }
  const res = await fetchWithRetry(
    `${ALLFANS_API_URL}/api/events/${eventId}/rsvp`,
    {
      method: 'POST',
      body: JSON.stringify({ walletAddress: userWallet }),
    },
  );

  await parseResponse(res);
  return { success: true };
}

export async function marketplaceList(
  params: MarketplaceRequest,
): Promise<unknown[]> {
  if (isMockMode()) {
    return mockMarketplaceList();
  }
  const query = new URLSearchParams();
  if (params.eventId) query.set('eventId', params.eventId);
  if (params.maxPrice) query.set('maxPrice', String(params.maxPrice));

  const res = await fetchWithRetry(
    `${ALLFANS_API_URL}/api/marketplace?${query.toString()}`,
  );
  const data = await parseResponse<{ listings?: unknown[]; data?: unknown[] }>(res);
  return data.listings || data.data || [];
}
