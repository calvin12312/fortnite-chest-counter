import {
  isValidBoost,
  MAX_START_N,
  sameBoost,
  type Summary,
  type TallyAction,
  type TallyDoc,
  type TallyRecord,
  type TallyView,
} from './types';

const MILESTONES = [100, 500, 1000, 5000] as const;

/** Local date key for the time zone of now */
export function localDateKey(d: Date): string {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function totalOf(records: readonly TallyRecord[]): number {
  let sum = 0;
  for (const r of records) sum += r.n;
  return sum;
}

/** Today's local date key when the doc is in Treasure Hours but was switched on another day. */
export function isStaleTreasureHours(doc: TallyDoc, now: Date): boolean {
  return doc.mode === 'treasureHours' && doc.modeOn !== localDateKey(now);
}

/**
 * Treasure Hours lasts one local day. A doc that is in Treasure Hours with a `modeOn` that is
 * not today (or missing) goes back to Standard. Returns the same object when nothing changes.
 */
export function rollMode(doc: TallyDoc, now: Date): TallyDoc {
  if (!isStaleTreasureHours(doc, now)) return doc;
  const { modeOn: _modeOn, ...rest } = doc;
  return { ...rest, mode: 'standard' };
}

export function reduce(
  doc: TallyDoc,
  action: TallyAction,
  now: Date
): TallyDoc {
  const at = Math.floor(now.getTime() / 1000);
  switch (action.type) {
    case 'add': {
      const record: TallyRecord =
        doc.mode === 'treasureHours'
          ? { kind: 'treasure', at, n: action.n, boost: { ...doc.boost } }
          : { kind: 'open', at, n: action.n };
      return { ...doc, records: [...doc.records, record] };
    }
    case 'undo':
      return doc.records.length === 0
        ? doc
        : { ...doc, records: doc.records.slice(0, -1) };
    case 'resetAll':
      return doc.records.length === 0 ? doc : { ...doc, records: [] };
    case 'setTotal': {
      const { total } = action;
      const current = totalOf(doc.records);
      if (!Number.isSafeInteger(total) || total <= current) return doc;
      if (total > MAX_START_N) return doc;
      return {
        ...doc,
        records: [...doc.records, { kind: 'start', at, n: total - current }],
      };
    }
    case 'setMode': {
      if (action.mode === doc.mode) return doc;
      if (action.mode === 'treasureHours') {
        return { ...doc, mode: action.mode, modeOn: localDateKey(now) };
      }
      const { modeOn: _modeOn, ...rest } = doc;
      return { ...rest, mode: action.mode };
    }
    case 'setBoost':
      return !isValidBoost(action.boost) || sameBoost(action.boost, doc.boost)
        ? doc
        : { ...doc, boost: { ...action.boost } };
  }
}

export function deriveView(doc: TallyDoc, now: Date): TallyView {
  const { records } = doc;
  const todayKey = localDateKey(now);
  const perDay = new Map<string, number>();
  let allTime = 0;
  let hasEarlierDays = false;
  for (const r of records) {
    allTime += r.n;
    const key = localDateKey(new Date(r.at * 1000));
    if (key < todayKey) hasEarlierDays = true;
    if (r.kind === 'start') continue; // a starting total belongs to no day
    perDay.set(key, (perDay.get(key) ?? 0) + r.n);
  }
  const today = perDay.get(todayKey) ?? 0;
  let bestDay = today;
  for (const v of perDay.values()) if (v > bestDay) bestDay = v;
  return {
    today,
    bestDay,
    allTime,
    days: perDay.size,
    hasEarlierDays,
    milestones: MILESTONES.map((at) => ({ at, reached: allTime >= at })),
    canUndo: records.length > 0,
    canReset: records.length > 0,
    mode: doc.mode,
    boost: doc.boost,
    records,
    lastRecord: records.at(-1) ?? null,
  };
}

export function summarize(doc: TallyDoc): Summary {
  const days = new Set<string>();
  let allTime = 0;
  for (const r of doc.records) {
    allTime += r.n;
    if (r.kind === 'start') continue;
    days.add(localDateKey(new Date(r.at * 1000)));
  }
  return { allTime, days: days.size };
}
