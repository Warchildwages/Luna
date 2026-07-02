/**
 * GET /api/health
 *
 * Health check with dependency probes.
 * Reports status of AllFans API and CSPR.cloud facilitator.
 */

import { NextResponse } from 'next/server';
import { isMockMode } from '@luna/blockchain';

const ALLFANS_API_URL = process.env.ALLFANS_API_URL || 'http://localhost:3000';
const CSPR_CLOUD_URL = process.env.CSPR_CLOUD_FACILITATOR || 'https://x402-facilitator.cspr.cloud';

export async function GET() {
  const checks: Record<string, { status: string; error?: string }> = {};

  // Self check
  checks.self = { status: 'ok' };

  // AllFans API check
  if (!isMockMode()) {
    try {
      const res = await fetch(`${ALLFANS_API_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
      checks.allfans = { status: res.ok ? 'ok' : `error (${res.status})` };
    } catch (err) {
      checks.allfans = { status: 'unreachable', error: err instanceof Error ? err.message : 'unknown' };
    }
  } else {
    checks.allfans = { status: 'mock' };
  }

  // CSPR.cloud facilitator check
  try {
    const res = await fetch(`${CSPR_CLOUD_URL}/health`, { signal: AbortSignal.timeout(5000) });
    checks.cspr_cloud = { status: res.ok ? 'ok' : `error (${res.status})` };
  } catch (err) {
    checks.cspr_cloud = { status: 'unreachable', error: err instanceof Error ? err.message : 'unknown' };
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok' || c.status === 'mock');

  return NextResponse.json({
    status: allOk ? 'ok' : 'degraded',
    service: 'luna',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    checks,
    dependencies: {
      allfans: ALLFANS_API_URL,
      cspr_cloud: CSPR_CLOUD_URL,
    },
  }, {
    status: allOk ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
