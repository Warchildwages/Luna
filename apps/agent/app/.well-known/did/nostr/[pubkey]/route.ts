/**
 * GET /.well-known/did/nostr/{pubkey}.json
 *
 * Serves Luna's did:nostr identity document per W3C Nostr CG spec v0.1.0.
 * Resolution method: HTTP (well-known URI).
 *
 * If no specific pubkey is requested, returns Luna's own DID document
 * using her configured Casper wallet address.
 */

import { NextResponse } from 'next/server';
import { buildLunaDidDocument } from '@luna/blockchain';
import { LUNA_CASPER_WALLET } from '@luna/blockchain';

/**
 * Derive a 64-char hex public key from the Casper wallet address.
 * Casper addresses are 66 chars (00/01 prefix + 64 hex).
 * The last 64 chars are the raw public key.
 */
function walletToPubkey(wallet: string): string {
  const cleaned = wallet.replace(/^0x/i, '').replace(/^(00|01)/, '');
  // Validate: must be exactly 64 hex chars (Ed25519 public key)
  if (!/^[0-9a-fA-F]{64}$/.test(cleaned)) return '';
  return cleaned;
}

export async function GET(
  _request: Request,
  { params }: { params: { pubkey: string } },
): Promise<Response> {
  const pubkey = params.pubkey?.toLowerCase();

  if (!pubkey || pubkey.length < 64) {
    // Return Luna's own DID if no specific pubkey requested
    if (LUNA_CASPER_WALLET) {
      const lunaPubkey = walletToPubkey(LUNA_CASPER_WALLET);
      const doc = buildLunaDidDocument(lunaPubkey);
      return NextResponse.json(doc, {
        status: 200,
        headers: {
          'Content-Type': 'application/did+json',
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    return NextResponse.json(
      { error: 'Invalid pubkey', details: 'Pubkey must be at least 64 hex characters' },
      { status: 400, headers: { 'Content-Type': 'application/did+json' } },
    );
  }

  const doc = buildLunaDidDocument(pubkey);
  return NextResponse.json(doc, {
    status: 200,
    headers: {
      'Content-Type': 'application/did+json',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      'ETag': `"luna-did-${pubkey.slice(0, 12)}"`,
    },
  });
}
