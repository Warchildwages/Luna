/**
 * POST /api/x402/discover
 *
 * Discover events. Free operation — no x402 payment required.
 * Proxies to AllFans /api/events with query filters.
 */
import { NextResponse } from 'next/server';
import { discoverEvents } from '@/lib/allfans-api';
import { discoverSchema } from '@luna/shared';
import type { DiscoverRequest } from '@luna/shared';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params: DiscoverRequest = {
    query: url.searchParams.get('q') || undefined,
    dateFrom: url.searchParams.get('dateFrom') || undefined,
    dateTo: url.searchParams.get('dateTo') || undefined,
    city: url.searchParams.get('city') || undefined,
    maxPrice: url.searchParams.get('maxPrice') ? Number(url.searchParams.get('maxPrice')) : undefined,
    category: url.searchParams.get('category') || undefined,
  };

  try {
    const events = await discoverEvents(params);
    return NextResponse.json({ success: true, events });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Discovery failed', details: message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = discoverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const events = await discoverEvents(parsed.data);
    return NextResponse.json({ success: true, events });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Discovery failed', details: message },
      { status: 500 },
    );
  }
}
