/**
 * POST /api/x402/transfer
 *
 * Transfer a ticket via Casper x402.
 * Middleware handles payment verification, idempotency, and settlement.
 */
import { withX402Payment } from '@/lib/x402-middleware';
import { transferTicket } from '@/lib/allfans-api';
import { transferTicketSchema } from '@/lib/luna-types';

export const POST = withX402Payment('transfer', 0.01, async (request) => {
  const body = await request.json();
  const parsed = transferTicketSchema.safeParse(body);
  if (!parsed.success) {
    return { error: 'Validation failed', details: parsed.error.issues };
  }

  const result = await transferTicket(parsed.data);
  return { transactionHash: result.transactionHash };
});
