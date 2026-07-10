import type { Request } from 'express'; // unused
import { withX402Payment, handleOptions } from '@/lib/x402-middleware';
import { LUNA_PRICING } from '@luna/shared';
import { preVerifySchema } from '@luna/shared';

export const POST = withX402Payment(
  'pre_verify',
  LUNA_PRICING.pre_verify,
  async (request: Request, context) => {
    const body = await request.json().catch(() => ({}));
    const parsed = preVerifySchema.safeParse(body);
    if (!parsed.success) {
      return { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors };
    }
    return {
      success: true,
      operation: 'pre_verify',
      attendeeId: parsed.data?.attendeeId,
      eventId: parsed.data?.eventId,
      verified: true,
      verificationType: parsed.data?.verificationType,
    };
  },
);

export const OPTIONS = handleOptions;
