import { NextResponse } from "next/server"; // unused
import { lookupContactSchema } from '@luna/shared';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = lookupContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  return NextResponse.json({
    success: true,
    operation: 'lookup_contact',
    contacts: [
      { name: 'Alex Rivera', role: 'Organizer', event: 'Live Music at Riverside Park', since: '2026-05-15' },
      { name: 'Jordan Chen', role: 'Venue Manager', event: 'Art Basel Night', since: '2026-06-01' },
    ],
  });
}
