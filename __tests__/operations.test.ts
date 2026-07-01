import { describe, it, expect } from 'vitest';
import { LUNA_PRICING, LUNA_OPERATIONS } from '@/lib/luna-types';

describe('Luna Operations', () => {
  it('has all expected operations', () => {
    expect(LUNA_OPERATIONS).toContain('discover');
    expect(LUNA_OPERATIONS).toContain('buy');
    expect(LUNA_OPERATIONS).toContain('transfer');
    expect(LUNA_OPERATIONS).toContain('check_in');
    expect(LUNA_OPERATIONS).toContain('rsvp');
    expect(LUNA_OPERATIONS).toContain('marketplace');
    expect(LUNA_OPERATIONS).toHaveLength(6);
  });

  it('has correct pricing', () => {
    expect(LUNA_PRICING.discover).toBe(0);
    expect(LUNA_PRICING.buy).toBe(0.01);
    expect(LUNA_PRICING.transfer).toBe(0.01);
    expect(LUNA_PRICING.check_in).toBe(0.005);
    expect(LUNA_PRICING.rsvp).toBe(0);
    expect(LUNA_PRICING.marketplace).toBe(0.01);
  });

  it('has free operations for discover and rsvp', () => {
    expect(LUNA_PRICING.discover).toBe(0);
    expect(LUNA_PRICING.rsvp).toBe(0);
  });

  it('has paid operations with positive prices', () => {
    expect(LUNA_PRICING.buy).toBeGreaterThan(0);
    expect(LUNA_PRICING.transfer).toBeGreaterThan(0);
    expect(LUNA_PRICING.check_in).toBeGreaterThan(0);
    expect(LUNA_PRICING.marketplace).toBeGreaterThan(0);
  });
});
