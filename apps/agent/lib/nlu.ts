// 🏴 Pireph (July 1, 2026) — Luna NLU Engine
//
// Natural Language Understanding for Luna.
// Takes a user's natural language request and decomposes it into
// a sequence of operations the agent can execute.
//
// Uses Venice on Base (privacy-first, no data retention).
//
// Example:
//   Input: "get me 2 tickets to Katt Williams Friday under $50"
//   Output: [
//     { operation: "discover", params: { query: "Katt Williams", dateFrom: "2026-07-03", maxPrice: 50 } },
//     { operation: "buy", params: { eventId: "evt-001", quantity: 2, maxPrice: 50 } }
//   ]

import { complete } from './venice';
import { LUNA_OPERATIONS, LUNA_PRICING, LUNA_OPERATION_NAMES, LUNA_OPERATION_DESCRIPTIONS } from '@luna/shared';
import type { LunaOperation } from '@luna/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlannedOperation {
  operation: LunaOperation;
  params: Record<string, unknown>;
  naturalLanguage: string; // human-readable description of what this step does
}

export interface NLUResult {
  success: boolean;
  plan: PlannedOperation[];
  summary: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Operation catalog sent to the LLM
// ---------------------------------------------------------------------------

function operationCatalog(): string {
  return LUNA_OPERATIONS.map((op) => {
    const price = LUNA_PRICING[op];
    return `  ${op}: "${LUNA_OPERATION_DESCRIPTIONS[op]}" $${price.toFixed(price === 0 ? 0 : 3)}`;
  }).join('\n');
}

// ---------------------------------------------------------------------------
// NLU prompt
// ---------------------------------------------------------------------------

const NLU_SYSTEM = `You are Luna's NLU engine. You convert natural language requests into structured operation plans.

Available operations:
${operationCatalog()}

Rules:
1. Return ONLY a JSON object. No markdown, no explanation, no code fences.
2. The JSON must have: { "plan": [...], "summary": "one-line summary" }
3. Each plan item: { "operation": "op_name", "params": {...}, "naturalLanguage": "what this does" }
4. Break complex requests into multiple operations in order
5. Use reasonable defaults for missing params (current date, popular city, etc.)
6. Date defaults: "dateFrom" = tomorrow if no date specified
7. maxPrice defaults: omit if not specified
8. If the request is ambiguous or impossible, return: { "error": "explanation" }`;

// ---------------------------------------------------------------------------
// Parse NLU
// ---------------------------------------------------------------------------

/**
 * Parse a natural language request into a structured operation plan.
 * Uses Venice on Base via the LLM client.
 *
 * @param request - The user's natural language request
 * @returns A plan of operations to execute
 */
export async function parseRequest(request: string): Promise<NLUResult> {
  if (!request || request.trim().length === 0) {
    return { success: false, plan: [], summary: '', error: 'Empty request' };
  }

  try {
    const response = await complete(NLU_SYSTEM, request.trim());

    // Parse JSON from response
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(response.content);
    } catch {
      // Try to extract JSON from the response (in case LLM adds text around it)
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: false,
          plan: [],
          summary: '',
          error: `Failed to parse LLM response: ${response.content.slice(0, 200)}`,
        };
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Check for error response
    if (parsed.error) {
      return {
        success: false,
        plan: [],
        summary: '',
        error: String(parsed.error),
      };
    }

    // Validate plan
    const planData = parsed.plan;
    if (!Array.isArray(planData)) {
      return {
        success: false,
        plan: [],
        summary: '',
        error: 'LLM returned invalid plan format',
      };
    }

    const plan: PlannedOperation[] = planData.map((item: Record<string, unknown>) => ({
      operation: item.operation as LunaOperation,
      params: (item.params as Record<string, unknown>) || {},
      naturalLanguage: (item.naturalLanguage as string) || '',
    }));

    return {
      success: true,
      plan,
      summary: (parsed.summary as string) || `Plan with ${plan.length} steps`,
    };
  } catch (err) {
    return {
      success: false,
      plan: [],
      summary: '',
      error: `NLU error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}