// 🏴 Pireph (June 30, 2026) — Luna Operation Counter
//
// Tracks real-time operation metrics for the /api/agent/status endpoint.
// Thread-safe in-memory counters. Production swaps to Redis/Prometheus.

import { LUNA_OPERATIONS } from './luna-types';

interface OperationMetric {
  totalCalls: number;
  totalPaid: number;       // USDC earned (sum of prices × calls)
  lastCalledAt: string | null;
  lastError: string | null;
  successfulCalls: number;
  failedCalls: number;
}

const counters = new Map<string, OperationMetric>();

function getCounter(operation: string): OperationMetric {
  if (!counters.has(operation)) {
    counters.set(operation, {
      totalCalls: 0,
      totalPaid: 0,
      lastCalledAt: null,
      lastError: null,
      successfulCalls: 0,
      failedCalls: 0,
    });
  }
  return counters.get(operation)!;
}

/** Record a successful operation call. */
export function recordSuccess(operation: string, priceUSDC: number): void {
  const c = getCounter(operation);
  c.totalCalls++;
  c.successfulCalls++;
  c.totalPaid += priceUSDC;
  c.lastCalledAt = new Date().toISOString();
}

/** Record a failed operation call. */
export function recordFailure(operation: string, error: string): void {
  const c = getCounter(operation);
  c.totalCalls++;
  c.failedCalls++;
  c.lastCalledAt = new Date().toISOString();
  c.lastError = error;
}

/** Get a snapshot of all operation metrics — dynamically from LUNA_OPERATIONS. */
export function getAllMetrics(): OperationMetric[] {
  return LUNA_OPERATIONS.map((op) => getCounter(op));
}

/** Get total USDC earned across all operations. */
export function totalEarned(): number {
  let total = 0;
  counters.forEach((c) => {
    total += c.totalPaid;
  });
  return total;
}

/** Get total calls across all operations. */
export function totalCalls(): number {
  let total = 0;
  counters.forEach((c) => {
    total += c.totalCalls;
  });
  return total;
}

/** Reset all counters (for testing). */
export function resetCounters(): void {
  counters.clear();
}
