import type { Request } from 'express'; // unused
import { withX402Payment, handleOptions } from '@/lib/x402-middleware';
import { LUNA_PRICING } from '@luna/shared';
import { setPricingSchema } from '@luna/shared';

export const POST = withX402Payment(
  'set_pricing',
  LUNA_PRICING.set_pricing,
  async (request: Request, context) => {
    const body = await request.json().catch(() => ({}));
    const parsed = setPricingSchema.safeParse(body);
    if (!parsed.success) {
      return { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors };
    }
    return {
      success: true,
      operation: 'set_pricing',
      eventId: parsed.data?.eventId,
      tiers: parsed.data?.tiers?.length || 0,
      updated: true,
    };
  },
);

export const OPTIONS = handleOptions;
