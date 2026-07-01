import { z } from 'zod';

// ---------------------------------------------------------------------------
// Agent Status
// ---------------------------------------------------------------------------

export interface LunaWallet {
  address: string;
  chain: string;
  balanceUSDC: string;
}

export interface LunaCasperInfo {
  network: string;
  facilitatorUrl: string;
  attestationsCount: number;
}

export interface LunaOperationSummary {
  name: string;
  price: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  lastCalledAt: string | null;
  usdcEarned: number;
}

export interface LunaStatusSummary {
  totalCalls: number;
  totalEarnedUSDC: number;
  uptimeSeconds: number;
}

export interface LunaAgentStatus {
  wallet: LunaWallet;
  casper: LunaCasperInfo;
  uptime: string;
  version: string;
  operations: LunaOperationSummary[];
  summary: LunaStatusSummary;
}

// ---------------------------------------------------------------------------
// x402 Operations
// ---------------------------------------------------------------------------

export type LunaOperation =
  | 'discover'
  | 'buy'
  | 'transfer'
  | 'check_in'
  | 'rsvp'
  | 'marketplace';

export const LUNA_OPERATIONS: LunaOperation[] = [
  'discover',
  'buy',
  'transfer',
  'check_in',
  'rsvp',
  'marketplace',
];

export const LUNA_PRICING: Record<LunaOperation, number> = {
  discover: 0,
  buy: 0.01,
  transfer: 0.01,
  check_in: 0.005,
  rsvp: 0,
  marketplace: 0.01,
};

export const LUNA_OPERATION_NAMES: Record<LunaOperation, string> = {
  discover: 'Discover Events',
  buy: 'Buy Tickets',
  transfer: 'Transfer Ticket',
  check_in: 'Event Check-In',
  rsvp: 'RSVP',
  marketplace: 'Marketplace',
};

export const LUNA_OPERATION_DESCRIPTIONS: Record<LunaOperation, string> = {
  discover: 'Search and discover upcoming events near you. Free.',
  buy: 'Purchase event tickets via x402 micropayment on Casper.',
  transfer: 'Transfer a ticket to another wallet or agent.',
  check_in: 'Check into an event. On-chain proof of attendance.',
  rsvp: 'Let the host know you\'re coming. Free.',
  marketplace: 'Browse and purchase resale tickets from other attendees.',
};

// ---------------------------------------------------------------------------
// Request/Response types
// ---------------------------------------------------------------------------

export interface BuyTicketRequest {
  eventId: string;
  quantity: number;
  tierId?: string;
  maxPrice?: number;
}

export interface BuyTicketResponse {
  success: boolean;
  tickets: Array<{
    id: string;
    eventName: string;
    date: string;
    venue: string;
    tier: string;
    price: number;
  }>;
  payment: {
    amount: string;
    chain: string;
    transactionHash: string;
  };
}

export interface TransferTicketRequest {
  ticketId: string;
  toAddress: string;
}

export interface CheckInRequest {
  ticketId: string;
  eventId: string;
}

export interface DiscoverRequest {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  city?: string;
  maxPrice?: number;
  category?: string;
}

export interface MarketplaceRequest {
  eventId?: string;
  maxPrice?: number;
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const buyTicketSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  quantity: z.number().int().min(1).max(10, 'Max 10 tickets per purchase'),
  tierId: z.string().optional(),
  maxPrice: z.number().positive().optional(),
});

export const transferTicketSchema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required'),
  toAddress: z.string().min(1, 'Recipient address is required'),
});

export const checkInSchema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required'),
  eventId: z.string().min(1, 'Event ID is required'),
});

export const discoverSchema = z.object({
  query: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  city: z.string().optional(),
  maxPrice: z.number().positive().optional(),
  category: z.string().optional(),
});
