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
