// 🏴 Pireph (July 1, 2026) — Luna Operation Executor
//
// Executes a plan of operations returned by the NLU engine.
// Each operation maps to an x402 endpoint or free endpoint.
//
// Steps:
//   1. Take the plan from NLU
//   2. Execute each operation in order
//   3. Aggregate results into one response
//   4. Handle failures gracefully (partial success)

import {
  discoverEvents, buyTickets, transferTicket, checkIn, rsvpEvent, marketplaceList,
  createEvent, manageGig, manageCapacity, setPricing, processPayout,
  lookupContact, preVerifyAttendees, buyMerch,
  listTicketForSale, cancelListing,
  type CreateEventRequest, type ManageGigRequest, type ManageCapacityRequest,
  type SetPricingRequest, type ProcessPayoutRequest,
} from './allfans-api';
import type { PlannedOperation, NLUResult } from './nlu';
import type { LunaOperation } from '@luna/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StepResult {
  operation: LunaOperation;
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ExecutionResult {
  success: boolean;
  summary: string;
  steps: StepResult[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Op → handler map
// ---------------------------------------------------------------------------

type OperationHandler = (params: Record<string, unknown>) => Promise<unknown>;

const HANDLERS: Record<LunaOperation, OperationHandler> = {
  discover: async (params) => {
    return discoverEvents({
      query: params.query as string | undefined,
      dateFrom: params.dateFrom as string | undefined,
      dateTo: params.dateTo as string | undefined,
      city: params.city as string | undefined,
      maxPrice: params.maxPrice as number | undefined,
      category: params.category as string | undefined,
    });
  },

  buy: async (params) => {
    return buyTickets(
      {
        eventId: params.eventId as string,
        quantity: (params.quantity as number) || 1,
        tierId: params.tierId as string | undefined,
        maxPrice: params.maxPrice as number | undefined,
      },
      (params.userWallet as string) || '',
    );
  },

  transfer: async (params) => {
    return transferTicket({
      ticketId: params.ticketId as string,
      toAddress: params.toAddress as string,
    });
  },

  check_in: async (params) => {
    return checkIn({
      ticketId: params.ticketId as string,
      eventId: params.eventId as string,
    });
  },

  rsvp: async (params) => {
    return rsvpEvent(params.eventId as string, (params.userWallet as string) || '');
  },

  marketplace: async (params) => {
    return marketplaceList({
      eventId: params.eventId as string | undefined,
      maxPrice: params.maxPrice as number | undefined,
    });
  },

  // -------------------------------------------------------------------
  // Creator / Venue Operations
  // -------------------------------------------------------------------

  create_event: async (params) => {
    return createEvent({
      title: params.title as string,
      description: params.description as string | undefined,
      date: params.date as string,
      venue: params.venue as string | undefined,
      city: params.city as string | undefined,
      category: params.category as string | undefined,
      ticketTiers: params.ticketTiers as CreateEventRequest['ticketTiers'] | undefined,
      maxCapacity: params.maxCapacity as number | undefined,
      organizerWallet: params.organizerWallet as string | undefined,
    });
  },

  manage_gig: async (params) => {
    return manageGig({
      action: (params.action as ManageGigRequest['action']) || 'post',
      gigTitle: params.gigTitle as string | undefined,
      description: params.description as string | undefined,
      dateTime: params.dateTime as string | undefined,
      eventId: params.eventId as string | undefined,
      gigId: params.gigId as string | undefined,
      role: params.role as string | undefined,
      organizerWallet: params.organizerWallet as string | undefined,
    });
  },

  manage_capacity: async (params) => {
    return manageCapacity({
      eventId: params.eventId as string,
      maxCapacity: params.maxCapacity as number | undefined,
      sectionAllocations: params.sectionAllocations as Record<string, number> | undefined,
    });
  },

  set_pricing: async (params) => {
    return setPricing({
      eventId: params.eventId as string,
      tiers: params.tiers as SetPricingRequest['tiers'],
    });
  },

  venue_analytics: async (params) => {
    const { isMockMode } = await import('./dev-mode');
    if (isMockMode()) {
      return {
        eventId: params.eventId as string,
        ticketsSold: 342,
        totalCapacity: 500,
        revenue: 4210.50,
        attendance: 289,
        avgRating: 4.3,
        topCategory: (params.category as string) || 'general',
        period: (params.period as string) || 'last-30-days',
        note: 'Mock data. Connect AllFans API for live analytics.',
      };
    }
    // Real analytics require AllFans API integration
    const eventId = params.eventId as string;
    if (!eventId) throw new Error('eventId is required for venue analytics');
    const res = await fetch(`${process.env.ALLFANS_API_URL || 'http://localhost:3000'}/api/events/${eventId}/analytics`);
    if (!res.ok) throw new Error(`AllFans analytics returned ${res.status}`);
    return res.json();
  },

  process_payout: async (params) => {
    return processPayout({
      eventId: params.eventId as string,
      recipientAddress: params.recipientAddress as string,
      amount: params.amount as number,
      reason: params.reason as string | undefined,
    });
  },

  // -------------------------------------------------------------------
  // Contact / Social Operations
  // -------------------------------------------------------------------

  lookup_contact: async (params) => {
    return lookupContact({
      name: params.name as string,
      fromEvent: params.fromEvent as string | undefined,
      walletAddress: params.walletAddress as string | undefined,
    });
  },

  pre_verify: async (params) => {
    return preVerifyAttendees({
      eventId: params.eventId as string,
      attendees: params.attendees as Array<{ name?: string; ticketId?: string; walletAddress?: string }>,
      verifyType: (params.verifyType as 'drink_pass' | 'age_verification' | 'vip_access' | 'add_on') || 'drink_pass',
    });
  },

  buy_merch: async (params) => {
    return buyMerch({
      eventId: params.eventId as string,
      items: params.items as Array<{ name: string; size?: string; color?: string; quantity: number }>,
      deliveryAddress: params.deliveryAddress as string | undefined,
    });
  },

  list_for_sale: async (params) => {
    return listTicketForSale({
      ticketId: params.ticketId as string,
      eventId: params.eventId as string,
      price: params.price as number,
      listingType: (params.listingType as 'fixed' | 'auction') || 'fixed',
      startingBid: params.startingBid as number | undefined,
      reservePrice: params.reservePrice as number | undefined,
      durationHours: params.durationHours as number | undefined,
    });
  },

  cancel_listing: async (params) => {
    return cancelListing({
      listingId: params.listingId as string,
      reason: params.reason as string | undefined,
    });
  },
};

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

/**
 * Execute a plan of operations in sequence.
 * Each step runs independently — failure in one step doesn't block others.
 *
 * @param plan - The operation plan from NLU
 * @param userWallet - Optional wallet address for ticket delivery
 * @returns Aggregated results from all steps
 */
export async function executePlan(
  plan: PlannedOperation[],
  userWallet?: string,
): Promise<ExecutionResult> {
  const steps: StepResult[] = [];

  for (let i = 0; i < plan.length; i++) {
    const step = plan[i];
    const handler = HANDLERS[step.operation];

    if (!handler) {
      steps.push({
        operation: step.operation,
        success: false,
        error: `No handler for operation: ${step.operation}`,
      });
      continue;
    }

    try {
      // Inject user wallet if not set
      const params = { ...step.params };
      if (userWallet && !params.userWallet) {
        params.userWallet = userWallet;
      }

      const data = await handler(params);
      steps.push({
        operation: step.operation,
        success: true,
        data,
      });
    } catch (err) {
      steps.push({
        operation: step.operation,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const successful = steps.filter((s) => s.success).length;
  const failed = steps.filter((s) => !s.success).length;

  return {
    success: failed === 0,
    summary: `${successful} of ${steps.length} steps completed`,
    steps,
  };
}
