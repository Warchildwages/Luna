import { describe, it, expect } from 'vitest';
import { LUNA_PRICING, LUNA_OPERATIONS } from '@luna/shared';

describe('Luna Operations', () => {
  it('has all expected operations', () => {
    expect(LUNA_OPERATIONS).toContain('discover');
    expect(LUNA_OPERATIONS).toContain('buy');
    expect(LUNA_OPERATIONS).toContain('transfer');
    expect(LUNA_OPERATIONS).toContain('check_in');
    expect(LUNA_OPERATIONS).toContain('rsvp');
    expect(LUNA_OPERATIONS).toContain('marketplace');
    expect(LUNA_OPERATIONS).toContain('create_event');
    expect(LUNA_OPERATIONS).toContain('manage_gig');
    expect(LUNA_OPERATIONS).toContain('manage_capacity');
    expect(LUNA_OPERATIONS).toContain('set_pricing');
    expect(LUNA_OPERATIONS).toContain('venue_analytics');
    expect(LUNA_OPERATIONS).toContain('process_payout');
    expect(LUNA_OPERATIONS).toContain('lookup_contact');
    expect(LUNA_OPERATIONS).toContain('pre_verify');
    expect(LUNA_OPERATIONS).toContain('buy_merch');
    expect(LUNA_OPERATIONS).toContain('list_for_sale');
    expect(LUNA_OPERATIONS).toContain('cancel_listing');
    expect(LUNA_OPERATIONS).toHaveLength(17);
  });

  it('has correct pricing', () => {
    expect(LUNA_PRICING.discover).toBe(0);
    expect(LUNA_PRICING.buy).toBe(0.01);
    expect(LUNA_PRICING.transfer).toBe(0.01);
    expect(LUNA_PRICING.check_in).toBe(0.005);
    expect(LUNA_PRICING.rsvp).toBe(0);
    expect(LUNA_PRICING.marketplace).toBe(0.01);
    expect(LUNA_PRICING.create_event).toBe(0.05);
    expect(LUNA_PRICING.manage_gig).toBe(0.02);
    expect(LUNA_PRICING.manage_capacity).toBe(0.01);
    expect(LUNA_PRICING.set_pricing).toBe(0.01);
    expect(LUNA_PRICING.venue_analytics).toBe(0.02);
    expect(LUNA_PRICING.process_payout).toBe(0.05);
    expect(LUNA_PRICING.lookup_contact).toBe(0);
    expect(LUNA_PRICING.pre_verify).toBe(0.01);
    expect(LUNA_PRICING.buy_merch).toBe(0.02);
    expect(LUNA_PRICING.list_for_sale).toBe(0.01);
    expect(LUNA_PRICING.cancel_listing).toBe(0);
  });

  it('has free operations for discover, rsvp, lookup_contact, and cancel_listing', () => {
    expect(LUNA_PRICING.discover).toBe(0);
    expect(LUNA_PRICING.rsvp).toBe(0);
    expect(LUNA_PRICING.lookup_contact).toBe(0);
    expect(LUNA_PRICING.cancel_listing).toBe(0);
  });

  it('has paid operations with positive prices', () => {
    expect(LUNA_PRICING.buy).toBeGreaterThan(0);
    expect(LUNA_PRICING.transfer).toBeGreaterThan(0);
    expect(LUNA_PRICING.check_in).toBeGreaterThan(0);
    expect(LUNA_PRICING.marketplace).toBeGreaterThan(0);
    expect(LUNA_PRICING.create_event).toBeGreaterThan(0);
    expect(LUNA_PRICING.manage_gig).toBeGreaterThan(0);
    expect(LUNA_PRICING.manage_capacity).toBeGreaterThan(0);
    expect(LUNA_PRICING.set_pricing).toBeGreaterThan(0);
    expect(LUNA_PRICING.venue_analytics).toBeGreaterThan(0);
    expect(LUNA_PRICING.process_payout).toBeGreaterThan(0);
    expect(LUNA_PRICING.pre_verify).toBeGreaterThan(0);
    expect(LUNA_PRICING.buy_merch).toBeGreaterThan(0);
    expect(LUNA_PRICING.list_for_sale).toBeGreaterThan(0);
  });
});
