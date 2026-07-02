/**
 * POST /api/x402/rsvp
 *
 * RSVP to an event. Free operation — no x402 payment required.
 */
import { NextResponse } from 'next/server';
import { rsvpEvent } from '@/lib/allfans-api';

export async function POST(request: Request) {
  let body: { eventId?: string; userWallet?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.eventId) {
    return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
  }

  try {
    const result = await rsvpEvent(body.eventId, body.userWallet || '');
    return NextResponse.json({ success: result.success });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'RSVP failed', details: message }, { status: 500 });
  }
}
