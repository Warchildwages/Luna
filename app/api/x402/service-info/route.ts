/**
 * GET /api/x402/service-info
 *
 * Public service discovery metadata for Casper MCP ecosystem.
 * Other agents query this to find Luna's capabilities and pricing.
 */
import { NextResponse } from 'next/server';
import { CASPER_NETWORK, CASPER_FACILITATOR_URL, LUNA_CASPER_WALLET } from '@/lib/x402-casper';
import { LUNA_PRICING, LUNA_OPERATION_NAMES, LUNA_OPERATION_DESCRIPTIONS } from '@/lib/luna-types';
import type { LunaOperation } from '@/lib/luna-types';

export async function GET() {
  const operations: Record<string, { price: number; name: string; description: string }> = {};

  for (const op of Object.keys(LUNA_PRICING) as LunaOperation[]) {
    operations[op] = {
      price: LUNA_PRICING[op],
      name: LUNA_OPERATION_NAMES[op],
      description: LUNA_OPERATION_DESCRIPTIONS[op],
    };
  }

  return NextResponse.json({
    serviceId: 'luna-v1',
    name: 'Luna — Your Personal Event Agent',
    description: 'Autonomous event ticketing agent powered by AllFans. Discover events, buy tickets, transfer, check in, and browse resale — all via x402 micropayments on Casper.',
    docsUrl: 'https://github.com/Warchildwages/Luna',
    endpoint: '/api/x402',
    network: CASPER_NETWORK,
    facilitatorUrl: CASPER_FACILITATOR_URL,
    walletAddress: LUNA_CASPER_WALLET,
    operations,
  });
}
