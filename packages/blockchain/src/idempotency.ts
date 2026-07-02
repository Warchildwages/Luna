// 🏴 Pireph (June 30, 2026) — Idempotency Tracker
//
// Prevents double-settlement when agents retry requests.
// Agents include X-Idempotency-Key header — Luna checks if this key
// was already processed before settling a second time.
//
// In-memory Set for development. Production swaps to Redis/Postgres.

const processedKeys = new Set<string>();

/** Prefix for Luna's idempotency keys */
const IDEMPOTENCY_PREFIX = 'luna-v1:';

/**
 * Build a scoped idempotency key from the agent-provided key + operation.
 * This prevents collisions across different operations.
 */
export function buildIdempotencyKey(agentKey: string, operation: string): string {
  return `${IDEMPOTENCY_PREFIX}${operation}:${agentKey}`;
}

/**
 * Check if an idempotency key was already processed.
 * Returns the stored result if found (so the agent gets the same response
 * on retry instead of an error).
 */
export function wasProcessed(key: string): boolean {
  return processedKeys.has(key);
}

/**
 * Mark an idempotency key as processed.
 * Stores the result so retries get the same response.
 */
export function markProcessed(
  key: string,
  result: Record<string, unknown>,
): void {
  processedKeys.add(key);
  // Store result for retry replay (in-memory)
  idempotencyResults.set(key, result);
}

const idempotencyResults = new Map<string, Record<string, unknown>>();

/**
 * Get the stored result for a previously-processed key.
 * Agents that retry get the same response, not a "duplicate" error.
 */
export function getStoredResult(key: string): Record<string, unknown> | null {
  return idempotencyResults.get(key) ?? null;
}

/**
 * Extract the idempotency key from a request.
 * Agents send X-Idempotency-Key header for retry safety.
 */
export function extractIdempotencyKey(request: Request): string | null {
  return request.headers.get('X-Idempotency-Key');
}

/**
 * Reset the idempotency store (for testing).
 */
export function resetIdempotency(): void {
  processedKeys.clear();
  idempotencyResults.clear();
}
