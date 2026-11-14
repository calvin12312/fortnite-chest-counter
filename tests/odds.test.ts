import {
  chanceAtLeastOne,
  chestsForChance,
  formatChance,
  prizeChances,
  PRIZES,
  REFERENCE_CHANCES,
  whatIfChances,
} from '@/odds';
import {
  DEFAULT_BOOST,
  type TallyRecord,
} from '@/tally/types';
import { describe, expect, it } from 'vitest';

describe('chest odds', () => {
  it('S-19/S-20: chance of at least one drop in 1,000 chests', () => {
    expect(formatChance(chanceAtLeastOne(1000))).toBe('0.725%');
    expect(formatChance(chanceAtLeastOne(1000, 1.5))).toBe('1.08%');
  });

  it('calculator uses the multiplier it is given (S-56: boost ×2)', () => {
    expect(formatChance(chanceAtLeastOne(1000, 2))).toBe('1.44%');
    expect(chestsForChance(0.5, 2)).toBe(47_654);
  });

  it('S-21/S-22: reference table chest counts', () => {
    expect(REFERENCE_CHANCES.map((q) => chestsForChance(q))).toEqual([
      95_308, 190_615, 316_605, 633_209,
    ]);
    expect(REFERENCE_CHANCES.map((q) => chestsForChance(q, 1.5))).toEqual([
      63_539, 127_077, 211_070, 422_139,
    ]);
  });

  it('S-43: extremes never show 0% or 100%', () => {
    expect(formatChance(chanceAtLeastOne(1))).toBe('<0.001%');
    expect(formatChance(chanceAtLeastOne(999_999_999))).toBe('>99.99%');
  });

  it('empty or invalid input is 0%', () => {
    expect(formatChance(chanceAtLeastOne(0))).toBe('0%');
    expect(formatChance(chanceAtLeastOne(Number.NaN))).toBe('0%');
    expect(formatChance(chanceAtLeastOne(-5))).toBe('0%');
  });

  it('formatChance precision bands', () => {
    expect(formatChance(5)).toBe('5.00%');
    expect(formatChance(50)).toBe('50.0%');
    expect(formatChance(99.98)).toBe('99.9%');
  });
});

const open = (n: number): TallyRecord => ({ kind: 'open', at: 1, n });
const treasure = (n: number, boost = DEFAULT_BOOST): TallyRecord => ({
  kind: 'treasure',
  at: 1,
  n,
  boost,
});
const shown = (records: readonly TallyRecord[]) =>
  Object.fromEntries(
    Object.entries(prizeChances(records)).map(([k, v]) => [k, formatChance(v)])
  );

describe('prizeChances', () => {
  it('lists Epic seven tiers in order with the verified normal rates', () => {
    expect(PRIZES.map((p) => [p.id, p.odds])).toEqual([
      ['goldOutfit', 1_562_500],
      ['pirateShop', 137_500],
      ['vehicleDecal', 7_813],
      ['pickaxeBackbling', 568],
      ['jamTrack', 391],
      ['loadingScreen', 272],
      ['gizmo', 127],
    ]);
  });

  it('S-54: 1,000 standard chests', () => {
    expect(shown([open(500), open(500)])).toEqual({
      goldOutfit: '0.064%',
      pirateShop: '0.725%',
      vehicleDecal: '12.0%',
      pickaxeBackbling: '82.8%',
      jamTrack: '92.3%',
      loadingScreen: '97.5%',
      gizmo: '99.9%',
    });
  });

  it('no records is 0% for every tier, never -0', () => {
    const out = prizeChances([]);
    for (const p of PRIZES) {
      expect(Object.is(out[p.id], 0)).toBe(true);
      expect(formatChance(out[p.id])).toBe('0%');
    }
  });

  it('S-55: 900 standard + 100 Treasure Hours boosts only the first three tiers', () => {
    expect(shown([open(900), treasure(100)])).toEqual({
      goldOutfit: '0.106%',
      pirateShop: '0.761%',
      vehicleDecal: '21.6%',
      pickaxeBackbling: '82.8%',
      jamTrack: '92.3%',
      loadingScreen: '97.5%',
      gizmo: '99.9%',
    });
  });

  it('S-56: each Treasure Hours record keeps its own snapshot', () => {
    const edited = { ...DEFAULT_BOOST, pirateShop: 2 };
    const before = prizeChances([open(900), treasure(100)]).pirateShop;
    // New records with the edited boost do not change the old 100 chests' maths.
    const withMore = prizeChances([
      open(900),
      treasure(100),
      treasure(1, edited),
    ]);
    expect(withMore.pirateShop).toBeGreaterThan(before);
    expect(formatChance(before)).toBe('0.761%');
    // The same 100 chests at x2 would be higher than at x1.5.
    expect(
      prizeChances([open(900), treasure(100, edited)]).pirateShop
    ).toBeGreaterThan(before);
  });

  it('S-57: a start record counts at multiplier 1', () => {
    const start: TallyRecord = { kind: 'start', at: 1, n: 4000 };
    expect(formatChance(prizeChances([start]).pirateShop)).toBe('2.87%');
    expect(prizeChances([start])).toEqual(
      prizeChances([open(999), open(999), open(999), open(999), open(4)])
    );
  });

  it('matches P = 1 - prod(1 - m*p)^n over mixed records', () => {
    const records = [
      open(10),
      treasure(7, { pirateShop: 3, goldOutfit: 1, vehicleDecal: 100 }),
      { kind: 'start', at: 1, n: 50 } as const,
    ];
    const naive = (p: number, mOf: (r: TallyRecord) => number) => {
      let miss = 1;
      for (const r of records) miss *= (1 - mOf(r) * p) ** r.n;
      return (1 - miss) * 100;
    };
    const got = prizeChances(records);
    expect(got.vehicleDecal).toBeCloseTo(
      naive(1 / 7813, (r) =>
        r.kind === 'treasure' ? r.boost.vehicleDecal : 1
      ),
      9
    );
    expect(got.gizmo).toBeCloseTo(
      naive(1 / 127, () => 1),
      9
    );
  });
});

describe('whatIfChances（S-64 "open N more chests"）', () => {
  const whatIf = (n: number, boost: typeof DEFAULT_BOOST | null) =>
    Object.fromEntries(
      Object.entries(whatIfChances(n, boost)).map(([k, v]) => [
        k,
        formatChance(v),
      ])
    );

  it('N=100 Standard: all seven tiers match the acceptance scenario', () => {
    expect(whatIf(100, null)).toEqual({
      goldOutfit: '0.006%',
      pirateShop: '0.073%',
      vehicleDecal: '1.27%',
      pickaxeBackbling: '16.2%',
      jamTrack: '22.6%',
      loadingScreen: '30.8%',
      gizmo: '54.6%',
    });
  });

  it('N=500 Standard, Pirate Shop Access is 0.363%', () => {
    expect(whatIf(500, null).pirateShop).toBe('0.363%');
  });

  it('N=100 Treasure Hours default multipliers: only three tiers are boosted', () => {
    expect(whatIf(100, DEFAULT_BOOST)).toEqual({
      goldOutfit: '0.048%',
      pirateShop: '0.109%',
      vehicleDecal: '12.0%',
      pickaxeBackbling: '16.2%',
      jamTrack: '22.6%',
      loadingScreen: '30.8%',
      gizmo: '54.6%',
    });
    expect(whatIf(500, DEFAULT_BOOST)).toMatchObject({
      pirateShop: '0.544%',
      vehicleDecal: '47.3%',
    });
  });

  it('matches the per-tier formula 1-(1-m/odds)^N and does not depend on chests already opened (only N and multipliers)', () => {
    for (const p of PRIZES) {
      const m = p.boostKey ? DEFAULT_BOOST[p.boostKey] : 1;
      const direct = (1 - (1 - m / p.odds) ** 100) * 100;
      expect(whatIfChances(100, DEFAULT_BOOST)[p.id]).toBeCloseTo(direct, 9);
    }
  });

  it('every tier is 0% when N is 0', () => {
    expect(Object.values(whatIf(0, null))).toEqual(Array(7).fill('0%'));
  });
});
