/** Chest multiplier mode: new records are plain, or carry a Treasure Hours boost snapshot. */
export type TallyMode = 'standard' | 'treasureHours';

/** Treasure Hours multipliers for the three tiers Epic says can be raised. Other tiers stay at 1. */
export interface Boost {
  pirateShop: number;
  goldOutfit: number;
  vehicleDecal: number;
}

/** Epic's default Treasure Hours multipliers (Help Center, checked 2026-11-13). */
export const DEFAULT_BOOST: Boost = {
  pirateShop: 1.5,
  goldOutfit: 7.5,
  vehicleDecal: 10,
};

export const BOOST_MIN = 1;
export const BOOST_MAX = 100;

/** A multiplier is valid when it is 1..100 with at most one decimal place. */
export function isValidBoostValue(x: unknown): x is number {
  if (typeof x !== 'number' || !Number.isFinite(x)) return false;
  if (x < BOOST_MIN || x > BOOST_MAX) return false;
  return Math.abs(x * 10 - Math.round(x * 10)) < 1e-9;
}

export function isValidBoost(b: Boost): boolean {
  return (
    isValidBoostValue(b.pirateShop) &&
    isValidBoostValue(b.goldOutfit) &&
    isValidBoostValue(b.vehicleDecal)
  );
}

export function sameBoost(a: Boost, b: Boost): boolean {
  return (
    a.pirateShop === b.pirateShop &&
    a.goldOutfit === b.goldOutfit &&
    a.vehicleDecal === b.vehicleDecal
  );
}

export const MAX_OPEN_N = 999;
export const MAX_START_N = 99_999_999;

/**
 * One record. Array order is the order things happened; it is never re-sorted by `at`
 * (a device clock change must not scramble Undo).
 * - open: a standard batch of 1..999 chests (multiplier 1)
 * - treasure: a Treasure Hours batch of 1..999 chests with the boost that was current then
 * - start: the "my total so far" entry, 1..99,999,999 chests, multiplier 1
 */
export type TallyRecord =
  | { kind: 'open'; at: number /* epoch seconds */; n: number }
  | { kind: 'treasure'; at: number; n: number; boost: Boost }
  | { kind: 'start'; at: number; n: number };

export interface TallyDoc {
  records: readonly TallyRecord[];
  mode: TallyMode; // what the next `add` records
  boost: Boost; // Treasure Hours multipliers for the next `add`
  /**
   * Local date `YYYY-MM-DD` on which `mode` was switched to Treasure Hours. Treasure Hours
   * does not carry over: once this is not today the mode falls back to Standard (rollMode).
   * Absent in Standard mode.
   */
  modeOn?: string;
}

export type TallyAction =
  | { type: 'add'; n: number } // n already validated by the UI as an integer 1..999
  | { type: 'undo' } // drop the last record of any kind; no-op when empty
  | { type: 'resetAll' } // clear every record, keep mode and boost; no-op when already empty
  | { type: 'setTotal'; total: number } // integer > All time and <= 99,999,999, else no-op
  | { type: 'setMode'; mode: TallyMode }
  | { type: 'setBoost'; boost: Boost }; // invalid boost is a no-op

export interface TallyView {
  today: number;
  bestDay: number; // includes today; 0 with no records
  allTime: number; // includes start records
  days: number; // dates with a counted batch; start records do not count
  /** Any record, start totals included, was written on an earlier local date than today. */
  hasEarlierDays: boolean;
  milestones: readonly { at: 100 | 500 | 1000 | 5000; reached: boolean }[];
  canUndo: boolean; // any record
  canReset: boolean; // any record
  mode: TallyMode;
  boost: Boost;
  /** Same array as the document's records, for the prize odds table. */
  records: readonly TallyRecord[];
  /** The record Undo would remove, for the announcement. */
  lastRecord: TallyRecord | null;
}

export type StorageStatus =
  | { state: 'ok' }
  | { state: 'unavailable' }
  | { state: 'writeFailed' }
  | { state: 'corrupt'; raw: string; preserved: boolean }
  | { state: 'newerVersion'; version: number };

export type BackupError =
  | 'notJson'
  | 'notOurBackup'
  | 'unsupportedVersion'
  | 'invalidRecord'
  | 'tooLarge';

export interface Summary {
  allTime: number;
  days: number;
}

export type ParsedBackup =
  | {
      ok: true;
      backup: TallyDoc;
      preview: { current: Summary; incoming: Summary };
    }
  | { ok: false; error: BackupError; detail?: string };
