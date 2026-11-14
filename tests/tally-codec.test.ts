import {
  decode,
  encode,
  MAX_RECORDS,
} from '@/tally/codec';
import {
  DEFAULT_BOOST,
  type TallyDoc,
} from '@/tally/types';
import { describe, expect, it } from 'vitest';

const BOOST = { pirateShop: 2, goldOutfit: 7.5, vehicleDecal: 10 };
const doc: TallyDoc = {
  mode: 'treasureHours',
  boost: BOOST,
  records: [
    { kind: 'start', at: 1762934000, n: 4000 },
    { kind: 'open', at: 1762934400, n: 1 },
    { kind: 'open', at: 1762934460, n: 5 },
    {
      kind: 'treasure',
      at: 1762934470,
      n: 2,
      boost: { pirateShop: 1.5, goldOutfit: 7.5, vehicleDecal: 10 },
    },
  ],
};
const wire = (o: object) =>
  JSON.stringify({
    app: 'chestcounterfn',
    v: 2,
    mode: 's',
    boost: [1.5, 7.5, 10],
    records: [],
    ...o,
  });
const wireV1 = (o: object) =>
  JSON.stringify({
    app: 'chestcounterfn',
    v: 1,
    chest: 'standard',
    records: [],
    ...o,
  });
const err = (text: string) => {
  const r = decode(text);
  if (r.ok) throw new Error('expected failure');
  return r.error;
};

describe('tally codec v2 modeOn (Treasure Hours valid for the day)', () => {
  it('Treasure Hours is written with modeOn and read back unchanged; the wire format is still v2', () => {
    const d: TallyDoc = { ...doc, modeOn: '2026-11-12' };
    const out = JSON.parse(encode(d));
    expect(out).toMatchObject({ v: 2, mode: 't', modeOn: '2026-11-12' });
    const back = decode(encode(d));
    expect(back.ok && back.doc.modeOn).toBe('2026-11-12');
    expect(back.ok && back.migratedFrom).toBeUndefined();
  });

  it('Standard does not write modeOn; an extra modeOn in a save is ignored under Standard', () => {
    expect('modeOn' in JSON.parse(encode({ ...doc, mode: 'standard' }))).toBe(
      false
    );
    const r = decode(wire({ mode: 's', modeOn: '2026-11-12' }));
    expect(r.ok && 'modeOn' in r.doc).toBe(false);
  });

  it('a v2 without modeOn (optional field) still decodes, with modeOn empty', () => {
    const r = decode(wire({ mode: 't' }));
    expect(r.ok && r.doc.mode).toBe('treasureHours');
    expect(r.ok && r.doc.modeOn).toBeUndefined();
  });

  it('modeOn is not a YYYY-MM-DD string → invalidRecord', () => {
    for (const bad of ['yesterday', '2026-1-2', 20261112, null, '']) {
      expect(err(wire({ mode: 't', modeOn: bad })), String(bad)).toBe(
        'invalidRecord'
      );
    }
  });
});

describe('tally codec v2', () => {
  it('uses the compact wire format: normal [at,n], Treasure Hours [at,n,[multipliers]], starting total [at,n,"start"]', () => {
    expect(JSON.parse(encode(doc))).toEqual({
      app: 'chestcounterfn',
      v: 2,
      mode: 't',
      boost: [2, 7.5, 10],
      records: [
        [1762934000, 4000, 'start'],
        [1762934400, 1],
        [1762934460, 5],
        [1762934470, 2, [1.5, 7.5, 10]],
      ],
    });
  });

  it('encode(decode(x)) round-trips, also when mode is s', () => {
    const text = encode(doc);
    const r = decode(text);
    expect(r.ok && r.doc).toEqual(doc);
    expect(r.ok && encode(r.doc)).toBe(text);
    const std: TallyDoc = { ...doc, mode: 'standard' };
    expect(JSON.parse(encode(std)).mode).toBe('s');
    expect(decode(encode(std))).toMatchObject({ ok: true, doc: std });
  });

  it('a backup carries exportedAt, which decoding ignores', () => {
    const text = encode(doc, { exportedAt: new Date('2026-11-12T10:00:00Z') });
    expect(JSON.parse(text).exportedAt).toBe('2026-11-12T10:00:00.000Z');
    const r = decode(text);
    expect(r.ok && r.doc).toEqual(doc);
  });

  it('not JSON → notJson', () => expect(err('{oops')).toBe('notJson'));
  it('missing app marker or not an object → notOurBackup', () => {
    expect(err(JSON.stringify({ v: 2, mode: 's', records: [] }))).toBe(
      'notOurBackup'
    );
    expect(err('[1,2]')).toBe('notOurBackup');
    expect(err('null')).toBe('notOurBackup');
  });
  it('v=3 → newerVersion with the version number', () => {
    const r = decode(wire({ v: 3 }));
    expect(r).toEqual({ ok: false, error: 'newerVersion', version: 3 });
  });
  it('v missing or invalid → invalidRecord', () => {
    expect(
      err(
        JSON.stringify({
          app: 'chestcounterfn',
          mode: 's',
          boost: [1.5, 7.5, 10],
          records: [],
        })
      )
    ).toBe('invalidRecord');
    expect(err(wire({ v: 0 }))).toBe('invalidRecord');
    expect(err(wire({ v: '2' }))).toBe('invalidRecord');
  });
  it.each([
    ['n=0', [[1, 0]]],
    ['n=1000', [[1, 1000]]],
    ['n not an integer', [[1, 1.5]]],
    ['at negative', [[-1, 1]]],
    ['at not an integer', [[1.5, 1]]],
    ['length 1 (old session separator no longer valid)', [[1]]],
    ['length 4', [[1, 2, 'start', 3]]],
    ['not an array', ['abc']],
    ['old chest abbreviation', [[1, 1, 's']]],
    ['starting total n=0', [[1, 0, 'start']]],
    ['starting total n=100,000,000', [[1, 100_000_000, 'start']]],
    ['Treasure Hours n=1000', [[1, 1000, [1.5, 7.5, 10]]]],
    ['multiplier 0.9 (below 1)', [[1, 1, [0.9, 7.5, 10]]]],
    ['multiplier 101 (above 100)', [[1, 1, [1.5, 101, 10]]]],
    ['multiplier 1.25 (two decimals)', [[1, 1, [1.25, 7.5, 10]]]],
    ['multiplier is not a number', [[1, 1, ['1.5', 7.5, 10]]]],
    ['multiplier has only two entries', [[1, 1, [1.5, 7.5]]]],
  ])('invalid record %s → invalidRecord, whole file rejected', (_n, records) => {
    expect(err(wire({ records: [[1, 1], ...records] }))).toBe('invalidRecord');
  });
  it('boundary values decode: n=999, starting total 99,999,999, multipliers 1 and 100, one decimal', () => {
    const r = decode(
      wire({
        boost: [1, 100, 99.9],
        records: [
          [1, 999],
          [2, 99_999_999, 'start'],
          [3, 999, [1, 100, 12.3]],
        ],
      })
    );
    expect(r.ok).toBe(true);
  });
  it('invalid mode / boost → invalidRecord', () => {
    expect(err(wire({ mode: 'x' }))).toBe('invalidRecord');
    expect(err(wire({ mode: undefined }))).toBe('invalidRecord');
    expect(err(wire({ boost: [1.5, 7.5] }))).toBe('invalidRecord');
    expect(err(wire({ boost: [0, 7.5, 10] }))).toBe('invalidRecord');
    expect(err(wire({ boost: undefined }))).toBe('invalidRecord');
  });
  it('records not an array → invalidRecord', () =>
    expect(err(wire({ records: {} }))).toBe('invalidRecord'));
  it('more than 200,000 entries → invalidRecord, exactly 200,000 decodes', () => {
    const mk = (n: number) =>
      wire({ records: Array.from({ length: n }, () => [1, 1]) });
    expect(err(mk(MAX_RECORDS + 1))).toBe('invalidRecord');
    expect(decode(mk(MAX_RECORDS)).ok).toBe(true);
  });
  it('over 5 MB → tooLarge, before JSON parsing', () => {
    expect(err('x'.repeat(5 * 1024 * 1024 + 1))).toBe('tooLarge');
  });
});

describe('tally codec v1 → v2 migration (S-58)', () => {
  it('opening records drop the chest type and become normal records, session separators are dropped, mode=standard, boost=default', () => {
    const r = decode(
      wireV1({
        chest: 'rare',
        records: [
          [1762934400, 30, 's'],
          [1762934460, 8, 'r'],
          [1762934470, 3, 'p'],
          [1762934480, 1, 'o'],
          [1762935000],
        ],
      })
    );
    expect(r).toEqual({
      ok: true,
      migratedFrom: 1,
      doc: {
        mode: 'standard',
        boost: DEFAULT_BOOST,
        records: [
          { kind: 'open', at: 1762934400, n: 30 },
          { kind: 'open', at: 1762934460, n: 8 },
          { kind: 'open', at: 1762934470, n: 3 },
          { kind: 'open', at: 1762934480, n: 1 },
        ],
      },
    });
  });

  it('the migrated result re-encodes as v2 without chest', () => {
    const r = decode(wireV1({ records: [[1, 5, 's'], [2]] }));
    if (!r.ok) throw new Error('decode');
    expect(JSON.parse(encode(r.doc))).toEqual({
      app: 'chestcounterfn',
      v: 2,
      mode: 's',
      boost: [1.5, 7.5, 10],
      records: [[1, 5]],
    });
  });

  it('a v2 document has no migratedFrom', () => {
    const r = decode(wire({}));
    expect(r.ok && r.migratedFrom).toBeUndefined();
  });

  it('exportedAt and unknown top-level fields are ignored', () => {
    const r = decode(wireV1({ exportedAt: '2026-11-12T10:00:00.000Z' }));
    expect(r).toMatchObject({ ok: true, migratedFrom: 1 });
  });

  it.each([
    ['n=0', [[1, 0, 's']]],
    ['n=1000', [[1, 1000, 's']]],
    ['n not an integer', [[1, 1.5, 's']]],
    ['unknown chest abbreviation', [[1, 1, 'x']]],
    ['at negative', [[-1]]],
    ['at not an integer', [[1.5, 1, 's']]],
    ['length 2 (never valid in v1)', [[1, 2]]],
    ['not an array', ['abc']],
    ['"start" in v1 is not a starting total', [[1, 5, 'start']]],
    ['a multiplier array in v1 is invalid', [[1, 1, [1.5, 7.5, 10]]]],
  ])('v1 invalid record %s → invalidRecord, whole file rejected', (_n, records) => {
    expect(err(wireV1({ records: [[1, 1, 's'], ...records] }))).toBe(
      'invalidRecord'
    );
  });

  it('v1 invalid chest → invalidRecord', () =>
    expect(err(wireV1({ chest: 'gold' }))).toBe('invalidRecord'));
  it('v1 missing chest → invalidRecord', () =>
    expect(err(wireV1({ chest: undefined }))).toBe('invalidRecord'));
  it('v1 records not an array → invalidRecord', () =>
    expect(err(wireV1({ records: {} }))).toBe('invalidRecord'));
});
