import {
  DEFAULT_BOOST,
  isValidBoostValue,
  MAX_OPEN_N,
  MAX_START_N,
  type BackupError,
  type Boost,
  type TallyDoc,
  type TallyMode,
  type TallyRecord,
} from './types';

/**
 * Wire format shared by storage and backups; it appears only in this file.
 * v2:
 *   { "app": "chestcounterfn", "v": 2, "mode": "s" | "t", "modeOn"?: "YYYY-MM-DD",
 *     "boost": [pirateShop, goldOutfit, vehicleDecal], "records": [...] }
 * modeOn (optional) is the local date on which Treasure Hours was switched on; it is written and read only when mode is "t".
 * There are three record kinds: normal [at, n]; Treasure Hours [at, n, [pirateShop, goldOutfit, vehicleDecal]]
 * (a snapshot of the multipliers at that time); starting total [at, n, "start"]. Backups add a top-level "exportedAt", which decoding ignores.
 * v missing or not a positive integer → invalidRecord (treated as corrupt); v below current → run MIGRATIONS in order;
 * v above current → newerVersion (read-only). Any future format change must add a migration.
 *
 * v1: { "v": 1, "chest": full name of "s"|"r"|"p"|"o", "records": [[at, n, abbreviation], [at]] }，
 * See MIGRATIONS[1].
 */
export const CURRENT_VERSION = 2;
export const APP_MARK = 'chestcounterfn';
export const MAX_RECORDS = 200_000;
export const MAX_BYTES = 5 * 1024 * 1024;

const isInt = (x: unknown): x is number =>
  typeof x === 'number' && Number.isSafeInteger(x);

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const V1_CHESTS = ['standard', 'rare', 'sprite', 'other'];
const V1_ABBRS = ['s', 'r', 'p', 'o'];

/**
 * v1 → v2: an opening record [at, n, chest] drops the chest type and becomes a normal record [at, n]; new-session separators [at] are dropped;
 * the top-level chest is dropped; mode is standard and boost is the default multipliers.
 * Records or chest values that do not fit the v1 grammar all become null and are rejected by the v2 parser (whole file invalidRecord),
 * so they are never let through for "happening to look like a v2 record".
 */
function v1ToV2(raw: Record<string, unknown>): Record<string, unknown> {
  const { chest, records, ...rest } = raw;
  let migrated: unknown = records;
  if (Array.isArray(records)) {
    migrated = !V1_CHESTS.includes(chest as string)
      ? null
      : records.flatMap((r: unknown) => {
          if (Array.isArray(r) && r.length === 1 && isInt(r[0]) && r[0] >= 0) {
            return []; // old session separator
          }
          if (
            Array.isArray(r) &&
            r.length === 3 &&
            typeof r[2] === 'string' &&
            V1_ABBRS.includes(r[2])
          ) {
            return [[r[0], r[1]]];
          }
          return [null];
        });
  }
  return {
    ...rest,
    v: 2,
    mode: 's',
    boost: boostToWire(DEFAULT_BOOST),
    records: migrated,
  };
}

/** MIGRATIONS[v] upgrades a raw version-v object to v+1 */
export const MIGRATIONS: Record<
  number,
  (raw: Record<string, unknown>) => Record<string, unknown>
> = { 1: v1ToV2 };

const boostToWire = (b: Boost): [number, number, number] => [
  b.pirateShop,
  b.goldOutfit,
  b.vehicleDecal,
];

function boostFromWire(raw: unknown): Boost | null {
  if (!Array.isArray(raw) || raw.length !== 3) return null;
  const [pirateShop, goldOutfit, vehicleDecal] = raw;
  if (
    !isValidBoostValue(pirateShop) ||
    !isValidBoostValue(goldOutfit) ||
    !isValidBoostValue(vehicleDecal)
  ) {
    return null;
  }
  return { pirateShop, goldOutfit, vehicleDecal };
}

export function encode(doc: TallyDoc, opts?: { exportedAt?: Date }): string {
  const records = doc.records.map((r) =>
    r.kind === 'treasure'
      ? [r.at, r.n, boostToWire(r.boost)]
      : r.kind === 'start'
        ? [r.at, r.n, 'start']
        : [r.at, r.n]
  );
  const out: Record<string, unknown> = {
    app: APP_MARK,
    v: CURRENT_VERSION,
    mode: doc.mode === 'treasureHours' ? 't' : 's',
    boost: boostToWire(doc.boost),
    records,
  };
  if (doc.mode === 'treasureHours' && doc.modeOn) out.modeOn = doc.modeOn;
  if (opts?.exportedAt) out.exportedAt = opts.exportedAt.toISOString();
  return JSON.stringify(out);
}

type DecodeResult =
  | { ok: true; doc: TallyDoc; migratedFrom?: number }
  | {
      ok: false;
      error: BackupError | 'newerVersion';
      version?: number;
      detail?: string;
    };

const bad = (detail: string): DecodeResult => ({
  ok: false,
  error: 'invalidRecord',
  detail,
});

function parseRecord(raw: unknown): TallyRecord | null {
  if (!Array.isArray(raw) || raw.length < 2 || raw.length > 3) return null;
  const [at, n, extra] = raw;
  if (!isInt(at) || at < 0 || !isInt(n)) return null;
  if (raw.length === 2) {
    return n >= 1 && n <= MAX_OPEN_N ? { kind: 'open', at, n } : null;
  }
  if (extra === 'start') {
    return n >= 1 && n <= MAX_START_N ? { kind: 'start', at, n } : null;
  }
  const boost = boostFromWire(extra);
  if (boost && n >= 1 && n <= MAX_OPEN_N) {
    return { kind: 'treasure', at, n, boost };
  }
  return null;
}

export function decode(text: string): DecodeResult {
  if (text.length > MAX_BYTES) return { ok: false, error: 'tooLarge' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'notJson' };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'notOurBackup' };
  }
  let obj = parsed as Record<string, unknown>;
  if (obj.app !== APP_MARK) return { ok: false, error: 'notOurBackup' };
  const v = obj.v;
  if (!isInt(v) || v < 1) return bad('missing or invalid version');
  if (v > CURRENT_VERSION)
    return { ok: false, error: 'newerVersion', version: v };
  for (let ver = v; ver < CURRENT_VERSION; ver++) {
    const step = MIGRATIONS[ver];
    if (!step) return bad(`no migration from v${ver}`);
    obj = step(obj);
  }
  const modeWire = obj.mode;
  if (modeWire !== 's' && modeWire !== 't') return bad('invalid mode');
  const mode: TallyMode = modeWire === 't' ? 'treasureHours' : 'standard';
  const rawModeOn = obj.modeOn;
  if (
    rawModeOn !== undefined &&
    !(typeof rawModeOn === 'string' && DATE_KEY.test(rawModeOn))
  ) {
    return bad('invalid modeOn');
  }
  const boost = boostFromWire(obj.boost);
  if (!boost) return bad('invalid boost');
  if (!Array.isArray(obj.records)) return bad('records is not an array');
  if (obj.records.length > MAX_RECORDS) return bad('too many records');
  const records: TallyRecord[] = [];
  for (let i = 0; i < obj.records.length; i++) {
    const r = parseRecord(obj.records[i]);
    if (!r) return bad(`invalid record at index ${i}`);
    records.push(r);
  }
  return {
    ok: true,
    doc: {
      records,
      mode,
      boost,
      ...(mode === 'treasureHours' && typeof rawModeOn === 'string'
        ? { modeOn: rawModeOn }
        : {}),
    },
    ...(v < CURRENT_VERSION ? { migratedFrom: v } : {}),
  };
}
