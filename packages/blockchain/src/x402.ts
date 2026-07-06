/**
 * 🏴 Pireph (July 6, 2026) — Luna Multi-Chain x402
 *
 * Verifies and settles x402 payments on multiple chains.
 *
 * Supported protocols:
 *   PAYMENT-SIGNATURE  — Casper x402 (Ed25519 via tweetnacl + CSPR.cloud)
 *   x-402-* headers    — Circle Gateway x402 (multi-chain: Base, Arc, etc.)
 *
 * Luna detects which protocol the caller is using from the request headers,
 * validates accordingly, and routes settlement to the right facilitator.
 */

import nacl from 'tweetnacl';
import { decodeHex } from './hex-utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const NETWORK_CASPER_TESTNET = 'casper:casper-test';
export const SCHEME_EXACT = 'exact';

// Casper
export const CASPER_NETWORK = process.env.CASPER_NETWORK || NETWORK_CASPER_TESTNET;
export const CASPER_FACILITATOR_URL =
  process.env.CASPER_FACILITATOR_URL || 'https://x402-facilitator.cspr.cloud';
export const CSPR_CLOUD_API_KEY = process.env.CSPR_CLOUD_API_KEY || '';
export const LUNA_CASPER_WALLET = process.env.LUNA_CASPER_WALLET_ADDRESS || '';

// Circle Gateway (multi-chain — Base, Arc, etc.)
const CIRCLE_GATEWAY_BASE = process.env.CIRCLE_GATEWAY_BASE || 'https://api.circle.com/v1';
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY || '';

// ---------------------------------------------------------------------------
// Casper Types
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

// ---------------------------------------------------------------------------
// Circle Types
// ---------------------------------------------------------------------------

export interface CirclePaymentPayload {
  'x-402-amount': string;
  'x-402-payment-intent': string;
  'x-402-token': 'USDC';
  'x-402-recipient': string;
  'x-402-idempotency-key': string;
  'x-402-expires-at': string;
}

export interface CirclePaymentResult {
  valid: boolean;
  payload?: CirclePaymentPayload;
  error?: string;
  payer?: string;
}

// ---------------------------------------------------------------------------
// Unified Types
// ---------------------------------------------------------------------------

export type PaymentProtocol = 'casper' | 'circle';

export interface PaymentInfo {
  protocol: PaymentProtocol;
  amount: string;
  chain: string;
  payer: string;
  payee: string;
  casperPayload?: ExactCasperPayload;
  circlePayload?: CirclePaymentPayload;
}

export interface PaymentVerificationResult {
  valid: boolean;
  payment?: PaymentInfo;
  error?: string;
}

export interface SettlementResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  chain?: string;
}

// ---------------------------------------------------------------------------
// Protocol Detection
// ---------------------------------------------------------------------------

/**
 * Detect which x402 protocol a request is using.
 */
export function detectProtocol(headers: Headers): PaymentProtocol | null {
  if (headers.get('PAYMENT-SIGNATURE') || headers.get('X-Casper-Payment')) {
    return 'casper';
  }
  if (headers.get('x-402-amount') && headers.get('x-402-payment-intent')) {
    return 'circle';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Casper Address Validation
// ---------------------------------------------------------------------------

export function isValidCasperAddress(address: string): boolean {
  return /^(00|01)[0-9a-fA-F]{64}$/.test(address);
}

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

// ---------------------------------------------------------------------------
// Amount Helpers
// ---------------------------------------------------------------------------

export function parseAmount(amount: string, decimals: number): bigint {
  const [whole = '0', fraction = ''] = amount.split('.');
  const padded = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + padded);
}

export function formatAmount(amount: bigint, decimals: number): string {
  const s = amount.toString().padStart(decimals + 1, '0');
  const intPart = s.slice(0, -decimals) || '0';
  const fracPart = s.slice(-decimals);
  return `${intPart}.${fracPart}`;
}

// ---------------------------------------------------------------------------
// Casper Ed25519 Verification
// ---------------------------------------------------------------------------

export function isValidCasperSignature(payload: ExactCasperPayload): boolean {
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

/**
 * Verify an incoming payment from request headers.
 * Detects the protocol and routes to the right verifier.
 */
export async function verifyPayment(
  request: Request,
  expectedAmountUSDC: number,
): Promise<PaymentVerificationResult> {
  const headers = request.headers;
  const protocol = detectProtocol(headers);

  if (!protocol) {
    return { valid: false, error: 'MISSING_PAYMENT_HEADERS' };
  }

  if (protocol === 'casper') {
    return verifyCasperPayment(request, expectedAmountUSDC);
  }

  if (protocol === 'circle') {
    return verifyCirclePayment(request, expectedAmountUSDC);
  }

  return { valid: false, error: 'UNSUPPORTED_PROTOCOL' };
}

// ── Casper verification (existing logic, refactored) ──────────────────────

async function verifyCasperPayment(
  request: Request,
  expectedAmountUSDC: number,
): Promise<PaymentVerificationResult> {
  const raw = request.headers.get('PAYMENT-SIGNATURE') || request.headers.get('X-Casper-Payment') || '';

  try {
    const payload = JSON.parse(raw) as ExactCasperPayload;

    if (!payload.signature || !payload.publicKey || !payload.authorization) {
      return { valid: false, error: 'MISSING_REQUIRED_FIELDS' };
    }

    const auth = payload.authorization;

    if (!auth.from || !auth.to || auth.value === undefined ||
        auth.validAfter === undefined || auth.validBefore === undefined || !auth.nonce) {
      return { valid: false, error: 'INVALID_AUTHORIZATION_STRUCTURE' };
    }

    if (!isValidCasperAddress(auth.from)) {
      return { valid: false, error: 'INVALID_PAYER_ADDRESS' };
    }
    if (!isValidCasperAddress(auth.to)) {
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

    if (!isValidCasperSignature(payload)) {
      return { valid: false, error: 'INVALID_SIGNATURE' };
    }

    return {
      valid: true,
      payment: {
        protocol: 'casper',
        amount: formatAmount(BigInt(auth.value), 6),
        chain: CASPER_NETWORK,
        payer: auth.from,
        payee: auth.to,
        casperPayload: payload,
      },
    };
  } catch (err) {
    return {
      valid: false,
      error: `VERIFICATION_ERROR: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ── Circle Gateway verification (new — mirrors AllFans pattern) ───────────

async function verifyCirclePayment(
  request: Request,
  expectedAmountUSDC: number,
): Promise<PaymentVerificationResult> {
  const h = (name: string) => request.headers.get(name) || '';

  const circlePayload: CirclePaymentPayload = {
    'x-402-amount': h('x-402-amount'),
    'x-402-payment-intent': h('x-402-payment-intent'),
    'x-402-token': 'USDC',
    'x-402-recipient': h('x-402-recipient'),
    'x-402-idempotency-key': h('x-402-idempotency-key'),
    'x-402-expires-at': h('x-402-expires-at'),
  };

  // Validate required fields
  if (!circlePayload['x-402-amount'] || !circlePayload['x-402-payment-intent'] ||
      !circlePayload['x-402-recipient'] || !circlePayload['x-402-idempotency-key']) {
    return { valid: false, error: 'MISSING_X402_HEADERS' };
  }

  // Validate recipient is a valid EVM address
  if (!isValidEthereumAddress(circlePayload['x-402-recipient'])) {
    return { valid: false, error: 'INVALID_RECIPIENT_ADDRESS' };
  }

  // Validate amount matches expected
  const actualAmount = parseFloat(circlePayload['x-402-amount']);
  if (actualAmount < expectedAmountUSDC) {
    return {
      valid: false,
      error: `AMOUNT_BELOW_MINIMUM expected=${expectedAmountUSDC} got=${actualAmount}`,
    };
  }

  // Validate expiration
  const expiresAt = Number(circlePayload['x-402-expires-at']);
  if (expiresAt && expiresAt < Date.now()) {
    return { valid: false, error: 'PAYMENT_EXPIRED' };
  }

  // In mock mode, accept without Gateway verification
  if (process.env.ALLFANS_MOCK_MODE === 'true') {
    return {
      valid: true,
      payment: {
        protocol: 'circle',
        amount: circlePayload['x-402-amount'],
        chain: 'base',
        payer: circlePayload['x-402-recipient'],
        payee: circlePayload['x-402-recipient'],
        circlePayload,
      },
    };
  }

  // Production: verify via Circle Gateway
  if (!CIRCLE_API_KEY) {
    return { valid: false, error: 'CIRCLE_API_KEY_NOT_CONFIGURED' };
  }

  try {
    const resp = await fetch(`${CIRCLE_GATEWAY_BASE}/x402/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
      },
      body: JSON.stringify({
        paymentPayload: circlePayload,
        paymentRequirements: {
          network: 'eip155:8453', // Base
          token: 'USDC',
          amount: String(expectedAmountUSDC),
        },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return { valid: false, error: `CIRCLE_GATEWAY_ERROR: ${errText}` };
    }

    const data = await resp.json() as { payer?: string };
    return {
      valid: true,
      payment: {
        protocol: 'circle',
        amount: circlePayload['x-402-amount'],
        chain: 'base',
        payer: data.payer || circlePayload['x-402-recipient'],
        payee: circlePayload['x-402-recipient'],
        circlePayload,
      },
    };
  } catch (err) {
    return {
      valid: false,
      error: `CIRCLE_GATEWAY_UNREACHABLE: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Settlement
// ---------------------------------------------------------------------------

/**
 * Settle a verified payment — routes to the right facilitator based on protocol.
 */
export async function settlePayment(payment: PaymentInfo): Promise<SettlementResult> {
  if (payment.protocol === 'casper' && payment.casperPayload) {
    return settleCasper(payment.casperPayload);
  }
  if (payment.protocol === 'circle' && payment.circlePayload) {
    return settleCircle(payment.circlePayload);
  }
  return { success: false, error: 'UNKNOWN_PROTOCOL' };
}

async function settleCasper(payload: ExactCasperPayload): Promise<SettlementResult> {
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

    const result = await response.json() as { transaction?: string; transactionHash?: string };
    return {
      success: true,
      transactionHash: result.transaction || result.transactionHash,
      chain: CASPER_NETWORK,
    };
  } catch (err) {
    return {
      success: false,
      error: `Facilitator unreachable: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function settleCircle(payload: CirclePaymentPayload): Promise<SettlementResult> {
  // In mock mode, skip settlement
  if (process.env.ALLFANS_MOCK_MODE === 'true') {
    return {
      success: true,
      transactionHash: `mock-circle-${Date.now().toString(36)}`,
      chain: 'base',
    };
  }

  if (!CIRCLE_API_KEY) {
    return { success: false, error: 'CIRCLE_API_KEY_NOT_CONFIGURED' };
  }

  try {
    const resp = await fetch(`${CIRCLE_GATEWAY_BASE}/x402/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
      },
      body: JSON.stringify({ paymentPayload: payload }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return { success: false, error: `Circle settle error: ${errText}` };
    }

    const data = await resp.json() as { transaction?: string; transactionHash?: string };
    return {
      success: true,
      transactionHash: data.transaction || data.transactionHash,
      chain: 'base',
    };
  } catch (err) {
    return {
      success: false,
      error: `Circle Gateway unreachable: ${err instanceof Error ? err.message : String(err)}`,
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
      details: `This operation requires ${priceUSDC} USDC.`,
      payment_required: {
        casper: {
          network: CASPER_NETWORK,
          facilitator: CASPER_FACILITATOR_URL,
          recipient: LUNA_CASPER_WALLET,
          scheme: SCHEME_EXACT,
          asset: 'USDC (CEP-18)',
          amount: String(priceUSDC),
          operation,
          header: 'PAYMENT-SIGNATURE',
        },
        circle: {
          network: 'eip155:8453', // Base
          gateway: CIRCLE_GATEWAY_BASE,
          token: 'USDC',
          amount: String(priceUSDC),
          operation,
          headers: ['x-402-amount', 'x-402-payment-intent', 'x-402-token', 'x-402-recipient', 'x-402-idempotency-key', 'x-402-expires-at'],
        },
      },
    }),
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Required': 'true',
        'X-Service-Id': 'luna-v1',
      },
    },
  );
}

// ---------------------------------------------------------------------------
// Backward-compatible exports (for existing callers)
// ---------------------------------------------------------------------------

/** @deprecated Use verifyPayment() — multi-chain */
export async function verifyIncomingPayment(
  request: Request,
  expectedAmountUSDC: number,
) {
  const result = await verifyPayment(request, expectedAmountUSDC);
  if (result.valid && result.payment?.casperPayload) {
    return { valid: true, payload: result.payment.casperPayload, authorization: result.payment.casperPayload.authorization };
  }
  return { valid: false, error: result.error || 'PAYMENT_REQUIRED' };
}

/** @deprecated Use settlePayment() — multi-chain */
export async function settleViaFacilitator(payload: ExactCasperPayload) {
  return settleCasper(payload);
}
