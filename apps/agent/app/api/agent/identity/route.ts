/**
 * GET /api/agent/identity
 *
 * Luna's cross-chain identity attestation.
 *
 * This endpoint serves the dual-key attestation linking Luna's
 * Casper identity to her Base ERC-8004 identity.
 *
 * A verifying agent:
 *   1. Fetches this endpoint
 *   2. Verifies the Ed25519 signature against Luna's Casper public key
 *   3. Checks the EVM address on Base ERC-8004
 *   4. If both match → "This is the real Luna"
 */
import { NextResponse } from 'next/server';

export async function GET() {
  // In production, this is built at startup from env vars:
  //   LUNA_CASPER_KEYPAIR (or seed) + LUNA_EVM_WALLET
  //
  // For the buildathon, we serve the attestation template.
  // The actual signed attestation is generated at startup
  // when LUNA_CASPER_PRIVATE_KEY and LUNA_EVM_WALLET are set.
  //
  // See: lib/cross-chain-identity.ts for the signing logic

  const identity = {
    service: 'luna-v1',
    name: 'Luna — Your Personal Event Agent',
    casperPublicKey: process.env.LUNA_CASPER_PUBLIC_KEY || 'not-configured',
    evmAddress: process.env.LUNA_EVM_WALLET || 'not-configured',
    evmChain: 'base-sepolia',
    statement:
      'This Casper agent controls the following EVM address on Base Sepolia. '
      + 'Verify this signature against the Casper public key, then check '
      + 'the EVM address on ERC-8004 at the specified chain.',
    signature: process.env.LUNA_CROSS_CHAIN_SIGNATURE || 'not-signed',
    createdAt: process.env.LUNA_IDENTITY_CREATED_AT || new Date().toISOString(),
    verification: {
      verifyOnCasper: 'Verify Ed25519 signature via tweetnacl',
      verifyOnBase: `Check ERC-8004 at ${process.env.ERC8004_IDENTITY_REGISTRY || 'not-registered'} on base-sepolia`,
      verifyAt: '/api/agent/identity/verify',
    },
    _meta: {
      agent: 'luna',
      version: '0.1.0',
      docs: 'https://github.com/Warchildwages/Luna',
    },
  };

  return NextResponse.json(identity, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    },
  });
}