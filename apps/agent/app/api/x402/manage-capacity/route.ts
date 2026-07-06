import { NextRequest } from 'next/server';
import { withX402Payment, handleOptions } from '@/lib/x402-middleware';
import { LUNA_PRICING } from '@luna/shared';
import { manageCapacitySchema } from '@luna/shared';

export const POST = withX402Payment(
  'manage_capacity',
  LUNA_PRICING.manage_capacity,
  async (request: NextRequest, context) => {
    const body = await request.json().catch(() => ({}));
    const parsed = manageCapacitySchema.safeParse(body);
    if (!parsed.success) {
      return { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors };
    }
    return {
      success: true,
      operation: 'manage_capacity',
      eventId: parsed.data?.eventId,
      capacity: parsed.data?.capacity,
      previousCapacity: 0,
      updated: true,
    };
  },
);

export const OPTIONS = handleOptions;
