import { describe, expect, it } from 'vitest';
import { DEFAULT_PRICING, formatCents, quote } from './pricing';
import { LAUNCH_ZIPS, normalizeZip } from './serviceArea';

describe('quote', () => {
  it('prices one dog, small yard, weekly at the base price', () => {
    expect(quote({ dogs: 1, yardSize: 'small', frequency: 'weekly' })).toEqual({
      perVisitCents: 1600,
      platformFeeCents: 320,
      scooperPayoutCents: 1280,
      estimatedMonthlyCents: 6933,
    });
  });

  it('adds extra dogs and scales by yard size and frequency', () => {
    // (1600 + 2 * 400) * 1.35 * 1.25 = 4050
    const q = quote({ dogs: 3, yardSize: 'large', frequency: 'biweekly' });
    expect(q.perVisitCents).toBe(4050);
    expect(q.estimatedMonthlyCents).toBe(Math.round((4050 * 26) / 12));
  });

  it('rounds to the nearest 50 cents', () => {
    // 1600 * 1.15 = 1840 -> 1850
    expect(quote({ dogs: 1, yardSize: 'medium', frequency: 'weekly' }).perVisitCents).toBe(1850);
  });

  it('prices one-time cleanups from the one-time base with no monthly estimate', () => {
    const q = quote({ dogs: 2, yardSize: 'small', frequency: 'one_time' });
    expect(q.perVisitCents).toBe(6400);
    expect(q.estimatedMonthlyCents).toBeNull();
  });

  it('always splits the price exactly between scooper and platform', () => {
    const q = quote({ dogs: 4, yardSize: 'medium', frequency: 'twice_weekly' }, {
      ...DEFAULT_PRICING,
      commissionRate: 0.17,
    });
    expect(q.platformFeeCents + q.scooperPayoutCents).toBe(q.perVisitCents);
  });

  it('rejects invalid dog counts', () => {
    expect(() => quote({ dogs: 0, yardSize: 'small', frequency: 'weekly' })).toThrow(RangeError);
    expect(() => quote({ dogs: 1.5, yardSize: 'small', frequency: 'weekly' })).toThrow(RangeError);
    expect(() => quote({ dogs: 11, yardSize: 'small', frequency: 'weekly' })).toThrow(RangeError);
  });
});

describe('formatCents', () => {
  it('formats dollars', () => {
    expect(formatCents(1850)).toBe('$18.50');
  });
});

describe('service area', () => {
  it('normalizes ZIP and ZIP+4', () => {
    expect(normalizeZip(' 19103 ')).toBe('19103');
    expect(normalizeZip('19103-1234')).toBe('19103');
    expect(normalizeZip('1910')).toBeNull();
  });

  it('has no duplicate launch ZIPs', () => {
    const zips = LAUNCH_ZIPS.map((z) => z.zip);
    expect(new Set(zips).size).toBe(zips.length);
  });
});

describe('pricingFromRow', () => {
  it('parses numeric strings from the database', async () => {
    const { pricingFromRow } = await import('./db');
    const rules = pricingFromRow({
      id: 1,
      base_visit_cents: 1600,
      extra_dog_cents: 400,
      yard_small: '1.00',
      yard_medium: '1.15',
      yard_large: '1.35',
      freq_twice_weekly: '0.90',
      freq_weekly: '1.00',
      freq_biweekly: '1.25',
      one_time_base_cents: 6000,
      commission_rate: '0.200',
      updated_at: '2026-10-08T00:00:00Z',
    });
    expect(rules).toEqual(DEFAULT_PRICING);
  });
});
