import { z } from 'zod';

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

// ── Creator & Venue Operations ──────────────────────────────────────────

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  venue: z.string().min(1, 'Venue is required'),
  city: z.string().min(1, 'City is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number().positive().optional(),
  capacity: z.number().int().positive().optional(),
  image: z.string().url().optional(),
});

export const manageGigSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  gigType: z.enum(['comedian', 'photographer', 'videographer', 'reviewer', 'vendor', 'other']).optional(),
  description: z.string().min(1, 'Description is required'),
  fee: z.number().positive().optional(),
});

export const manageCapacitySchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  capacity: z.number().int().positive('Capacity must be positive'),
  sectionAllocations: z.record(z.number()).optional(),
});

export const setPricingSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  tiers: z.array(z.object({
    name: z.string().min(1),
    price: z.number().positive(),
    quantity: z.number().int().positive().optional(),
  })).min(1, 'At least one tier required'),
});

export const venueAnalyticsSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  period: z.enum(['day', 'week', 'month', 'all']).optional(),
});

export const processPayoutSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  amount: z.number().positive('Amount must be positive'),
  recipient: z.string().min(1, 'Recipient is required'),
});

// ── Experience Operations ───────────────────────────────────────────────

export const lookupContactSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  fromEvent: z.string().optional(),
});

export const preVerifySchema = z.object({
  attendeeId: z.string().min(1, 'Attendee ID is required'),
  eventId: z.string().min(1, 'Event ID is required'),
  verificationType: z.enum(['age', 'vip', 'drink_pass', 'media', 'other']),
});

export const buyMerchSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  itemId: z.string().min(1, 'Item ID is required'),
  quantity: z.number().int().min(1).max(10, 'Max 10 per purchase'),
  size: z.string().optional(),
});

// ── Secondary Market Operations ─────────────────────────────────────────

export const listForSaleSchema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required'),
  price: z.number().positive('Price must be positive'),
});

export const cancelListingSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
});
