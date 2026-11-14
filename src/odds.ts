/** Fortnite chest prize odds. Pure functions, no I/O. */

import type { Boost, TallyRecord } from './tally/types';

/** 1 : 137,500 per chest opened in a normal match (Epic Games Help Center). */
export const BASE_ODDS = 137_500;
/** The calculator's drop-rate switch. Treasure Hours uses the counter's current Pirate Shop boost. */
export type RateId = 'standard' | 'treasureHours';
export const REFERENCE_CHANCES = [0.5, 0.75, 0.9, 0.99] as const;
export const SOURCE = {
  url: 'https://www.epicgames.com/help/fortnite-battle-royale-c-34254770/gameplay-c-33726977/what-are-the-drop-rates-of-treasure-in-chests-in-fortnite-battle-royale-s-pirate-treasure-event-a14361627',
} as const;

export type PrizeId =
  | 'goldOutfit'
  | 'pirateShop'
  | 'vehicleDecal'
  | 'pickaxeBackbling'
  | 'jamTrack'
  | 'loadingScreen'
  | 'gizmo';

export interface Prize {
  id: PrizeId;
  /** Normal drop rate: 1 in `odds` per chest. */
  odds: number;
  /** Which Boost field raises this tier in Treasure Hours; null = Epic does not raise it (fixed at 1). */
  boostKey: keyof Boost | null;
}

/** The seven tiers in Epic's order (Help Center, checked 2026-11-13). */
export const PRIZES: readonly Prize[] = [
  { id: 'goldOutfit', odds: 1_562_500, boostKey: 'goldOutfit' },
  { id: 'pirateShop', odds: BASE_ODDS, boostKey: 'pirateShop' },
  { id: 'vehicleDecal', odds: 7_813, boostKey: 'vehicleDecal' },
  { id: 'pickaxeBackbling', odds: 568, boostKey: null },
  { id: 'jamTrack', odds: 391, boostKey: null },
  { id: 'loadingScreen', odds: 272, boostKey: null },
  { id: 'gizmo', odds: 127, boostKey: null },
];

/** 1 - (1 - m/odds)^n as a percentage (0-100), for a multiplier m. n <= 0 returns 0. */
export function chanceAtLeastOne(n: number, multiplier = 1): number {
  if (!(n > 0)) return 0;
  return -Math.expm1(n * Math.log1p(-multiplier / BASE_ODDS)) * 100;
}

/** Smallest chest count whose at-least-one chance reaches q, q in (0, 1). */
export function chestsForChance(q: number, multiplier = 1): number {
  return Math.ceil(Math.log1p(-q) / Math.log1p(-multiplier / BASE_ODDS));
}

/**
 * Chance of getting each prize at least once over every record:
 * P = 1 - prod(1 - m*p)^n. m is 1 for standard and start records, and the snapshot's
 * boost for Treasure Hours records (1 for tiers Epic does not raise).
 */
export function prizeChances(
  records: readonly TallyRecord[]
): Record<PrizeId, number> {
  const out = {} as Record<PrizeId, number>;
  for (const prize of PRIZES) {
    const p = 1 / prize.odds;
    let logMiss = 0;
    for (const r of records) {
      const m =
        r.kind === 'treasure' && prize.boostKey ? r.boost[prize.boostKey] : 1;
      logMiss += r.n * Math.log1p(-Math.min(m * p, 1));
    }
    const pct = -Math.expm1(logMiss) * 100;
    out[prize.id] = pct > 0 ? pct : 0;
  }
  return out;
}

/**
 * "What if I open `n` more": chance of at least one of each prize over `n` fresh chests,
 * P = 1 - (1 - m*p)^n. Standard when `boost` is null, otherwise at that Treasure Hours boost.
 */
export function whatIfChances(
  n: number,
  boost: Boost | null
): Record<PrizeId, number> {
  return prizeChances([
    boost ? { kind: 'treasure', at: 0, n, boost } : { kind: 'open', at: 0, n },
  ]);
}

/** Display string for a percentage; never rounds a non-zero chance to 0% or 100%. */
export function formatChance(pct: number): string {
  if (pct <= 0) return '0%';
  if (pct < 0.001) return '<0.001%';
  if (pct >= 99.99) return '>99.99%';
  if (pct < 1) return `${pct.toFixed(3)}%`;
  if (pct < 10) return `${pct.toFixed(2)}%`;
  return `${Math.min(pct, 99.9).toFixed(1)}%`; // 99.95-99.99 must not round up to 100.0%
}
