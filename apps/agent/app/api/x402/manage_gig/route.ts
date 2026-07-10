import { withX402Payment, handleOptions } from '@/lib/x402-middleware';
import { LUNA_PRICING } from '@luna/shared';
import { manageGigSchema } from '@luna/shared';

export const POST = withX402Payment(
  'manage_gig',
  LUNA_PRICING.manage_gig,
  async (request: Request, context) => {
    const body = await request.json().catch(() => ({}));
    const parsed = manageGigSchema.safeParse(body);
    if (!parsed.success) {
      return { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors };
    }
    return {
      success: true,
      operation: 'manage_gig',
      gigId: `gig_${Date.now().toString(36)}`,
      eventId: parsed.data?.eventId,
      status: 'posted',
    };
  },
);

export const OPTIONS = handleOptions;
