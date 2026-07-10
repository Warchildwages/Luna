import type { Request } from 'express'; // unused
import { withX402Payment, handleOptions } from '@/lib/x402-middleware';
import { LUNA_PRICING } from '@luna/shared';
import { venueAnalyticsSchema } from '@luna/shared';

export const POST = withX402Payment(
  'venue_analytics',
  LUNA_PRICING.venue_analytics,
  async (request: Request, context) => {
    const body = await request.json().catch(() => ({}));
    const parsed = venueAnalyticsSchema.safeParse(body);
    if (!parsed.success) {
      return { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors };
    }
    return {
      success: true,
      operation: 'venue_analytics',
      eventId: parsed.data?.eventId,
      period: parsed.data?.period || 'all',
      ticketsSold: 145,
      totalRevenue: 3625,
      attendance: 82,
      averageRating: 4.7,
    };
  },
);

export const OPTIONS = handleOptions;
