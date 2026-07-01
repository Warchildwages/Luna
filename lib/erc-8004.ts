// 🏴 Pireph (June 30, 2026) — ERC-8004 Registration for Luna
//
// Registers Luna on Base's ERC-8004 Identity Registry so EVM-based agents
// can discover, verify, and pay Luna for ticket operations.
//
// ERC-8004 is the "Trustless Agents" standard — three registries:
//   - Identity Registry (ERC-721 with URI): agent identity NFTs
//   - Reputation Registry: trust scores from attestations
//   - Service Discovery: find agents by capability
//
// Casper handles payment settlement. ERC-8004 on Base handles agent discovery.
// Luna needs both: MCP on Casper + ERC-8004 on Base.
//
// Reference: eips.ethereum.org/EIPS/eip-8004
//
// Dependencies:
//   npm install viem @x402/core
//   (uses wagmi/viem for Base interactions)

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Base chain ID — Sepolia testnet for dev, mainnet for prod */
const BASE_CHAIN_ID = process.env.BASE_CHAIN_ID || '84532'; // Base Sepolia

/** ERC-8004 Identity Registry contract address on Base */
const ERC8004_IDENTITY_REGISTRY =
  process.env.ERC8004_IDENTITY_REGISTRY || '';

/** Luna's EVM wallet address on Base (different from Casper wallet) */
const LUNA_EVM_WALLET = process.env.LUNA_EVM_WALLET || '';

/** Private key for Luna's EVM wallet (for signing registry transactions) */
const LUNA_EVM_PRIVATE_KEY = process.env.LUNA_EVM_PRIVATE_KEY || '';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Erc8004Registration {
  /** Agent ID (ERC-721 token ID from registry) */
  agentId: string;
  /** Agent metadata URI (JSON with name, description, endpoints) */
  uri: string;
  /** Agent's EVM wallet address */
  agentAddress: string;
  /** Whether registration succeeded */
  registered: boolean;
  /** Transaction hash of registration */
  transactionHash?: string;
}

export interface Erc8004ServiceEndpoint {
  name: string;
  description: string;
  endpoint: string;
  priceUSDC: number;
  requiresPayment: boolean;
}

// ---------------------------------------------------------------------------
// Service manifest (linked from ERC-721 URI)
// ---------------------------------------------------------------------------

/**
 * Luna's ERC-8004 service manifest.
 * This JSON is hosted at the URI that the ERC-721 identity token points to.
 * Other agents query this to discover Luna's capabilities.
 */
export function lunaErc8004Manifest(): Record<string, unknown> {
  return {
    name: 'Luna — Your Personal Event Agent',
    description: 'Autonomous event ticketing agent powered by AllFans. Discover events, buy tickets, transfer, check in, and browse resale — all via x402 micropayments on Casper.',
    agentVersion: '0.1.0',
    agentWallet: LUNA_EVM_WALLET,
    payment: {
      protocol: 'x402',
      network: 'casper:casper-test',
      facilitator: 'https://x402-facilitator.cspr.cloud',
      settlementChain: 'casper-test',
    },
    capabilities: [
      {
        name: 'discover',
        description: 'Search and discover upcoming events',
        endpoint: '/api/x402/discover',
        price: 0,
        free: true,
      },
      {
        name: 'buy',
        description: 'Purchase event tickets via x402',
        endpoint: '/api/x402/buy',
        price: 0.01,
        free: false,
      },
      {
        name: 'transfer',
        description: 'Transfer tickets to another wallet',
        endpoint: '/api/x402/transfer',
        price: 0.01,
        free: false,
      },
      {
        name: 'check_in',
        description: 'Check into events with proof of attendance',
        endpoint: '/api/x402/check-in',
        price: 0.005,
        free: false,
      },
      {
        name: 'marketplace',
        description: 'Browse and purchase resale tickets',
        endpoint: '/api/x402/marketplace',
        price: 0.01,
        free: false,
      },
      {
        name: 'rsvp',
        description: 'RSVP to events',
        endpoint: '/api/x402/rsvp',
        price: 0,
        free: true,
      },
    ],
    swarm: {
      sigil: {
        name: 'Sigil — Legal Clarity Agent',
        description: 'Legal document analysis, witness, escrow, dispute resolution',
        endpoint: 'https://signet.ventures/api/x402',
        serviceId: 'sigil-v1',
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register Luna on Base's ERC-8004 Identity Registry.
 *
 * Flow:
 *   1. Call ERC-8004 registry's registerAgent() with Luna's metadata
 *   2. Registry mints an ERC-721 identity NFT for Luna
 *   3. Other agents query the registry to find Luna
 *
 * @returns Registration result with agent ID and transaction hash
 */
export async function registerLunaOnErc8004(): Promise<Erc8004Registration> {
  if (!ERC8004_IDENTITY_REGISTRY) {
    console.warn('[erc8004] ERC8004_IDENTITY_REGISTRY not set — skipping ERC-8004 registration');
    return {
      agentId: '',
      uri: '',
      agentAddress: LUNA_EVM_WALLET || '',
      registered: false,
    };
  }

  if (!LUNA_EVM_WALLET) {
    console.warn('[erc8004] LUNA_EVM_WALLET not set — skipping ERC-8004 registration');
    return {
      agentId: '',
      uri: '',
      agentAddress: '',
      registered: false,
    };
  }

  try {
    const manifest = lunaErc8004Manifest();
    const manifestJson = JSON.stringify(manifest);

    // Cline: implement actual ERC-8004 registration using viem/wagmi.
    //
    // Reference:
    //   eips.ethereum.org/EIPS/eip-8004
    //   github.com/sudeepb02/awesome-erc8004
    //
    // Flow:
    //   1. Prepare ERC-8004 IdentityRegistry contract call
    //   2. Call registerAgent(agentAddress, uri) with Luna's metadata
    //   3. Capture the returned agent ID (ERC-721 token ID)
    //   4. Optionally, also register service endpoints on the Discovery registry
    //
    // The manifest JSON should be hosted on IPFS or a public endpoint
    // and the CID used as the URI parameter.

    console.log('[erc8004] Registering Luna on Base ERC-8004...');
    console.log('[erc8004] Manifest:', manifestJson.slice(0, 200) + '...');
    console.log('[erc8004] Registry:', ERC8004_IDENTITY_REGISTRY);
    console.log('[erc8004] Agent wallet:', LUNA_EVM_WALLET);

    // ⚠️ Cline: Replace with actual viem contract call
    return {
      agentId: `luna-${Date.now().toString(36)}`,
      uri: `https://luna.agent/metadata/${Date.now()}`,
      agentAddress: LUNA_EVM_WALLET,
      registered: true,
      transactionHash: `0xmock-erc8004-${Date.now().toString(36)}`,
    };
  } catch (err) {
    console.error('[erc8004] Registration failed:', err instanceof Error ? err.message : String(err));
    return {
      agentId: '',
      uri: '',
      agentAddress: LUNA_EVM_WALLET,
      registered: false,
    };
  }
}
