// 🌙 Luna Operation Types
// Shared between apps/agent and packages/blockchain

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
  | 'marketplace'
  | 'create_event'
  | 'manage_gig'
  | 'manage_capacity'
  | 'set_pricing'
  | 'venue_analytics'
  | 'process_payout'
  | 'lookup_contact'
  | 'pre_verify'
  | 'buy_merch'
  | 'list_for_sale'
  | 'cancel_listing';

export const LUNA_OPERATIONS: LunaOperation[] = [
  'discover', 'buy', 'transfer', 'check_in', 'rsvp', 'marketplace',
  'create_event', 'manage_gig', 'manage_capacity', 'set_pricing',
  'venue_analytics', 'process_payout',
  'lookup_contact', 'pre_verify', 'buy_merch',
  'list_for_sale', 'cancel_listing',
];

export const LUNA_PRICING: Record<LunaOperation, number> = {
  discover: 0, buy: 0.01, transfer: 0.01, check_in: 0.005, rsvp: 0, marketplace: 0.01,
  create_event: 0.05, manage_gig: 0.02, manage_capacity: 0.01, set_pricing: 0.01,
  venue_analytics: 0.02, process_payout: 0.05,
  lookup_contact: 0, pre_verify: 0.01, buy_merch: 0.02,
  list_for_sale: 0.01, cancel_listing: 0,
};

export const LUNA_OPERATION_NAMES: Record<LunaOperation, string> = {
  discover: 'Discover Events', buy: 'Buy Tickets', transfer: 'Transfer Ticket',
  check_in: 'Event Check-In', rsvp: 'RSVP', marketplace: 'Marketplace',
  create_event: 'Create Event', manage_gig: 'Manage Gig Opening',
  manage_capacity: 'Manage Capacity', set_pricing: 'Set Pricing',
  venue_analytics: 'Venue Analytics', process_payout: 'Process Payout',
  lookup_contact: 'Look Up Contact', pre_verify: 'Pre-Verify',
  buy_merch: 'Buy Merchandise', list_for_sale: 'List for Sale',
  cancel_listing: 'Cancel Listing',
};

export const LUNA_OPERATION_DESCRIPTIONS: Record<LunaOperation, string> = {
  discover: 'Search and discover upcoming events near you. Free.',
  buy: 'Purchase event tickets via x402 micropayment on Casper.',
  transfer: 'Transfer a ticket to another wallet or agent.',
  check_in: 'Check into an event. On-chain proof of attendance.',
  rsvp: 'Let the host know you\'re coming. Free.',
  marketplace: 'Browse and purchase resale tickets from other attendees.',
  create_event: 'Create a new event listing with date, venue, pricing tiers, and description.',
  manage_gig: 'Post a gig opening (comedian, photographer, vendor, etc.) or fill an existing gig slot.',
  manage_capacity: 'Update venue capacity limits, ticket availability, or section allocations.',
  set_pricing: 'Set or update event ticket pricing tiers, early bird pricing, or promotional rates.',
  venue_analytics: 'Get performance data for an event or venue — tickets sold, revenue, attendance.',
  process_payout: 'Process payout to creators, artists, or vendors from event revenue.',
  lookup_contact: 'Look up a contact from your past event attendance or connections. Free.',
  pre_verify: 'Pre-verify attendees for drink passes, age verification, VIP access, or event add-ons.',
  buy_merch: 'Purchase event merchandise — t-shirts, hats, posters, and other gear.',
  list_for_sale: 'List your tickets on the secondary marketplace or auction house.',
  cancel_listing: 'Cancel your active marketplace or auction listing. Free.',
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
  tickets: Array<{ id: string; eventName: string; date: string; venue: string; tier: string; price: number }>;
  payment: { amount: string; chain: string; transactionHash: string };
}

export interface TransferTicketRequest { ticketId: string; toAddress: string; }
export interface CheckInRequest { ticketId: string; eventId: string; }
export interface DiscoverRequest {
  query?: string; dateFrom?: string; dateTo?: string; city?: string; maxPrice?: number; category?: string;
}
export interface MarketplaceRequest { eventId?: string; maxPrice?: number; }
