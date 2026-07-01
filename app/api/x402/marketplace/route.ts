/**
 * GET /api/x402/marketplace
 *
 * Browse resale tickets via Casper x402.
 * Middleware handles payment verification, idempotency, and settlement.
 */
import { withX402Payment } from '@/lib/x402-middleware';
import { marketplaceList } from '@/lib/allfans-api';
import type { MarketplaceRequest } from '@/lib/luna-types';

export const GET = withX402Payment('marketplace', 0.01, async (request) => {
  const url = new URL(request.url);
  const params: MarketplaceRequest = {
    eventId: url.searchParams.get('eventId') || undefined,
    maxPrice: url.searchParams.get('maxPrice')
      ? Number(url.searchParams.get('maxPrice'))
      : undefined,
  };

  const listings = await marketplaceList(params);
  return { listings };
});
