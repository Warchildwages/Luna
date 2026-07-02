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
} from '@luna/shared';
import {
  isMockMode,
  mockDiscoverEvents,
  mockBuyTickets,
  mockTransferTicket,
  mockCheckIn,
  mockMarketplaceList,
  mockRsvp,
} from '@luna/blockchain';

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

// ---------------------------------------------------------------------------
// Creator / Venue Operations
// ---------------------------------------------------------------------------

export interface CreateEventRequest {
  title: string;
  description?: string;
  date: string;
  venue?: string;
  city?: string;
  category?: string;
  ticketTiers?: Array<{ name: string; price: number; capacity: number }>;
  maxCapacity?: number;
  organizerWallet?: string;
}

export interface ManageGigRequest {
  action: 'post' | 'fill' | 'cancel';
  gigTitle?: string;
  description?: string;
  dateTime?: string;
  eventId?: string;
  gigId?: string;
  role?: string;
  organizerWallet?: string;
}

export interface ManageCapacityRequest {
  eventId: string;
  maxCapacity?: number;
  sectionAllocations?: Record<string, number>;
}

export interface SetPricingRequest {
  eventId: string;
  tiers: Array<{ name: string; price: number; capacity?: number; available?: number }>;
}

export interface ProcessPayoutRequest {
  eventId: string;
  recipientAddress: string;
  amount: number;
  reason?: string;
}

export async function createEvent(params: CreateEventRequest): Promise<{ eventId: string; success: boolean }> {
  if (isMockMode()) {
    return { eventId: `evt_${Date.now().toString(36)}`, success: true };
  }
  const res = await fetchWithRetry(`${ALLFANS_API_URL}/api/events`, {
    method: 'POST',
    body: JSON.stringify({
      title: params.title,
      description: params.description,
      dateTime: params.date,
      venue: params.venue,
      city: params.city,
      category: params.category,
      ticketTiers: params.ticketTiers,
      maxCapacity: params.maxCapacity,
      organizerWallet: params.organizerWallet,
    }),
  });
  const data = await parseResponse<{ eventId?: string; id?: string }>(res);
  return { eventId: data.eventId || data.id || '', success: true };
}

export async function manageGig(params: ManageGigRequest): Promise<{ gigId: string; success: boolean }> {
  if (isMockMode()) {
    return { gigId: `gig_${Date.now().toString(36)}`, success: true };
  }
  const res = await fetchWithRetry(`${ALLFANS_API_URL}/api/gigs`, {
    method: 'POST',
    body: JSON.stringify({
      action: params.action,
      title: params.gigTitle,
      description: params.description,
      dateTime: params.dateTime,
      eventId: params.eventId,
      gigId: params.gigId,
      role: params.role,
      creator: params.organizerWallet,
    }),
  });
  const data = await parseResponse<{ gigId?: string; id?: string }>(res);
  return { gigId: data.gigId || data.id || '', success: true };
}

export async function manageCapacity(params: ManageCapacityRequest): Promise<{ success: boolean }> {
  if (isMockMode()) return { success: true };
  const res = await fetchWithRetry(`${ALLFANS_API_URL}/api/events/${params.eventId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      maxCapacity: params.maxCapacity,
      sectionAllocations: params.sectionAllocations,
    }),
  });
  await parseResponse(res);
  return { success: true };
}

export async function setPricing(params: SetPricingRequest): Promise<{ success: boolean }> {
  if (isMockMode()) return { success: true };
  const res = await fetchWithRetry(`${ALLFANS_API_URL}/api/events/${params.eventId}`, {
    method: 'PATCH',
    body: JSON.stringify({ tiers: params.tiers }),
  });
  await parseResponse(res);
  return { success: true };
}

export async function processPayout(params: ProcessPayoutRequest): Promise<{ txHash: string; success: boolean }> {
  if (isMockMode()) {
    return { txHash: `0x${Date.now().toString(16).padStart(64, '0')}`, success: true };
  }
  const res = await fetchWithRetry(`${ALLFANS_API_URL}/api/organizer/payouts`, {
    method: 'POST',
    body: JSON.stringify({
      eventId: params.eventId,
      recipientAddress: params.recipientAddress,
      amount: params.amount,
      reason: params.reason,
    }),
  });
  const data = await parseResponse<{ txHash?: string; transactionHash?: string }>(res);
  return { txHash: data.txHash || data.transactionHash || '', success: true };
}

// ---------------------------------------------------------------------------
// Contact / Social Operations
// ---------------------------------------------------------------------------

export interface LookupContactRequest {
  name: string;
  fromEvent?: string;
  walletAddress?: string;
}

export interface PreVerifyRequest {
  eventId: string;
  attendees: Array<{
    name?: string;
    ticketId?: string;
    walletAddress?: string;
  }>;
  verifyType: 'drink_pass' | 'age_verification' | 'vip_access' | 'add_on';
}

export interface BuyMerchRequest {
  eventId: string;
  items: Array<{
    name: string;
    size?: string;
    color?: string;
    quantity: number;
  }>;
  deliveryAddress?: string;
}

export async function lookupContact(params: LookupContactRequest): Promise<{
  found: boolean;
  name: string;
  walletAddress?: string;
  lastEvent?: string;
}> {
  if (isMockMode()) {
    return {
      found: true,
      name: params.name,
      walletAddress: `${params.name.toLowerCase().replace(/\s+/g, '')}.casper.testnet`,
      lastEvent: params.fromEvent || 'EDM concert last week',
    };
  }
  const res = await fetchWithRetry(
    `${ALLFANS_API_URL}/api/events/search?contact=${encodeURIComponent(params.name)}${params.fromEvent ? `&fromEvent=${encodeURIComponent(params.fromEvent)}` : ''}`,
  );
  const data = await parseResponse<{
    found?: boolean; name?: string; walletAddress?: string; lastEvent?: string;
  }>(res);
  return {
    found: data.found || false,
    name: data.name || params.name,
    walletAddress: data.walletAddress,
    lastEvent: data.lastEvent,
  };
}

export async function preVerifyAttendees(params: PreVerifyRequest): Promise<{
  success: boolean;
  verified: number;
  verificationIds: string[];
}> {
  if (isMockMode()) {
    return {
      success: true,
      verified: params.attendees.length,
      verificationIds: params.attendees.map(() => `vrf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`),
    };
  }
  const res = await fetchWithRetry(`${ALLFANS_API_URL}/api/events/${params.eventId}/verify`, {
    method: 'POST',
    body: JSON.stringify({ attendees: params.attendees, verifyType: params.verifyType }),
  });
  const data = await parseResponse<{ verified?: number; verificationIds?: string[] }>(res);
  return {
    success: true,
    verified: data.verified || 0,
    verificationIds: data.verificationIds || [],
  };
}

export async function buyMerch(params: BuyMerchRequest): Promise<{
  success: boolean;
  orderId: string;
  items: Array<{ name: string; size?: string; quantity: number }>;
}> {
  if (isMockMode()) {
    return {
      success: true,
      orderId: `merch_${Date.now().toString(36)}`,
      items: params.items.map((i) => ({ name: i.name, size: i.size, quantity: i.quantity })),
    };
  }
  const res = await fetchWithRetry(`${ALLFANS_API_URL}/api/events/${params.eventId}/merch`, {
    method: 'POST',
    body: JSON.stringify({
      items: params.items,
      deliveryAddress: params.deliveryAddress,
    }),
  });
  const data = await parseResponse<{ orderId?: string; items?: Array<{ name: string; size?: string; quantity: number }> }>(res);
  return {
    success: true,
    orderId: data.orderId || '',
    items: data.items || [],
  };
}

// ---------------------------------------------------------------------------
// Marketplace / Auction Operations
// ---------------------------------------------------------------------------

export interface ListForSaleRequest {
  ticketId: string;
  eventId: string;
  price: number;
  listingType: 'fixed' | 'auction';
  startingBid?: number;
  reservePrice?: number;
  durationHours?: number;
}

export interface CancelListingRequest {
  listingId: string;
  reason?: string;
}

export async function listTicketForSale(params: ListForSaleRequest): Promise<{
  listingId: string;
  success: boolean;
  type: string;
  price: number;
}> {
  if (isMockMode()) {
    return {
      listingId: `l_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      success: true,
      type: params.listingType,
      price: params.price,
    };
  }
  const res = await fetchWithRetry(`${ALLFANS_API_URL}/api/marketplace`, {
    method: 'POST',
    body: JSON.stringify({
      _action: 'create',
      ticketId: params.ticketId,
      eventId: params.eventId,
      price: params.price,
      listingType: params.listingType,
      startingBid: params.startingBid,
      reservePrice: params.reservePrice,
      durationHours: params.durationHours,
    }),
  });
  const data = await parseResponse<{ listingId?: string; id?: string; type?: string }>(res);
  return {
    listingId: data.listingId || data.id || '',
    success: true,
    type: params.listingType,
    price: params.price,
  };
}

export async function cancelListing(params: CancelListingRequest): Promise<{ success: boolean }> {
  if (isMockMode()) return { success: true };
  const res = await fetchWithRetry(`${ALLFANS_API_URL}/api/marketplace`, {
    method: 'POST',
    body: JSON.stringify({
      _action: 'cancel',
      listingId: params.listingId,
      reason: params.reason,
    }),
  });
  await parseResponse(res);
  return { success: true };
}
