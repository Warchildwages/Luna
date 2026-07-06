import { NextRequest } from 'next/server';
import { withX402Payment, handleOptions } from '@/lib/x402-middleware';
import { LUNA_PRICING } from '@luna/shared';
import { createEventSchema } from '@luna/shared';

export const POST = withX402Payment(
  'create_event',
  LUNA_PRICING.create_event,
  async (request: NextRequest, context) => {
    const body = await request.json().catch(() => ({}));
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors };
    }
    return {
      success: true,
      operation: 'create_event',
      eventId: `evt_${Date.now().toString(36)}`,
      title: parsed.data?.title || 'Untitled Event',
      date: parsed.data?.date,
      venue: parsed.data?.venue,
      status: 'created',
    };
  },
);

export const OPTIONS = handleOptions;
