/**
 * POST /api/x402/buy
 *
 * Buy event tickets via Casper x402.
 * Middleware handles payment verification, idempotency, and settlement.
 */
import { withX402Payment } from '@/lib/x402-middleware';
import { buyTickets } from '@/lib/allfans-api';
import { buyTicketSchema } from '@/lib/luna-types';

export const POST = withX402Payment('buy', 0.01, async (request) => {
  const body = await request.json();
  const parsed = buyTicketSchema.safeParse(body);
  if (!parsed.success) {
    return { error: 'Validation failed', details: parsed.error.issues };
  }

  const userWallet = request.headers.get('X-User-Wallet') || '';
  const result = await buyTickets(parsed.data, userWallet);

  return {
    tickets: result.tickets,
    platform_tx: result.payment.transactionHash,
  };
});
