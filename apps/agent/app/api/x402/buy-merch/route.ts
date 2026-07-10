import { withX402Payment, handleOptions } from '@/lib/x402-middleware';
import { LUNA_PRICING } from '@luna/shared';
import { buyMerchSchema } from '@luna/shared';

export const POST = withX402Payment(
  'buy_merch',
  LUNA_PRICING.buy_merch,
  async (request: Request, context) => {
    const body = await request.json().catch(() => ({}));
    const parsed = buyMerchSchema.safeParse(body);
    if (!parsed.success) {
      return { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors };
    }
    return {
      success: true,
      operation: 'buy_merch',
      orderId: `ord_${Date.now().toString(36)}`,
      itemId: parsed.data?.itemId,
      quantity: parsed.data?.quantity,
      status: 'confirmed',
    };
  },
);

export const OPTIONS = handleOptions;
