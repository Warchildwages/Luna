# Luna 🌙

**Your personal event agent. Powered by AllFans. Settled on Casper.**

Luna is an autonomous AI agent that discovers, purchases, transfers, and manages event tickets on behalf of humans and other agents — all via x402 micropayments on the Casper Network.

Tell your agent what you want tonight — tickets, merch, drinks, plans — and Luna handles everything.

---

## Submission — Casper Agentic Buildathon 2026

| Detail | Value |
|--------|-------|
| **Track** | Casper Innovation Track |
| **Category** | Agent-to-Agent Service Marketplace (x402-powered) |
| **Prize target** | $30K cash + $100K x402 ecosystem credits |
| **Submission deadline** | July 7, 2026 |

## Quick Start

```bash
# Clone
git clone https://github.com/Warchildwages/Luna
cd Luna

# Install
npm install

# Configure (dev mode — no blockchain needed)
cp .env.example .env
# ALLFANS_MOCK_MODE=true is set by default

# Run
npm run dev
# Luna is now running at http://localhost:3002
```

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    AGENT LAYER (Casper)                   │
│                                                          │
│  MCP Service Discovery  ←  Luna registered as luna-v1    │
│  x402 Facilitator       ←  Payment settlement            │
│  Agent Identity         ←  ERC-8004 on Base (planned)    │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │   API calls
                       ▼
┌──────────────────────────────────────────────────────────┐
│                    LUNA AGENT BACKEND                     │
│                                                          │
│  /api/x402/buy         → withX402Payment middleware       │
│  /api/x402/transfer    → withX402Payment middleware       │
│  /api/x402/check-in    → withX402Payment middleware       │
│  /api/x402/marketplace → withX402Payment middleware       │
│  /api/x402/discover    → Free (no payment)               │
│  /api/x402/rsvp        → Free (no payment)               │
│  /api/agent/status     → Live metrics + wallet            │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │   x402 payment → settle on Casper
                       │   ticket operations → AllFans on Base
                       ▼
┌──────────────────────────────────────────────────────────┐
│                    SETTLEMENT LAYER                       │
│                                                          │
│  Casper (payment)   → CSPR.cloud x402 Facilitator        │
│  Base (execution)   → AllFans ticket contracts           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## x402 Payment Flow

```
Calling Agent                    Luna                         Casper
     │                            │                             │
     │  POST /api/x402/buy        │                             │
     │  (no PAYMENT-SIGNATURE)    │                             │
     │───────────────────────────→│                             │
     │  402 Payment Required      │                             │
     │←───────────────────────────│                             │
     │                            │                             │
     │  (Agent signs              │                             │
     │   ExactCasperPayload       │                             │
     │   using Casper wallet)     │                             │
     │                            │                             │
     │  POST /api/x402/buy        │                             │
     │  + PAYMENT-SIGNATURE       │                             │
     │───────────────────────────→│                             │
     │                            │  Verify via SDK types       │
     │                            │  ├── isValidAddress()       │
     │                            │  ├── parseAmount()          │
     │                            │  └── expiration check       │
     │                            │                             │
     │                            │  POST /settle               │
     │                            │───────────────────────────→│
     │                            │  CEP-18 transfer settles    │
     │                            │←───────────────────────────│
     │                            │                             │
     │  { tickets, _payment }     │                             │
     │←───────────────────────────│                             │
```

## API Endpoints

### Paid Operations (require x402 PAYMENT-SIGNATURE header)

| Endpoint | Price | Description |
|----------|:-----:|-------------|
| `POST /api/x402/buy` | $0.01 | Purchase event tickets |
| `POST /api/x402/transfer` | $0.01 | Transfer ticket to another wallet |
| `POST /api/x402/check-in` | $0.005 | Check into event with on-chain proof |
| `GET /api/x402/marketplace` | $0.01 | Browse and purchase resale tickets |

### Free Operations

| Endpoint | Description |
|----------|-------------|
| `GET /api/x402/discover` | Search events by query, date, city, category |
| `POST /api/x402/rsvp` | RSVP to an event |

### Agent Discovery

| Endpoint | Description |
|----------|-------------|
| `GET /api/x402/service-info` | MCP service discovery metadata |
| `GET /api/agent/status` | Live agent status with wallet, metrics, uptime |
| `GET /api/x402/swarm` | Multi-agent ecosystem discovery |

## Idempotency

Agents can safely retry by including an `X-Idempotency-Key` header. Luna returns the cached result from the first successful attempt — no double-settlements.

## Dev Mode

Set `ALLFANS_MOCK_MODE=true` in `.env` to run Luna with mock event data. No AllFans backend or Casper wallet required for development.

```bash
# Quick demo of the full 402 flow
curl -s http://localhost:3002/api/x402/demo | python -m json.tool

# Trigger a 402 response
curl -s -X POST http://localhost:3002/api/x402/buy \
  -H "Content-Type: application/json" \
  -d '{"eventId":"evt-001","quantity":2}'

# Simulate a successful purchase
curl -s -X POST http://localhost:3002/api/x402/demo \
  -H "PAYMENT-SIGNATURE: signed-payload" \
  -H "Content-Type: application/json" \
  -d '{"action":"buy"}'
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Next.js 14 (App Router) |
| Payment protocol | x402 via CSPR.cloud Facilitator |
| Settlement chain | Casper Testnet (`casper:casper-test`) |
| Execution chain | Base Sepolia (via AllFans) |
| Validation | Custom ExactCasperPayload parser |
| Standards | x402, MCP, ERC-8004 (planned) |
| Idempotency | In-memory key store |
| Metrics | In-memory operation counters |

## Acknowledgments

Built for the **Casper Agentic Buildathon 2026**.

- [Casper Network](https://casper.network/) — Agent economy L1 with x402 Facilitator
- [CSPR.cloud](https://cspr.cloud/) — x402 Facilitator API
- [AllFans](https://allfans.io/) — Event ticketing platform on Base
- [@make-software/casper-x402](https://github.com/make-software/casper-x402) — Reference x402 implementation

## License

MIT
