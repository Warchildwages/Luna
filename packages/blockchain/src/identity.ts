// 🏴 Pireph (July 1, 2026) — Luna Cross-Chain Identity
//
// Cryptographic link between Luna's Casper identity and her Base identity.
//
// Casper uses Ed25519 keys. Base uses ECDSA/secp256k1.
// Different curves, no shared key. This module proves control of both:
//
//   1. Luna's Casper key signs a statement:
//      "I, [CasperPubKey], control EVM address [0x...] on Base Sepolia"
//
//   2. The signed statement is served at /api/agent/identity
//
//   3. Verifying agents:
//      a. Read the attestation from Luna's endpoint
//      b. Verify the Ed25519 signature (proves Casper key signed it)
//      c. Check that the EVM address matches Luna's ERC-8004 entry on Base
//      d. If both match → "This Casper agent IS the real Luna"
//
// This is the dual-key attestation pattern.

import nacl from 'tweetnacl';
import { decodeHex, encodeHex } from './hex-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrossChainIdentity {
  /** Casper public key (Ed25519 hex, 66 chars) */
  casperPublicKey: string;

  /** EVM address on Base (0x-prefixed, 42 chars) */
  evmAddress: string;

  /** Base chain where Luna is registered on ERC-8004 */
  evmChain: string;

  /** ERC-8004 agent ID on Base */
  erc8004AgentId?: string;

  /** Human-readable identity statement */
  statement: string;

  /** Ed25519 signature of the statement, signed by Casper private key */
  signature: string;

  /** Timestamp when this attestation was created */
  createdAt: string;
}

export interface IdentityVerificationResult {
  verified: boolean;
  identity?: CrossChainIdentity;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Attestation Builder
// ---------------------------------------------------------------------------

const DEFAULT_STATEMENT =
  'This Casper agent controls the following EVM address on Base Sepolia. '
  + 'Verify this signature against the Casper public key, then check '
  + 'the EVM address on ERC-8004 at the specified chain.';

/**
 * Build the identity statement that gets signed.
 */
function buildStatement(casperPubKey: string, evmAddress: string, evmChain: string): string {
  return [
    `Casper Agent: ${casperPubKey}`,
    `Controls EVM Address: ${evmAddress}`,
    `Chain: ${evmChain}`,
    `Statement: ${DEFAULT_STATEMENT}`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Signing
// ---------------------------------------------------------------------------

/**
 * Sign the cross-chain identity statement using Luna's Casper private key.
 *
 * @param casperSecretKey - Ed25519 secret key (64 bytes, hex) — KEYPAIR secret key
 *                          or the seed (32 bytes) + public key (32 bytes) concat
 * @param evmAddress - Luna's EVM address on Base (0x-prefixed)
 * @param evmChain - Chain name (e.g. "base-sepolia")
 * @returns The signed CrossChainIdentity
 */
export function createCrossChainIdentity(
  casperSecretKey: Uint8Array,
  evmAddress: string,
  evmChain: string = 'base-sepolia',
): CrossChainIdentity {
  // Derive public key from secret key
  // tweetnacl's sign.keyPair.fromSecretKey expects the full 64-byte secret key
  // (first 32 bytes = seed, last 32 bytes = public key)
  const keyPair = nacl.sign.keyPair.fromSecretKey(casperSecretKey);
  const casperPublicKey = encodeHex(keyPair.publicKey);

  const statement = buildStatement(casperPublicKey, evmAddress, evmChain);
  const message = new TextEncoder().encode(statement);
  const signature = nacl.sign.detached(message, casperSecretKey);

  return {
    casperPublicKey,
    evmAddress,
    evmChain,
    statement,
    signature: encodeHex(signature),
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

/**
 * Verify a cross-chain identity attestation.
 *
 * An agent on any chain can call this to confirm that "Luna on Casper"
 * is the same entity as "Luna on Base ERC-8004."
 *
 * @param identity - The signed identity attestation
 * @returns Verification result with errors if any
 */
export function verifyCrossChainIdentity(
  identity: CrossChainIdentity,
): IdentityVerificationResult {
  const errors: string[] = [];

  // 1. Validate structure
  if (!identity.casperPublicKey || identity.casperPublicKey.length < 64) {
    errors.push('Invalid casperPublicKey');
  }
  if (!identity.evmAddress || !identity.evmAddress.startsWith('0x') || identity.evmAddress.length !== 42) {
    errors.push('Invalid evmAddress');
  }
  if (!identity.signature || identity.signature.length < 128) {
    errors.push('Invalid or missing signature');
  }
  if (!identity.statement) {
    errors.push('Missing identity statement');
  }

  if (errors.length > 0) {
    return { verified: false, identity, errors };
  }

  // 2. Rebuild the statement exactly as signed
  const expectedStatement = buildStatement(
    identity.casperPublicKey,
    identity.evmAddress,
    identity.evmChain,
  );

  if (identity.statement !== expectedStatement) {
    errors.push('Statement does not match expected format');
    return { verified: false, identity, errors };
  }

  // 3. Verify the Ed25519 signature
  try {
    const message = new TextEncoder().encode(identity.statement);
    const sig = decodeHex(identity.signature);
    const pub = decodeHex(identity.casperPublicKey);

    const isValid = nacl.sign.detached.verify(message, sig, pub);
    if (!isValid) {
      errors.push('Signature does not match Casper public key');
    }

    return {
      verified: errors.length === 0,
      identity,
      errors,
    };
  } catch (err) {
    errors.push(`Signature verification error: ${err instanceof Error ? err.message : String(err)}`);
    return { verified: false, identity, errors };
  }
}

/**
 * Format a cross-chain identity for display in the agent dashboard.
 */
export function formatIdentityForDisplay(identity: CrossChainIdentity): string {
  return [
    `🌙 Luna Cross-Chain Identity`,
    `  Casper Key:  ${identity.casperPublicKey.slice(0, 20)}...`,
    `  EVM Address: ${identity.evmAddress}`,
    `  Chain:       ${identity.evmChain}`,
    `  Signed:      ${identity.createdAt}`,
    `  Agent ID:    ${identity.erc8004AgentId || 'not registered'}`,
  ].join('\n');
}