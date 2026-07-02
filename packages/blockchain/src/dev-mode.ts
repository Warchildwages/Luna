// 🏴 Pireph (June 30, 2026) — Dev Mode
//
// When ALLFANS_MOCK_MODE=true, Luna returns mock data instead of calling
// the live AllFans API. This lets us demo the agent flow end-to-end
// without needing a running AllFans backend.
//
// The mock mode preserves the exact same response shapes so agents
// can test against Luna and swap to production by toggling the env var.

/**
 * Check if mock mode is active.
 * Automatically disabled in production — never returns mock data when live.
 */
export function isMockMode(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.ALLFANS_MOCK_MODE === 'true';
}

// ---------------------------------------------------------------------------
// Mock Data Generators
// ---------------------------------------------------------------------------

export function mockDiscoverEvents(): unknown[] {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return [
    {
      id: 'evt_demo_001',
      title: 'Live Music at Riverside Park',
      date: nextWeek.toISOString().split('T')[0],
      time: '19:30',
      venue: 'Riverside Park Amphitheater',
      city: 'Austin',
      category: 'live-music',
      price: 25,
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400',
      ticketsAvailable: 150,
    },
    {
      id: 'evt_demo_002',
      title: 'Open Mic Night — All Genres Welcome',
      date: tomorrow.toISOString().split('T')[0],
      time: '20:00',
      venue: 'The Basement Lounge',
      city: 'Austin',
      category: 'open-mic',
      price: 5,
      image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400',
      ticketsAvailable: 50,
    },
    {
      id: 'evt_demo_003',
      title: 'EDM Festival — Summer Edition',
      date: nextWeek.toISOString().split('T')[0],
      time: '22:00',
      venue: 'Warehouse 512',
      city: 'Austin',
      category: 'edm',
      price: 45,
      image: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=400',
      ticketsAvailable: 300,
    },
    {
      id: 'evt_demo_004',
      title: 'Photography Workshop: Night Shooting',
      date: nextWeek.toISOString().split('T')[0],
      time: '18:00',
      venue: 'Creative Studios Downtown',
      city: 'Austin',
      category: 'workshop',
      price: 35,
      image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400',
      ticketsAvailable: 20,
    },
    {
      id: 'evt_demo_005',
      title: '911 Special Event — Community First Response',
      date: nextWeek.toISOString().split('T')[0],
      time: '09:00',
      venue: 'City Hall Plaza',
      city: 'Austin',
      category: 'community',
      price: 0,
      image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400',
      ticketsAvailable: 500,
    },
  ];
}

export function mockBuyTickets(userWallet: string): {
  tickets: Array<{ id: string; eventName: string; date: string; venue: string; tier: string; price: number }>;
  payment: { amount: string; chain: string; transactionHash: string };
} {
  return {
    tickets: [
      {
        id: `tkt_${Date.now().toString(36)}`,
        eventName: 'Live Music at Riverside Park',
        date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        venue: 'Riverside Park Amphitheater',
        tier: 'General Admission',
        price: 25,
      },
    ],
    payment: {
      amount: '0.01',
      chain: 'casper:casper-test',
      transactionHash: `0x${Date.now().toString(16).padStart(64, '0')}`,
    },
  };
}

export function mockTransferTicket(): { success: boolean; transactionHash?: string } {
  return {
    success: true,
    transactionHash: `0x${Date.now().toString(16).padStart(64, '0')}`,
  };
}

export function mockCheckIn(): { success: boolean } {
  return { success: true };
}

export function mockRsvp(): { success: boolean } {
  return { success: true };
}

export function mockMarketplaceList(): unknown[] {
  return [
    {
      id: 'lst_demo_001',
      eventName: 'EDM Festival — Summer Edition',
      price: 40,
      quantity: 2,
      seller: 'casper:coolfan...abc',
    },
    {
      id: 'lst_demo_002',
      eventName: 'Open Mic Night',
      price: 8,
      quantity: 1,
      seller: 'casper:another...xyz',
    },
  ];
}
