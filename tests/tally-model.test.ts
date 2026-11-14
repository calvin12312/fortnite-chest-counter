import {
  deriveView,
  isStaleTreasureHours,
  reduce,
  rollMode,
  summarize,
} from '@/tally/model';
import {
  DEFAULT_BOOST,
  type TallyAction,
  type TallyDoc,
  type TallyRecord,
} from '@/tally/types';
import { describe, expect, it } from 'vitest';

const at = (s: string) => new Date(s);
const sec = (s: string) => Math.floor(at(s).getTime() / 1000);
const empty: TallyDoc = {
  records: [],
  mode: 'standard',
  boost: DEFAULT_BOOST,
};
const NOW = at('2026-11-12T10:00:00');

const open = (iso: string, n: number): TallyRecord => ({
  kind: 'open',
  at: sec(iso),
  n,
});
const start = (iso: string, n: number): TallyRecord => ({
  kind: 'start',
  at: sec(iso),
  n,
});
const docOf = (...records: TallyRecord[]): TallyDoc => ({ ...empty, records });

function run(doc: TallyDoc, ...actions: TallyAction[]) {
  return actions.reduce((d, a) => reduce(d, a, NOW), doc);
}

describe('tally model', () => {
  it('S-01: a single +1 counts toward today and the cumulative total, Best unchanged', () => {
    // Build 128 / 246 / 1024: lay down history first, then today
    const d = docOf(
      open('2026-11-08T12:00:00', 220),
      open('2026-11-09T12:00:00', 220),
      open('2026-11-10T12:00:00', 210),
      open('2026-11-11T12:00:00', 246),
      open('2026-11-12T08:30:00', 86),
      open('2026-11-12T09:00:00', 42)
    );
    const before = deriveView(d, NOW);
    expect([before.allTime, before.today, before.bestDay]).toEqual([
      1024, 128, 246,
    ]);
    const after = deriveView(run(d, { type: 'add', n: 1 }), NOW);
    expect([after.allTime, after.today, after.bestDay]).toEqual([
      1025, 129, 246,
    ]);
  });

  it('add creates records by current mode: standard is a normal record, treasureHours carries a multiplier snapshot', () => {
    const std = run(empty, { type: 'add', n: 2 });
    expect(std.records).toEqual([
      { kind: 'open', at: Math.floor(NOW.getTime() / 1000), n: 2 },
    ]);
    const th = run(
      empty,
      { type: 'setMode', mode: 'treasureHours' },
      { type: 'add', n: 3 }
    );
    expect(th.records).toEqual([
      {
        kind: 'treasure',
        at: Math.floor(NOW.getTime() / 1000),
        n: 3,
        boost: DEFAULT_BOOST,
      },
    ]);
  });

  it('setBoost only affects later records; old records keep their snapshot', () => {
    const doc = run(
      empty,
      { type: 'setMode', mode: 'treasureHours' },
      { type: 'add', n: 100 },
      { type: 'setBoost', boost: { ...DEFAULT_BOOST, pirateShop: 2 } },
      { type: 'add', n: 1 }
    );
    expect(
      doc.records.map((r) => r.kind === 'treasure' && r.boost.pirateShop)
    ).toEqual([1.5, 2]);
    expect(doc.boost).toEqual({ ...DEFAULT_BOOST, pirateShop: 2 });
  });

  it('the snapshot and doc.boost do not share a reference', () => {
    const doc = run(
      empty,
      { type: 'setMode', mode: 'treasureHours' },
      { type: 'add', n: 1 }
    );
    const rec = doc.records[0];
    expect(rec.kind === 'treasure' && rec.boost).not.toBe(doc.boost);
  });

  it('setMode / setBoost with the same or an invalid value is a no-op (returns the same document)', () => {
    expect(run(empty, { type: 'setMode', mode: 'standard' })).toBe(empty);
    expect(run(empty, { type: 'setBoost', boost: { ...DEFAULT_BOOST } })).toBe(
      empty
    );
    for (const bad of [0, 0.9, 101, 1.25, Number.NaN, Infinity]) {
      expect(
        run(empty, {
          type: 'setBoost',
          boost: { ...DEFAULT_BOOST, goldOutfit: bad },
        })
      ).toBe(empty);
    }
  });

  it('S-03: undo a batch as a whole', () => {
    const base = run(empty, { type: 'add', n: 42 });
    const withBatch = run(base, { type: 'add', n: 5 });
    expect(deriveView(withBatch, NOW).allTime).toBe(47);
    const undone = run(withBatch, { type: 'undo' });
    const v = deriveView(undone, NOW);
    expect([v.today, v.allTime]).toEqual([42, 42]);
  });

  it('undo can revert all three record kinds; lastRecord is the record Undo will revert', () => {
    const doc = run(
      empty,
      { type: 'setTotal', total: 100 },
      { type: 'add', n: 2 },
      { type: 'setMode', mode: 'treasureHours' },
      { type: 'add', n: 3 }
    );
    expect(doc.records.map((r) => r.kind)).toEqual([
      'start',
      'open',
      'treasure',
    ]);
    expect(deriveView(doc, NOW).lastRecord).toMatchObject({
      kind: 'treasure',
      n: 3,
    });
    const u1 = run(doc, { type: 'undo' });
    expect(deriveView(u1, NOW).lastRecord).toMatchObject({
      kind: 'open',
      n: 2,
    });
    const u2 = run(u1, { type: 'undo' });
    expect(deriveView(u2, NOW).lastRecord).toMatchObject({
      kind: 'start',
      n: 100,
    });
    const u3 = run(u2, { type: 'undo' });
    expect(u3.records).toEqual([]);
    expect(deriveView(u3, NOW).lastRecord).toBeNull();
  });

  it('resetAll clears records and keeps mode and boost; it is a no-op when already empty', () => {
    const boost = { ...DEFAULT_BOOST, vehicleDecal: 12.5 };
    const doc = run(
      empty,
      { type: 'setMode', mode: 'treasureHours' },
      { type: 'setBoost', boost },
      { type: 'add', n: 5 }
    );
    const cleared = run(doc, { type: 'resetAll' });
    expect(cleared).toEqual({
      records: [],
      mode: 'treasureHours',
      modeOn: '2026-11-12',
      boost,
    });
    const v = deriveView(cleared, NOW);
    expect([v.allTime, v.today, v.bestDay, v.canUndo, v.canReset]).toEqual([
      0,
      0,
      0,
      false,
      false,
    ]);
    expect(run(cleared, { type: 'resetAll' })).toBe(cleared);
    expect(run(empty, { type: 'resetAll' })).toBe(empty);
  });

  it('S-07: 11-11 246 + 11-12 30 → Today 30 / Best 246 / All 276', () => {
    const doc = docOf(
      open('2026-11-11T20:00:00', 246),
      open('2026-11-12T09:00:00', 30)
    );
    const v = deriveView(doc, NOW);
    expect([v.today, v.bestDay, v.allTime]).toEqual([30, 246, 276]);
    expect(summarize(doc)).toEqual({ allTime: 276, days: 2 });
  });

  it('S-08: the 100 / 500 / 1000 / 5000 milestones light up by All time', () => {
    const at = (n: number) =>
      deriveView(run(empty, { type: 'add', n }), NOW).milestones;
    expect(at(99).map((x) => x.reached)).toEqual([false, false, false, false]);
    expect(at(100)).toEqual([
      { at: 100, reached: true },
      { at: 500, reached: false },
      { at: 1000, reached: false },
      { at: 5000, reached: false },
    ]);
    const big = run(
      empty,
      { type: 'add', n: 999 },
      { type: 'add', n: 1 },
      { type: 'add', n: 1 }
    );
    expect(deriveView(big, NOW).milestones.map((x) => x.reached)).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it('undo is a no-op and canUndo=false when there are no records', () => {
    expect(run(empty, { type: 'undo' })).toBe(empty);
    expect(deriveView(empty, NOW).canUndo).toBe(false);
  });

  it('reduce does not mutate its input', () => {
    const doc = run(empty, { type: 'add', n: 1 });
    const snapshot = JSON.stringify(doc);
    run(
      doc,
      { type: 'add', n: 3 },
      { type: 'setTotal', total: 50 },
      { type: 'setMode', mode: 'treasureHours' },
      { type: 'setBoost', boost: { ...DEFAULT_BOOST, goldOutfit: 9 } },
      { type: 'undo' },
      { type: 'resetAll' }
    );
    expect(JSON.stringify(doc)).toBe(snapshot);
  });

  it('S-41: Today resets across local midnight, Best unchanged', () => {
    const doc = docOf(open('2026-11-12T09:00:00', 30));
    const before = deriveView(doc, at('2026-11-12T23:59:00'));
    const after = deriveView(doc, at('2026-11-13T00:01:00'));
    expect(before.today).toBe(30);
    expect(after.today).toBe(0);
    expect(after.bestDay).toBe(30);
  });
});

describe('tally model: setTotal and starting-total records (S-57)', () => {
  it('appends a starting-total record with n = T - All time', () => {
    const base = docOf(open('2026-11-12T08:00:00', 250));
    const doc = run(base, { type: 'setTotal', total: 4000 });
    expect(doc.records).toHaveLength(2);
    expect(doc.records[1]).toEqual({
      kind: 'start',
      at: Math.floor(NOW.getTime() / 1000),
      n: 3750,
    });
    expect(deriveView(doc, NOW).allTime).toBe(4000);
  });

  it('a no-op when T is not above All time, not an integer, or over 8 digits', () => {
    const base = docOf(open('2026-11-12T08:00:00', 250));
    for (const total of [250, 200, 0, -5, 250.5, Number.NaN, 100_000_000]) {
      expect(run(base, { type: 'setTotal', total })).toBe(base);
    }
    expect(run(empty, { type: 'setTotal', total: 0 })).toBe(empty);
    // the 8-digit limit itself is allowed
    expect(
      deriveView(run(empty, { type: 'setTotal', total: 99_999_999 }), NOW)
        .allTime
    ).toBe(99_999_999);
  });

  it('the starting total counts toward All time and milestones, not Today, Best day or days', () => {
    const doc = run(empty, { type: 'setTotal', total: 4000 });
    const v = deriveView(doc, NOW);
    expect([v.allTime, v.today, v.bestDay, v.days]).toEqual([4000, 0, 0, 0]);
    expect(v.milestones.map((x) => x.reached)).toEqual([
      true,
      true,
      true,
      false,
    ]);
    expect(summarize(doc)).toEqual({ allTime: 4000, days: 0 });
  });

  it('+1 after a starting total: Today 1, All time 4001; two Undos return to empty', () => {
    const doc = run(
      empty,
      { type: 'setTotal', total: 4000 },
      { type: 'add', n: 1 }
    );
    const v = deriveView(doc, NOW);
    expect([v.allTime, v.today, v.bestDay, v.days]).toEqual([4001, 1, 1, 1]);
    const u1 = run(doc, { type: 'undo' });
    expect(deriveView(u1, NOW).allTime).toBe(4000);
    expect(deriveView(run(u1, { type: 'undo' }), NOW).allTime).toBe(0);
  });

  it('a starting total does not raise Best day: only normal records on the same day count toward that day', () => {
    const doc = docOf(
      start('2026-11-12T09:00:00', 5000),
      open('2026-11-12T09:10:00', 7)
    );
    const v = deriveView(doc, NOW);
    expect([v.today, v.bestDay, v.allTime, v.days]).toEqual([7, 7, 5007, 1]);
    expect(summarize(doc)).toEqual({ allTime: 5007, days: 1 });
  });

  it('a second setTotal tops up from the current All time (including existing starting totals)', () => {
    const doc = run(
      empty,
      { type: 'setTotal', total: 1000 },
      { type: 'add', n: 5 },
      { type: 'setTotal', total: 1500 }
    );
    expect(doc.records.map((r) => r.n)).toEqual([1000, 5, 495]);
    expect(deriveView(doc, NOW).allTime).toBe(1500);
  });

  describe('Treasure Hours valid for the day (S-63)', () => {
    const TH_TODAY: TallyDoc = {
      ...empty,
      mode: 'treasureHours',
      modeOn: '2026-11-12',
    };
    const TH_YESTERDAY: TallyDoc = { ...TH_TODAY, modeOn: '2026-11-11' };

    it('switching to Treasure Hours records the local date, and switching back to Standard clears it', () => {
      const th = run(empty, { type: 'setMode', mode: 'treasureHours' });
      expect(th).toMatchObject({ mode: 'treasureHours', modeOn: '2026-11-12' });
      const back = run(th, { type: 'setMode', mode: 'standard' });
      expect(back.mode).toBe('standard');
      expect('modeOn' in back).toBe(false);
      // the same mode is a no-op and does not change modeOn
      expect(run(th, { type: 'setMode', mode: 'treasureHours' })).toBe(th);
    });

    it('modeOn is a local date: switched at local 23:59, expired by 00:01 the next day', () => {
      const late = at('2026-11-12T23:59:00');
      const th = reduce(
        empty,
        { type: 'setMode', mode: 'treasureHours' },
        late
      );
      expect(th.modeOn).toBe('2026-11-12');
      expect(isStaleTreasureHours(th, at('2026-11-12T23:59:30'))).toBe(false);
      expect(isStaleTreasureHours(th, at('2026-11-13T00:01:00'))).toBe(true);
    });

    it('rollMode: Treasure Hours of today and Standard return the same object unchanged', () => {
      expect(rollMode(TH_TODAY, NOW)).toBe(TH_TODAY);
      expect(rollMode(empty, NOW)).toBe(empty);
    });

    it('rollMode: modeOn of yesterday, earlier or missing all switch back to Standard and drop modeOn, the rest unchanged', () => {
      const withRecords: TallyDoc = {
        ...TH_YESTERDAY,
        boost: { ...DEFAULT_BOOST, pirateShop: 2 },
        records: [open('2026-11-11T09:00:00', 3)],
      };
      const rolled = rollMode(withRecords, NOW);
      expect(rolled).toEqual({
        mode: 'standard',
        boost: { ...DEFAULT_BOOST, pirateShop: 2 },
        records: withRecords.records,
      });
      expect('modeOn' in rolled).toBe(false);
      expect(rollMode({ ...TH_TODAY, modeOn: '2026-11-01' }, NOW).mode).toBe(
        'standard'
      );
      const { modeOn: _drop, ...noStamp } = TH_TODAY;
      expect(rollMode(noStamp, NOW).mode).toBe('standard');
    });

    it('the next add after returning to Standard is a normal record', () => {
      const next = run(rollMode(TH_YESTERDAY, NOW), { type: 'add', n: 1 });
      expect(next.records.at(-1)).toMatchObject({ kind: 'open', n: 1 });
    });
  });

  it('hasEarlierDays: true only if there is a record earlier than the local date of today (including starting totals)', () => {
    expect(deriveView(empty, NOW).hasEarlierDays).toBe(false);
    expect(
      deriveView(docOf(open('2026-11-12T08:00:00', 5)), NOW).hasEarlierDays
    ).toBe(false);
    expect(
      deriveView(
        docOf(open('2026-11-11T23:30:00', 5), open('2026-11-12T08:00:00', 1)),
        NOW
      ).hasEarlierDays
    ).toBe(true);
    expect(
      deriveView(docOf(start('2026-11-10T08:00:00', 100)), NOW).hasEarlierDays
    ).toBe(true);
  });
});
