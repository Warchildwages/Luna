import { NextRequest } from 'next/server';
import { withX402Payment, handleOptions } from '@/lib/x402-middleware';
import { LUNA_PRICING } from '@luna/shared';
import { listForSaleSchema } from '@luna/shared';

export const POST = withX402Payment(
  'list_for_sale',
  LUNA_PRICING.list_for_sale,
  async (request: NextRequest, context) => {
    const body = await request.json().catch(() => ({}));
    const parsed = listForSaleSchema.safeParse(body);
    if (!parsed.success) {
      return { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors };
    }
    return {
      success: true,
      operation: 'list_for_sale',
      listingId: `lst_${Date.now().toString(36)}`,
      ticketId: parsed.data?.ticketId,
      price: parsed.data?.price,
      status: 'listed',
    };
  },
);

export const OPTIONS = handleOptions;
