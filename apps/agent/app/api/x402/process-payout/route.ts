import type { Request } from 'express'; // unused
import { withX402Payment, handleOptions } from '@/lib/x402-middleware';
import { LUNA_PRICING } from '@luna/shared';
import { processPayoutSchema } from '@luna/shared';

export const POST = withX402Payment(
  'process_payout',
  LUNA_PRICING.process_payout,
  async (request: Request, context) => {
    const body = await request.json().catch(() => ({}));
    const parsed = processPayoutSchema.safeParse(body);
    if (!parsed.success) {
      return { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors };
    }
    return {
      success: true,
      operation: 'process_payout',
      eventId: parsed.data?.eventId,
      amount: parsed.data?.amount,
      recipient: parsed.data?.recipient,
      status: 'processed',
      transactionHash: `0x${Date.now().toString(16).padStart(64, '0')}`,
    };
  },
);

export const OPTIONS = handleOptions;
