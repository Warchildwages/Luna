/**
 * POST /api/chat
 *
 * Luna's natural language interface. Takes a user's plain-text request,
 * decomposes it into operations via NLU, executes them, and returns
 * a structured response.
 *
 * This is how humans talk to Luna — not via x402 (that's for agent-to-agent).
 * The chat endpoint uses Venice on Base for NLU and calls the same
 * operation handlers as the x402 endpoints.
 *
 * Example:
 *   POST /api/chat
 *   { "message": "find me a jazz show this Friday under $50" }
 *
 *   Response:
 *   {
 *     "success": true,
 *     "summary": "Found 3 jazz events this Friday under $50",
 *     "nlu": {
 *       "plan": [{ operation: "discover", params: {...}, naturalLanguage: "..." }],
 *       "summary": "Searching for jazz events..."
 *     },
 *     "execution": {
 *       "success": true,
 *       "steps": [{ operation: "discover", success: true, data: {...} }]
 *     }
 *   }
 */
import { parseRequest } from '@/lib/nlu';
import { executePlan } from '@/lib/executor';

export async function POST(request: Request) {
  // Parse request body
  let body: { message?: string; userWallet?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  if (!body.message || body.message.trim().length === 0) {
    return Response.json(
      { success: false, error: 'Message is required' },
      { status: 400 },
    );
  }

  // Step 1: Parse via NLU (Venice on Base)
  const nluResult = await parseRequest(body.message);
  if (!nluResult.success) {
    return Response.json(
      {
        success: false,
        error: nluResult.error || 'Could not understand your request',
        message: body.message,
      },
      { status: 400 },
    );
  }

  // Step 2: Execute the plan
  const execution = await executePlan(nluResult.plan, body.userWallet);

  // Step 3: Build response
  const response = {
    success: execution.success,
    message: body.message,
    summary: nluResult.summary,
    nlu: {
      plan: nluResult.plan,
      summary: nluResult.summary,
    },
    execution: {
      success: execution.success,
      summary: execution.summary,
      steps: execution.steps.map((step) => ({
        operation: step.operation,
        success: step.success,
        data: step.success ? step.data : undefined,
        error: step.error,
      })),
    },
    _meta: {
      agent: 'luna',
      nlu_provider: 'venice',
      execution_chain: 'base-sepolia',
    },
  };

  return Response.json(response, { status: 200 });
}