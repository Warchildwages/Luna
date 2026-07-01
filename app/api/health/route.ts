/**
 * GET /api/health
 *
 * Simple health check for Render/uptime monitoring.
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'luna',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
}
