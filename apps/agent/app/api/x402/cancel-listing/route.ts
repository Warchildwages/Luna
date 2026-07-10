import { NextResponse } from "next/server"; // unused
import { cancelListingSchema } from '@luna/shared';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = cancelListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  return NextResponse.json({
    success: true,
    operation: 'cancel_listing',
    listingId: parsed.data?.listingId,
    status: 'cancelled',
    refunded: true,
  });
}
