// 🏴 Pireph (June 30, 2026) — x402 Middleware
//
// Shared middleware pattern for all Luna paid (x402) routes.
// Handles: payment verification → idempotency → execution → settlement → metrics.
//
// Usage:
//   export const POST = withX402Payment('buy', 0.01, async (request, context) => {
//     // Return data or throw errors — middleware handles the Response wrapping
//     const result = await doSomething(request);
//     return result;
//   });

import { verifyIncomingPayment, settleViaFacilitator, paymentRequiredResponse } from '@luna/blockchain';
import { buildIdempotencyKey, wasProcessed, markProcessed, getStoredResult, extractIdempotencyKey } from '@luna/blockchain';
import { recordSuccess, recordFailure } from '@luna/blockchain';
import type { ExactCasperPayload } from '@luna/blockchain';
import type { LunaOperation } from '@luna/shared';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface X402Context {
  payment: ExactCasperPayload;
  idempotencyKey: string;
  isRetry: boolean;
  previousResult: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Handler types
// ---------------------------------------------------------------------------

/** Success: returns data to be merged into the 200 response */
type X402Success = Record<string, unknown>;

/** Error: returned as { error, code, details } with appropriate HTTP status */
interface X402Error {
  error: string;
  code?: string;
  details?: unknown;
  status?: number;
}

type X402Result = X402Success | X402Error;
type X402Handler = (request: Request, context: X402Context) => Promise<X402Result>;

function isError(result: X402Result): result is X402Error {
  return 'error' in result;
}

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, PAYMENT-SIGNATURE, X-Idempotency-Key, X-User-Wallet',
  'Access-Control-Max-Age': '86400',
};

export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function addCors(headers: Record<string, string> = {}): Record<string, string> {
  return { ...CORS_HEADERS, ...headers };
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function withX402Payment(
  operation: LunaOperation,
  priceUSDC: number,
  handler: X402Handler,
) {
  return async (request: Request): Promise<Response> => {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // Step 1: Idempotency check
    const agentKey = extractIdempotencyKey(request);
    const idempotencyKey = agentKey
      ? buildIdempotencyKey(agentKey, operation)
      : '';

    if (idempotencyKey && wasProcessed(idempotencyKey)) {
      recordSuccess(operation, 0);
      const stored = getStoredResult(idempotencyKey);
      return Response.json(
        { ...stored, _retry: true, _idempotent: true },
        { status: 200, headers: addCors() },
      );
    }

    // Step 2: Payment verification
    const payment = await verifyIncomingPayment(request, priceUSDC);
    if (!payment.valid || !payment.payload) {
      recordFailure(operation, payment.error || 'PAYMENT_REQUIRED');
      return paymentRequiredResponse(operation, priceUSDC);
    }

    try {
      // Step 3: Execute handler
      const context: X402Context = {
        payment: payment.payload,
        idempotencyKey,
        isRetry: false,
        previousResult: null,
      };

      const result = await handler(request, context);

      // If handler returned an error, don't settle — return the error
      if (isError(result)) {
        recordFailure(operation, result.error);
        return Response.json(
          { error: result.error, code: result.code, details: result.details },
          { status: result.status || 400, headers: addCors() },
        );
      }

      // Step 4: Settle
      const settlement = await settleViaFacilitator(payment.payload);

      // Step 5: Build response
      const response = {
        success: true,
        service: 'luna-v1',
        operation,
        ...result,
        _payment: {
          amount: String(priceUSDC),
          chain: 'casper-test',
          scheme: 'exact',
          transactionHash: settlement.transactionHash || '',
          settled: settlement.success,
        },
        _meta: {
          agent: 'luna',
          network: 'casper:casper-test',
          facilitator: 'cspr.cloud',
        },
      };

      // Step 6: Record success + idempotency
      recordSuccess(operation, priceUSDC);
      if (idempotencyKey) {
        markProcessed(idempotencyKey, response);
      }

      return Response.json(response, { status: 200, headers: addCors() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      recordFailure(operation, message);
      return Response.json(
        { error: `${operation} failed`, code: 'OPERATION_FAILED', details: message },
        { status: 500, headers: addCors() },
      );
    }
  };
}
