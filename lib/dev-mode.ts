// 🏴 Pireph (June 30, 2026) — Dev Mode
//
// When ALLFANS_MOCK_MODE=true, Luna returns mock data instead of calling
// the live AllFans API. This lets us demo the agent flow end-to-end
// without needing a running AllFans backend.
//
// The mock mode preserves the exact same response shapes so agents
// can test against Luna and swap to production by toggling the env var.

const MOCK_MODE = process.env.ALLFANS_MOCK_MODE === 'true';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_EVENTS = [
  {
    id: 'evt-001',
    title: 'Katt Williams — World Tour 2026',
    date: '2026-07-15T20:00:00Z',
    venue: 'Madison Square Garden',
    city: 'New York',
    category: 'comedy',
    price: { min: 45, max: 250 },
    ticketsAvailable: 1200,
  },
  {
    id: 'evt-002',
    title: 'Neon Nights — Electronic Music Festival',
    date: '2026-08-01T18:00:00Z',
    venue: 'Brooklyn Mirage',
    city: 'New York',
    category: 'music',
    price: { min: 65, max: 180 },
    ticketsAvailable: 3400,
  },
  {
    id: 'evt-003',
    title: 'Hamilton — Broadway Revival',
    date: '2026-07-22T19:30:00Z',
    venue: 'Richard Rodgers Theatre',
    city: 'New York',
    category: 'theatre',
    price: { min: 89, max: 350 },
    ticketsAvailable: 800,
  },
];

const MOCK_TICKETS = [
  { id: 'tix-001', eventName: 'Katt Williams — World Tour 2026', date: '2026-07-15', venue: 'Madison Square Garden', tier: 'GA', price: 89 },
  { id: 'tix-002', eventName: 'Katt Williams — World Tour 2026', date: '2026-07-15', venue: 'Madison Square Garden', tier: 'GA', price: 89 },
];

const MOCK_LISTINGS = [
  { id: 'resale-001', eventName: 'Katt Williams — World Tour 2026', section: 'Floor', seat: 'A12', price: 150, seller: '0xabc...' },
  { id: 'resale-002', eventName: 'Neon Nights', type: 'VIP', price: 220, seller: '0xdef...' },
];

// ---------------------------------------------------------------------------
// Mock responses
// ---------------------------------------------------------------------------

export function mockDiscoverEvents(): unknown[] {
  if (!MOCK_MODE) return [];
  return MOCK_EVENTS;
}

export function mockBuyTickets(userWallet: string): {
  success: boolean;
  tickets: typeof MOCK_TICKETS;
  payment: { amount: string; chain: string; transactionHash: string };
} {
  return {
    success: true,
    tickets: MOCK_TICKETS.map((t) => ({ ...t, owner: userWallet })),
    payment: {
      amount: String(MOCK_TICKETS.length * 89),
      chain: 'base-sepolia',
      transactionHash: `0xmock-base-${Date.now().toString(36)}`,
    },
  };
}

export function mockTransferTicket(): { success: boolean; transactionHash: string } {
  return { success: true, transactionHash: `0xmock-transfer-${Date.now().toString(36)}` };
}

export function mockCheckIn(): { success: boolean } {
  return { success: true };
}

export function mockMarketplaceList(): unknown[] {
  return MOCK_LISTINGS;
}

export function mockRsvp(): { success: boolean } {
  return { success: true };
}

export function isMockMode(): boolean {
  return MOCK_MODE;
}
