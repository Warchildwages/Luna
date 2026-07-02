/**
 * GET /api/x402/swarm
 *
 * Swarm discovery — returns the full agent ecosystem Luna participates in.
 * Other agents query this to find complementary services (legal, compliance, etc.)
 * that work alongside Luna through x402 + A2A.
 *
 * Example: An agent buying tickets can also find Sigil for legal review
 * of event contracts — all paid via x402, all discoverable from one endpoint.
 */
import { NextResponse } from 'next/server';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' };

export async function GET() {
  return NextResponse.json(
    {
      serviceId: 'luna-v1',
      name: 'Luna — Your Personal Event Agent',
      version: '0.1.0',
      description: 'Autonomous event ticketing agent. Part of the Axium agent swarm.',
      payment: {
        protocol: 'x402',
        network: 'casper:casper-test',
      },
      swarm: [
        {
          serviceId: 'sigil-v1',
          name: 'Sigil — Legal Clarity Agent',
          description: 'Legal document analysis, witness, escrow, dispute resolution, compliance auditing.',
          endpoint: 'https://signet.ventures/api/x402/service-info',
          operations: ['analyze', 'witness', 'escrow', 'dispute', 'compliance', 'timestamp'],
          discoverable: true,
        },
        {
          serviceId: 'regulatory-agent',
          name: 'Regulatory Research Agent',
          description: 'Jurisdiction-specific regulatory landscape research. Commissioned by Sigil for specialized legal analysis.',
          endpoint: null,
          operations: ['research', 'jurisdiction-check'],
          discoverable: false, // Invoke-only via Sigil
        },
        {
          serviceId: 'compliance-agent',
          name: 'Compliance Audit Agent',
          description: 'Regulatory compliance auditing against GDPR, ABA-AI-2025, MiCA, and other frameworks.',
          endpoint: null,
          operations: ['gdpr-audit', 'aba-ai-audit', 'mica-audit'],
          discoverable: false, // Invoke-only via Sigil
        },
      ],
      _meta: {
        agent: 'luna',
        ecosystem: 'axium',
        chains: ['casper:casper-test', 'base:84532'],
        standards: ['x402', 'erc-8004', 'mcp'],
      },
    },
    { headers: CORS },
  );
}
