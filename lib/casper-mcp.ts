// 🏴 Pireph (June 30, 2026) — Luna Casper MCP Registration
//
// Registers Luna on the Casper MCP ecosystem so other agents can discover
// and pay for ticket operations via x402.

import { CASPER_NETWORK, LUNA_CASPER_WALLET } from './x402-casper';
import { LUNA_PRICING, LUNA_OPERATION_DESCRIPTIONS, LUNA_OPERATION_NAMES } from './luna-types';
import type { LunaOperation } from './luna-types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CASPER_MCP_SERVER_URL = process.env.CASPER_MCP_SERVER_URL || '';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LunaMcpRegistration {
  serviceId: string;
  name: string;
  description: string;
  network: string;
  walletAddress: string;
  endpoints: LunaMcpEndpoint[];
  categories: string[];
}

export interface LunaMcpEndpoint {
  path: string;
  method: 'GET' | 'POST';
  description: string;
  priceUSDC: number;
  requiresPayment: boolean;
  operation: LunaOperation;
}

// ---------------------------------------------------------------------------
// Service Definition
// ---------------------------------------------------------------------------

export function lunaServiceRegistration(): LunaMcpRegistration {
  return {
    serviceId: 'luna-v1',
    name: 'Luna — Your Personal Event Agent',
    description:
      'Autonomous event ticketing agent powered by AllFans. ' +
      'Discover events, buy tickets, transfer, check in, and browse resale — ' +
      'all via x402 micropayments on Casper. Your personal secretary for the night out.',
    network: CASPER_NETWORK,
    walletAddress: LUNA_CASPER_WALLET,
    categories: ['events', 'ticketing', 'entertainment', 'ai-agent'],
    endpoints: [
      {
        path: '/api/x402/discover',
        method: 'GET',
        description: LUNA_OPERATION_DESCRIPTIONS.discover,
        priceUSDC: LUNA_PRICING.discover,
        requiresPayment: false,
        operation: 'discover',
      },
      {
        path: '/api/x402/buy',
        method: 'POST',
        description: LUNA_OPERATION_DESCRIPTIONS.buy,
        priceUSDC: LUNA_PRICING.buy,
        requiresPayment: true,
        operation: 'buy',
      },
      {
        path: '/api/x402/transfer',
        method: 'POST',
        description: LUNA_OPERATION_DESCRIPTIONS.transfer,
        priceUSDC: LUNA_PRICING.transfer,
        requiresPayment: true,
        operation: 'transfer',
      },
      {
        path: '/api/x402/check-in',
        method: 'POST',
        description: LUNA_OPERATION_DESCRIPTIONS.check_in,
        priceUSDC: LUNA_PRICING.check_in,
        requiresPayment: true,
        operation: 'check_in',
      },
      {
        path: '/api/x402/rsvp',
        method: 'POST',
        description: LUNA_OPERATION_DESCRIPTIONS.rsvp,
        priceUSDC: LUNA_PRICING.rsvp,
        requiresPayment: false,
        operation: 'rsvp',
      },
      {
        path: '/api/x402/marketplace',
        method: 'GET',
        description: LUNA_OPERATION_DESCRIPTIONS.marketplace,
        priceUSDC: LUNA_PRICING.marketplace,
        requiresPayment: true,
        operation: 'marketplace',
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register Luna on the Casper MCP ecosystem.
 * Call during startup. Non-fatal if MCP registry is unreachable.
 */
export async function registerLunaOnCasperMCP(): Promise<boolean> {
  if (!CASPER_MCP_SERVER_URL) {
    console.log(
      '[luna-mcp] CASPER_MCP_SERVER_URL not set — skipping MCP registration. ' +
      'Set this to make Luna discoverable by other agents on Casper.',
    );
    return false;
  }

  try {
    const registration = lunaServiceRegistration();
    console.log(`[luna-mcp] Registering Luna (${registration.serviceId}) with ${registration.endpoints.length} endpoints...`);

    // Cline: implement actual registration call to Casper MCP registry.
    // Pattern from AgentPay's Registry contract or manual CSPR.cloud dashboard.

    return true;
  } catch (err) {
    console.error('[luna-mcp] Registration failed:', err instanceof Error ? err.message : String(err));
    return false;
  }
}
