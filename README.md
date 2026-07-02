# Luna 🌙 — Your Personal Event Agent

Autonomous event ticketing agent powered by AllFans. Discover events, buy tickets, transfer, check in, create events, manage gigs, and more — all via x402 micropayments on Casper.

## Buildathon: Casper x402 + AllFans

Luna is a submission for the **Casper x402 Buildathon** (July 2026). She demonstrates:

- **x402 micropayments** — Pay per operation, no subscription, no pre-funding
- **Ed25519 cryptographic verification** — Real signature verification via tweetnacl
- **Cross-chain identity** — Dual-key attestation linking Casper Ed25519 key → Base EVM address
- **did:nostr** — W3C Decentralized Identifier (v0.1.0, early adopter)
- **ERC-8004** — EVM agent identity registry
- **17 operations** — Full event lifecycle: buyer, creator, venue, social, secondary market

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure env
cp .env.example .env
# Edit .env with your keys

# Run in dev mode (mock AllFans API — no external deps needed)
ALLFANS_MOCK_MODE=true npm run dev

# Run tests
npm test
```

## Environment Variables

See `.env.example` for all required vars. Key ones:

| Variable | Purpose |
|----------|---------|
| `LUNA_EVM_PRIVATE_KEY` | EVM wallet for ERC-8004 registration |
| `ERC8004_IDENTITY_REGISTRY` | ERC-8004 contract on Base Sepolia |
| `LUNA_CASPER_WALLET_ADDRESS` | Casper wallet for receiving payments |
| `CSPR_CLOUD_API_KEY` | Casper x402 facilitator API key |
| `CASPER_MCP_SERVER_URL` | MCP server for agent discovery |
| `VENICE_API_KEY` | LLM for NLU engine |
| `ALLFANS_API_URL` | AllFans backend URL |
| `ALLFANS_MOCK_MODE` | `true` to use mock data (no AllFans needed) |

## Operations (17)

| Category | Operations |
|:---------|:-----------|
| 🎟️ Ticket Buyer | discover, buy, transfer, check_in, rsvp, marketplace |
| 🏟️ Creator/Venue | create_event, manage_gig, manage_capacity, set_pricing, venue_analytics, process_payout |
| 🍺 Experience | lookup_contact, pre_verify, buy_merch |
| 🏷️ Secondary | list_for_sale, cancel_listing |

## Chat Interface

Luna accepts natural language requests at `/api/chat`:

```bash
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Find me live music this weekend and buy 2 tickets"}'
```

Returns an operation plan with pricing. Each operation is executed via its x402 endpoint.

## Architecture

```
User → /api/chat → NLU Engine (Venice) → Executor → AllFans API / x402 Routes
                                                          ↓
                                               Cross-Chain Identity
                                               did:nostr · ERC-8004
```

- **NLU**: Venice AI (privacy-first, no data retention)
- **Payments**: x402 on Casper (Ed25519 sig verify via tweetnacl)
- **Identity**: Casper Ed25519 ↔ Base EVM via dual-key attestation
- **Discovery**: ERC-8004 (EVM) + MCP (Casper) + did:nostr (universal)

## Links

- GitHub: https://github.com/Warchildwages/Luna
- AllFans: https://allfans-k2sw.onrender.com
- Signet/Sigil: https://signet.ventures
