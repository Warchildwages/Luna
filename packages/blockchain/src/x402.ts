// 🏴 Pireph (June 30, 2026) — Luna Casper x402 Path
// Pireph (July 1, 2026) — Added Ed25519 signature verification

// Validates x402 payments on Casper. Uses types from the official SDK
// for type safety but implements verification directly to avoid
// webpack bundling issues with the SDK's Node-specific modules.
//
// Settlement goes through CSPR.cloud facilitator REST API.
//
// Constants reference:
//   NETWORK_CASPER_TESTNET = "casper:casper-test"
//   SCHEME_EXACT = "exact"

import nacl from 'tweetnacl';
import { decodeHex } from './hex-utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const NETWORK_CASPER_TESTNET = 'casper:casper-test';
export const SCHEME_EXACT = 'exact';

export const CASPER_NETWORK = process.env.CASPER_NETWORK || NETWORK_CASPER_TESTNET;
export const CASPER_FACILITATOR_URL =
  process.env.CASPER_FACILITATOR_URL || 'https://x402-facilitator.cspr.cloud';
export const CSPR_CLOUD_API_KEY = process.env.CSPR_CLOUD_API_KEY || '';
export const LUNA_CASPER_WALLET = process.env.LUNA_CASPER_WALLET_ADDRESS || '';

// ---------------------------------------------------------------------------
// Types (mirror @make-software/casper-x402 types — avoids bundling SDK)
// ---------------------------------------------------------------------------

export interface ExactCasperAuthorization {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

export interface ExactCasperPayload {
  signature: string;
  publicKey: string;
  authorization: ExactCasperAuthorization;
}

export interface PaymentVerificationResult {
  valid: boolean;
  payload?: ExactCasperPayload;
  authorization?: ExactCasperAuthorization;
  error?: string;
}

// ---------------------------------------------------------------------------
// Validation utils (replaces SDK imports that break webpack)
// ---------------------------------------------------------------------------

/** Validate a Casper address: 66 hex chars with "00" or "01" prefix */
export function isValidAddress(address: string): boolean {
  return /^(00|01)[0-9a-fA-F]{64}$/.test(address);
}

/** Parse a decimal USDC amount to atomic units (6 decimals) */
export function parseAmount(amount: string, decimals: number): bigint {
  const [whole = '0', fraction = ''] = amount.split('.');
  const padded = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + padded);
}

/** Format atomic units back to decimal USDC string */
export function formatAmount(amount: bigint, decimals: number): string {
  const s = amount.toString().padStart(decimals + 1, '0');
  const intPart = s.slice(0, -decimals) || '0';
  const fracPart = s.slice(-decimals);
  return `${intPart}.${fracPart}`;
}

// ---------------------------------------------------------------------------
// Ed25519 Signature Verification
// ---------------------------------------------------------------------------

/**
 * Verify an Ed25519 signature over the authorization payload.
 * Uses tweetnacl (37KB, pure JS, zero Node dependencies).
 *
 * @returns true if signature is cryptographically valid
 */
export function isValidSignature(payload: ExactCasperPayload): boolean {
  try {
    const authBytes = new TextEncoder().encode(JSON.stringify(payload.authorization));
    const signature = decodeHex(payload.signature);
    const publicKey = decodeHex(payload.publicKey);
    return nacl.sign.detached.verify(authBytes, signature, publicKey);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Payment Verification
// ---------------------------------------------------------------------------

export async function verifyIncomingPayment(
  request: Request,
  expectedAmountUSDC: number,
): Promise<PaymentVerificationResult> {
  const paymentSignature = request.headers.get('PAYMENT-SIGNATURE');

  if (!paymentSignature) {
    return { valid: false, error: 'MISSING_PAYMENT_SIGNATURE_HEADER' };
  }

  try {
    let payload: ExactCasperPayload;
    try {
      payload = JSON.parse(paymentSignature) as ExactCasperPayload;
    } catch {
      return { valid: false, error: 'INVALID_PAYLOAD_JSON' };
    }

    if (!payload.signature || !payload.publicKey || !payload.authorization) {
      return { valid: false, error: 'MISSING_REQUIRED_FIELDS' };
    }

    const auth = payload.authorization;

    if (!auth.from || !auth.to || !auth.value ||
        auth.validAfter === undefined || auth.validBefore === undefined || !auth.nonce) {
      return { valid: false, error: 'INVALID_AUTHORIZATION_STRUCTURE' };
    }

    if (!isValidAddress(auth.from)) {
      return { valid: false, error: 'INVALID_PAYER_ADDRESS' };
    }
    if (!isValidAddress(auth.to)) {
      return { valid: false, error: 'INVALID_PAYEE_ADDRESS' };
    }

    if (LUNA_CASPER_WALLET && auth.to !== LUNA_CASPER_WALLET) {
      return { valid: false, error: 'PAYEE_MISMATCH' };
    }

    const now = Math.floor(Date.now() / 1000);
    if (Number(auth.validBefore) < now) {
      return { valid: false, error: 'PAYMENT_EXPIRED' };
    }
    if (Number(auth.validAfter) > now) {
      return { valid: false, error: 'PAYMENT_NOT_YET_VALID' };
    }

    const expectedAtomic = parseAmount(String(expectedAmountUSDC), 6);
    if (BigInt(auth.value) !== expectedAtomic) {
      return {
        valid: false,
        error: `AMOUNT_MISMATCH expected=${expectedAtomic} got=${auth.value}`,
      };
    }

    // Step 5: Cryptographic signature verification
    if (!isValidSignature(payload)) {
      return { valid: false, error: 'INVALID_SIGNATURE' };
    }

    return { valid: true, payload, authorization: auth };
  } catch (err) {
    return {
      valid: false,
      error: `VERIFICATION_ERROR: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Settlement via CSPR.cloud Facilitator
// ---------------------------------------------------------------------------

export async function settleViaFacilitator(
  payload: ExactCasperPayload,
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const response = await fetch(`${CASPER_FACILITATOR_URL}/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CSPR_CLOUD_API_KEY ? { 'X-CSPR-Cloud-Api-Key': CSPR_CLOUD_API_KEY } : {}),
      },
      body: JSON.stringify({
        paymentPayload: payload,
        network: CASPER_NETWORK,
        scheme: SCHEME_EXACT,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Facilitator error: ${error}` };
    }

    const result = await response.json();
    return {
      success: true,
      transactionHash: result.transaction || result.transactionHash,
    };
  } catch (err) {
    return {
      success: false,
      error: `Facilitator unreachable: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// 402 Response Builder
// ---------------------------------------------------------------------------

export function paymentRequiredResponse(
  operation: string,
  priceUSDC: number,
): Response {
  return new Response(
    JSON.stringify({
      error: 'Payment required',
      code: 'PAYMENT_REQUIRED',
      service: 'luna-v1',
      details: `This operation requires ${priceUSDC} USDC via Casper x402.`,
      payment_required: {
        network: CASPER_NETWORK,
        facilitator: CASPER_FACILITATOR_URL,
        recipient: LUNA_CASPER_WALLET,
        scheme: SCHEME_EXACT,
        asset: 'USDC (CEP-18)',
        amount: String(priceUSDC),
        operation,
      },
    }),
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Required': 'true',
        'X-Service-Id': 'luna-v1',
        'X-Network': CASPER_NETWORK,
      },
    },
  );
}
