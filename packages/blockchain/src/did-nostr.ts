// 🌙 did:nostr Identity for Luna
//
// Serves Luna's W3C Decentralized Identifier document at
// /.well-known/did/nostr/<pubkey>.json
//
// Other agents (Sigil, etc.) resolve this to discover:
//   - Luna's Casper Ed25519 public key (verification)
//   - Luna's x402 service endpoints
//   - Cross-chain identity (Casper key → Base EVM address)
//   - Linked agents (alsoKnownAs)
//
// Early adopter of did:nostr spec v0.1.0 (W3C Nostr CG, Jun 30 2026)
// https://github.com/nostrcg/did-nostr

import { LUNA_CASPER_WALLET, CASPER_NETWORK } from './x402-casper';
import { LUNA_PRICING } from './luna-types';
import type { LunaOperation } from './luna-types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Luna's EVM address on Base (for cross-reference in DID doc) */
const LUNA_EVM_WALLET = process.env.LUNA_EVM_WALLET || '';

/** Base URL where Luna's HTTP endpoints are served */
const LUNA_BASE_URL = process.env.LUNA_BASE_URL || 'http://localhost:3002';

/** Sigil's did:nostr identifier (set after on-chain discovery) */
const SIGIL_DID_NOSTR = process.env.SIGIL_DID_NOSTR || '';

// ---------------------------------------------------------------------------
// DID Document Builder
// ---------------------------------------------------------------------------

export interface DidNostrDocument {
  '@context': string[];
  id: string;
  type: string;
  alsoKnownAs?: string[];
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase?: string;
    blockchainAccountId?: string;
  }>;
  authentication: string[];
  assertionMethod: string[];
  service?: Array<{
    id: string;
    type: string;
    serviceEndpoint: string | string[];
    description?: string;
  }>;
  profile?: Record<string, unknown>;
  follows?: string[];
  modified: string;
}

/**
 * Build Luna's did:nostr identity document.
 *
 * @param casperPublicKey - Luna's Casper Ed25519 public key (66-char hex)
 * @returns DID document conforming to did:nostr spec
 */
export function buildLunaDidDocument(casperPublicKey: string): DidNostrDocument {
  const did = `did:nostr:${casperPublicKey.toLowerCase()}`;
  const now = new Date().toISOString();

  const doc: DidNostrDocument = {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/nostr/context',
    ],
    id: did,
    type: 'DIDNostr',
    alsoKnownAs: [],
    verificationMethod: [
      {
        id: `${did}#key1`,
        // Casper uses Ed25519 — encode as W3C Ed25519VerificationKey2020
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: encodeEd25519Multibase(casperPublicKey),
        // Also reference the on-chain account for cross-chain lookup
        blockchainAccountId: `casper:${LUNA_CASPER_WALLET}`,
      },
    ],
    authentication: ['#key1'],
    assertionMethod: ['#key1'],
    service: [
      {
        id: `${did}#x402-discovery`,
        type: 'x402Service',
        serviceEndpoint: `${LUNA_BASE_URL}/api/x402/service-info`,
        description: 'Luna x402 service discovery — list all operations and pricing',
      },
      {
        id: `${did}#agent-status`,
        type: 'AgentStatus',
        serviceEndpoint: `${LUNA_BASE_URL}/api/agent/status`,
        description: 'Luna real-time agent status — wallet, metrics, uptime',
      },
      {
        id: `${did}#cross-chain-identity`,
        type: 'CrossChainIdentity',
        serviceEndpoint: `${LUNA_BASE_URL}/api/agent/identity`,
        description: 'Luna cross-chain identity — Casper Ed25519 → Base EVM',
      },
    ],
    profile: {
      name: 'Luna',
      about: 'Your personal event agent. Powered by AllFans. Settled on Casper.',
      picture: `${LUNA_BASE_URL}/luna-icon.png`,
      agentVersion: '0.1.0',
      network: CASPER_NETWORK,
      evmAddress: LUNA_EVM_WALLET,
      operations: Object.entries(LUNA_PRICING).map(([op, price]) => ({
        name: op,
        priceUSDC: price,
      })),
    },
    follows: [],
    modified: now,
  };

  // Link to Sigil if configured
  if (SIGIL_DID_NOSTR) {
    doc.alsoKnownAs!.push(SIGIL_DID_NOSTR);
    doc.follows!.push(SIGIL_DID_NOSTR);
  }

  // Link to EVM address if configured
  if (LUNA_EVM_WALLET) {
    doc.alsoKnownAs!.push(`eip155:84532:${LUNA_EVM_WALLET}`);
  }

  return doc;
}

/**
 * Build a minimal offline-resolvable DID document from a pubkey alone.
 * Satisfies the did:nostr spec's "offline resolution" requirement.
 */
export function buildMinimalDidDocument(pubkey: string): DidNostrDocument {
  const did = `did:nostr:${pubkey.toLowerCase()}`;
  return {
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/nostr/context'],
    id: did,
    type: 'DIDNostr',
    verificationMethod: [
      {
        id: `${did}#key1`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: encodeEd25519Multibase(pubkey),
      },
    ],
    authentication: ['#key1'],
    assertionMethod: ['#key1'],
    modified: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Multibase encoding for Ed25519 keys
// ---------------------------------------------------------------------------

/**
 * Encode an Ed25519 public key as multibase (base58-btc) for
 * Ed25519VerificationKey2020 compatibility.
 *
 * Codec: 0xed (Ed25519) = 0x01, 0x00 in multicodec varint
 * Prefix: z (base58-btc multibase header)
 *
 * NOTE: This is the standard W3C CCG encoding. The did:nostr spec
 * primarily targets secp256k1 (Multikey), but Ed25519 is a valid
 * verification method type in the W3C DID Core spec.
 */
function encodeEd25519Multibase(hexPubkey: string): string {
  const cleaned = hexPubkey.replace(/^0x/i, '');
  // Ed25519 multicodec prefix: 0xed → 0x01, 0x00 (varint)
  const codecPrefix = new Uint8Array([0xed, 0x01]);
  const keyBytes = decodeSimpleHex(cleaned);
  const combined = new Uint8Array(codecPrefix.length + keyBytes.length);
  combined.set(codecPrefix);
  combined.set(keyBytes, codecPrefix.length);
  // Base58-btc encode (for display) — for minimal encoding we use
  // base16-lower (f prefix) which is simpler
  return `f${bytesToHex(combined)}`;
}

function decodeSimpleHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// Agent-to-Agent Discovery
// ---------------------------------------------------------------------------

/**
 * Generate the service-info section for Luna's ERC-8004 manifest
 * that points to her did:nostr identifier.
 */
export function didNostrServiceEntry(): Record<string, unknown> {
  return {
    didProtocol: 'did:nostr',
    didSpecVersion: '0.1.0',
    didResolverEndpoint: `/.well-known/did/nostr/{pubkey}.json`,
    resolverType: 'HTTP',
    alsoKnownAs: SIGIL_DID_NOSTR ? [`sigil: ${SIGIL_DID_NOSTR}`] : [],
  };
}
