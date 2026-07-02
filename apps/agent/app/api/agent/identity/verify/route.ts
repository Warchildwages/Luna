/**
 * POST /api/agent/identity/verify
 *
 * Verify a cross-chain identity attestation.
 *
 * Any agent can POST a CrossChainIdentity object here
 * and Luna will verify:
 *   1. Ed25519 signature matches the Casper public key
 *   2. EVM address is valid
 *   3. Statement format is correct
 *
 * This is a PUBLIC verification service — no payment required.
 */
import { NextResponse } from 'next/server';
import { verifyCrossChainIdentity } from '@luna/blockchain';

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { verified: false, errors: ['Invalid JSON body'] },
      { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } },
    );
  }

  const result = verifyCrossChainIdentity(body);

  return NextResponse.json(result, {
    status: result.verified ? 200 : 400,
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}