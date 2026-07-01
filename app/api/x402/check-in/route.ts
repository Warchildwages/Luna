/**
 * POST /api/x402/check-in
 *
 * Check into an event via Casper x402.
 * Middleware handles payment verification, idempotency, and settlement.
 */
import { withX402Payment } from '@/lib/x402-middleware';
import { checkIn } from '@/lib/allfans-api';
import { checkInSchema } from '@/lib/luna-types';

export const POST = withX402Payment('check_in', 0.005, async (request) => {
  const body = await request.json();
  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return { error: 'Validation failed', details: parsed.error.issues };
  }

  await checkIn(parsed.data);
  return { message: `Checked in to event ${parsed.data.eventId}` };
});
