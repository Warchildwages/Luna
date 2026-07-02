/**
 * GET /api/x402/demo
 *
 * Interactive demo of the full x402 payment flow for the buildathon video.
 *
 * Flow:
 *   1. GET /api/x402/demo → returns instructions + 402 trigger
 *   2. POST /api/x402/demo with fake PAYMENT-SIGNATURE → simulates ticket purchase
 *   3. Shows the complete agent-to-agent lifecycle
 *
 * This is for demo/tutorial purposes only. Real agents use the actual
 * x402 endpoints (buy, transfer, etc.) with real Casper payments.
 */
import { paymentRequiredResponse } from '@luna/blockchain';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST' };

export async function GET() {
  const demo = {
    service: 'luna-v1',
    name: 'Luna — x402 Demo',
    description: 'Simulate the full agent-to-agent x402 ticketing flow. No real CSPR required.',
    endpoints: {
      trigger: {
        method: 'POST',
        path: '/api/x402/demo',
        description: 'Send a POST with a fake PAYMENT-SIGNATURE to see the complete flow.',
        example_request: {
          headers: {
            'PAYMENT-SIGNATURE': '{"signature":"0x...","publicKey":"01...","authorization":{"from":"00...","to":"00...","value":"10000","validAfter":"0","validBefore":"9999999999","nonce":"0x..."}}',
            'Content-Type': 'application/json',
          },
          body: {
            action: 'buy',
            eventId: 'evt-001',
            quantity: 2,
          },
        },
      },
      flow: {
        1: 'Agent discovers Luna via MCP or ERC-8004 -> GET /api/x402/service-info',
        2: 'Agent POSTs to /api/x402/buy without payment -> 402 Payment Required',
        3: 'Agent signs ExactCasperPayload using Casper wallet -> sends PAYMENT-SIGNATURE',
        4: 'Luna verifies via @make-software/casper-x402 SDK',
        5: 'Luna calls AllFans on Base -> mints tickets',
        6: 'Luna settles via CSPR.cloud facilitator',
        7: 'Agent receives tickets + on-chain proof',
      },
    },
    _meta: {
      agent: 'luna',
      protocol: 'x402',
      network: 'casper:casper-test',
      standards: ['erc-8004', 'mcp', 'x402'],
    },
  };

  return Response.json(demo, { headers: CORS });
}

export async function POST(request: Request) {
  // Check if this is a real payment attempt (has PAYMENT-SIGNATURE header)
  const paymentSignature = request.headers.get('PAYMENT-SIGNATURE');

  if (!paymentSignature) {
    // Step 1: Return 402 to trigger the payment flow
    // This is what a real agent sees when calling without payment
    return paymentRequiredResponse('buy', 0.01);
  }

  // Step 2: Simulate successful ticket purchase
  // In production, this calls verifyIncomingPayment + settleViaFacilitator
  const demoResponse = {
    success: true,
    service: 'luna-v1',
    operation: 'buy',
    message: '✅ x402 payment verified — tickets purchased!',
    tickets: [
      { id: 'demo-tix-001', eventName: 'Katt Williams — World Tour 2026', date: '2026-07-15', venue: 'Madison Square Garden', tier: 'GA', price: 89 },
      { id: 'demo-tix-002', eventName: 'Katt Williams — World Tour 2026', date: '2026-07-15', venue: 'Madison Square Garden', tier: 'GA', price: 89 },
    ],
    _payment: {
      amount: '0.01',
      chain: 'casper-test',
      scheme: 'exact',
      transactionHash: `demo-casper-tx-${Date.now().toString(36)}`,
      settled: true,
    },
    _meta: {
      agent: 'luna',
      network: 'casper:casper-test',
      facilitator: 'cspr.cloud',
      flow: '1. Agent requested -> 402 -> signed payload -> verified -> settled -> tickets delivered',
    },
  };

  return Response.json(demoResponse, { status: 200, headers: CORS });
}
