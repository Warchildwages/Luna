/**
 * GET /api/agent/status — Luna's real-time status
 *
 * Uses operation counters to report actual usage metrics.
 * Other agents query this to decide whether to use Luna.
 */
import { NextResponse } from 'next/server';
import { CASPER_NETWORK, CASPER_FACILITATOR_URL, LUNA_CASPER_WALLET } from '@/lib/x402-casper';
import { getAllMetrics, totalCalls, totalEarned } from '@/lib/counters';
import { LUNA_PRICING } from '@/lib/luna-types';
import type { LunaAgentStatus, LunaOperation } from '@/lib/luna-types';

const START_TIME = Date.now();
const CORS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=15' };

function getUptime(): string {
  const ms = Date.now() - START_TIME;
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export async function GET() {
  const metrics = getAllMetrics();

  const status: LunaAgentStatus = {
    wallet: {
      address: LUNA_CASPER_WALLET || 'not configured',
      chain: 'casper-test',
      balanceUSDC: '0.00',
    },
    casper: {
      network: CASPER_NETWORK,
      facilitatorUrl: CASPER_FACILITATOR_URL,
      attestationsCount: 0,
    },
    uptime: getUptime(),
    version: '0.1.0',
    operations: (Object.keys(LUNA_PRICING) as LunaOperation[]).map((op) => {
      const m = metrics.find((_, i) => i === 0) || { totalCalls: 0, successfulCalls: 0, failedCalls: 0, lastCalledAt: null };
      const idx = ['buy', 'transfer', 'check_in', 'marketplace', 'discover', 'rsvp'].indexOf(op);
      const metric = metrics[idx] || { totalCalls: 0, successfulCalls: 0, failedCalls: 0, lastCalledAt: null, totalPaid: 0, lastError: null };
      return {
        name: op,
        price: LUNA_PRICING[op],
        totalCalls: metric.totalCalls,
        successfulCalls: metric.successfulCalls,
        failedCalls: metric.failedCalls,
        lastCalledAt: metric.lastCalledAt,
        usdcEarned: metric.totalPaid,
      };
    }),
    summary: {
      totalCalls: totalCalls(),
      totalEarnedUSDC: totalEarned(),
      uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
    },
  };

  return NextResponse.json(status, { headers: CORS });
}
