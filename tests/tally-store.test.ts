import { encode } from '@/tally/codec';
import {
  CORRUPT_KEY,
  createTallyStore,
  STORAGE_KEY,
  type StorageLike,
} from '@/tally/store';
import {
  DEFAULT_BOOST,
  type TallyDoc,
} from '@/tally/types';
import { describe, expect, it } from 'vitest';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const s: StorageLike & {
    data: Map<string, string>;
    failSet: boolean;
    failKeys: Set<string>;
  } = {
    data,
    failSet: false,
    failKeys: new Set(),
    getItem: (k) => data.get(k) ?? null,
    setItem(k, v) {
      if (s.failSet || s.failKeys.has(k)) throw new Error('quota');
      data.set(k, v);
    },
    removeItem: (k) => void data.delete(k),
  };
  return s;
}
const clock = (iso: string) => {
  const c = { t: new Date(iso) };
  return { c, now: () => c.t };
};

describe('tally store', () => {
  it('dispatch updates the view, writes to storage and notifies subscribers', () => {
    const storage = memoryStorage();
    const store = createTallyStore({
      storage,
      now: clock('2026-11-12T10:00:00').now,
    });
    let calls = 0;
    const off = store.subscribe(() => calls++);
    store.dispatch({ type: 'add', n: 5 });
    expect(store.view().today).toBe(5);
    expect(storage.data.has(STORAGE_KEY)).toBe(true);
    expect(calls).toBe(1);
    off();
    store.dispatch({ type: 'add', n: 1 });
    expect(calls).toBe(1);
  });

  it('view() returns the same reference when nothing changed', () => {
    const store = createTallyStore({
      storage: memoryStorage(),
      now: clock('2026-11-12T10:00:00').now,
    });
    expect(store.view()).toBe(store.view());
  });

  it('a new store reads saved data; storage is re-read before an action (cross-tab merge)', () => {
    const storage = memoryStorage();
    const now = clock('2026-11-12T10:00:00').now;
    const a = createTallyStore({ storage, now });
    const b = createTallyStore({ storage, now });
    a.dispatch({ type: 'add', n: 3 });
    b.dispatch({ type: 'add', n: 4 });
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!).records).toHaveLength(2);
    expect(createTallyStore({ storage, now }).view().allTime).toBe(7);
  });

  it('S-41: an injected clock crossing midnight takes today from 30 to 0', () => {
    const { c, now } = clock('2026-11-12T23:59:00');
    const store = createTallyStore({ storage: memoryStorage(), now });
    store.dispatch({ type: 'add', n: 30 });
    expect(store.view().today).toBe(30);
    c.t = new Date('2026-11-13T00:01:00');
    expect(store.view().today).toBe(0);
    expect(store.view().bestDay).toBe(30);
  });

  it('S-37: corrupt raw text is copied to the corrupt key and the main key is not rewritten', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{not json' });
    const store = createTallyStore({
      storage,
      now: clock('2026-11-12T10:00:00').now,
    });
    expect(store.status()).toEqual({
      state: 'corrupt',
      raw: '{not json',
      preserved: true,
    });
    expect(storage.data.get(CORRUPT_KEY)).toBe('{not json');
    expect(store.downloadRaw().text).toBe('{not json');
    expect(store.view().allTime).toBe(0);
  });

  it('S-37: backup copy fails → preserved:false, actions are rejected, and the main key is written only after startFresh', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: 'garbage' });
    storage.failKeys.add(CORRUPT_KEY);
    const store = createTallyStore({
      storage,
      now: clock('2026-11-12T10:00:00').now,
    });
    expect(store.status()).toMatchObject({
      state: 'corrupt',
      preserved: false,
    });
    store.dispatch({ type: 'add', n: 1 });
    expect(storage.data.get(STORAGE_KEY)).toBe('garbage');
    expect(store.view().allTime).toBe(0);
    store.startFresh();
    expect(store.status()).toEqual({ state: 'ok' });
    store.dispatch({ type: 'add', n: 1 });
    expect(store.view().allTime).toBe(1);
    expect(storage.data.get(STORAGE_KEY)).not.toBe('garbage');
  });

  it('when corrupt and already preserved, startFresh enters the empty state and writing can continue', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: 'garbage' });
    const store = createTallyStore({
      storage,
      now: clock('2026-11-12T10:00:00').now,
    });
    store.startFresh();
    store.dispatch({ type: 'add', n: 2 });
    expect(store.view().allTime).toBe(2);
    expect(storage.data.get(CORRUPT_KEY)).toBe('garbage');
  });

  it('S-38: v=3 save → newerVersion, dispatch is rejected, raw storage is unchanged', () => {
    const raw = JSON.stringify({
      app: 'chestcounterfn',
      v: 3,
      mode: 's',
      boost: [1.5, 7.5, 10],
      records: [[1, 1]],
    });
    const storage = memoryStorage({ [STORAGE_KEY]: raw });
    const store = createTallyStore({
      storage,
      now: clock('2026-11-12T10:00:00').now,
    });
    expect(store.status()).toEqual({ state: 'newerVersion', version: 3 });
    store.dispatch({ type: 'add', n: 1 });
    store.importBackup({
      records: [],
      mode: 'standard',
      boost: DEFAULT_BOOST,
    });
    expect(storage.data.get(STORAGE_KEY)).toBe(raw);
    expect(store.view().allTime).toBe(0);
  });

  it('storage is null → unavailable, in-memory mode works as usual', () => {
    const store = createTallyStore({
      storage: null,
      now: clock('2026-11-12T10:00:00').now,
    });
    expect(store.status()).toEqual({ state: 'unavailable' });
    store.dispatch({ type: 'add', n: 3 });
    expect(store.view().allTime).toBe(3);
  });

  it('setItem throws: the view advances with writeFailed, and the next action rewrites the whole document', () => {
    const storage = memoryStorage();
    const store = createTallyStore({
      storage,
      now: clock('2026-11-12T10:00:00').now,
    });
    store.dispatch({ type: 'add', n: 1 });
    storage.failSet = true;
    store.dispatch({ type: 'add', n: 2 });
    expect(store.view().allTime).toBe(3);
    expect(store.status()).toEqual({ state: 'writeFailed' });
    store.dispatch({ type: 'add', n: 4 });
    expect(store.view().allTime).toBe(7);
    storage.failSet = false;
    store.dispatch({ type: 'add', n: 5 });
    expect(store.status()).toEqual({ state: 'ok' });
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!).records).toHaveLength(4);
    expect(store.view().allTime).toBe(12);
  });

  it('no-op undo/resetAll does not write storage', () => {
    const storage = memoryStorage();
    const store = createTallyStore({
      storage,
      now: clock('2026-11-12T10:00:00').now,
    });
    store.dispatch({ type: 'undo' });
    store.dispatch({ type: 'resetAll' });
    expect(storage.data.size).toBe(0);
  });

  it('parseBackup gives a preview without changing data; error mapping newerVersion → unsupportedVersion', () => {
    const storage = memoryStorage();
    const store = createTallyStore({
      storage,
      now: clock('2026-11-12T10:00:00').now,
    });
    store.dispatch({ type: 'add', n: 2 });
    const before = storage.data.get(STORAGE_KEY);
    const incoming: TallyDoc = {
      mode: 'standard',
      boost: DEFAULT_BOOST,
      records: [
        { kind: 'open', at: 1762934400, n: 10 },
        {
          kind: 'treasure',
          at: 1763020800,
          n: 5,
          boost: DEFAULT_BOOST,
        },
        { kind: 'start', at: 1763020900, n: 100 },
      ],
    };
    const parsed = store.parseBackup(encode(incoming));
    expect(parsed).toMatchObject({
      ok: true,
      preview: {
        current: { allTime: 2, days: 1 },
        incoming: { allTime: 115, days: 2 }, // the starting total counts toward the cumulative total, not toward days
      },
    });
    expect(storage.data.get(STORAGE_KEY)).toBe(before);
    expect(
      store.parseBackup(JSON.stringify({ app: 'chestcounterfn', v: 3 }))
    ).toMatchObject({
      ok: false,
      error: 'unsupportedVersion',
    });
    expect(store.parseBackup('nope')).toMatchObject({
      ok: false,
      error: 'notJson',
    });
    expect(store.parseBackup('x'.repeat(5 * 1024 * 1024 + 1))).toMatchObject({
      ok: false,
      error: 'tooLarge',
    });
  });

  it('importBackup overwrites the current data as a whole', () => {
    const storage = memoryStorage();
    const store = createTallyStore({
      storage,
      now: clock('2026-11-12T10:00:00').now,
    });
    store.dispatch({ type: 'add', n: 2 });
    const parsed = store.parseBackup(
      encode({
        mode: 'treasureHours',
        modeOn: '2026-11-12',
        boost: { pirateShop: 2, goldOutfit: 8, vehicleDecal: 12 },
        records: [{ kind: 'open', at: 1762934400, n: 9 }],
      })
    );
    if (!parsed.ok) throw new Error('parse');
    store.importBackup(parsed.backup);
    expect(store.view().allTime).toBe(9);
    expect(store.view().mode).toBe('treasureHours');
    expect(store.view().boost).toEqual({
      pirateShop: 2,
      goldOutfit: 8,
      vehicleDecal: 12,
    });
    expect(
      createTallyStore({
        storage,
        now: clock('2026-11-12T10:00:00').now,
      }).view().allTime
    ).toBe(9);
  });

  it('exportBackup uses the local date in the file name, and the content decodes back to the original document', () => {
    const store = createTallyStore({
      storage: memoryStorage(),
      now: clock('2026-11-12T10:00:00').now,
    });
    store.dispatch({ type: 'add', n: 2 });
    const out = store.exportBackup();
    expect(out.filename).toBe('chest-counter-backup-2026-11-12.json');
    expect(store.parseBackup(out.text)).toMatchObject({
      ok: true,
      preview: { incoming: { allTime: 2 } },
    });
  });
});

describe('tally store resetAll', () => {
  it('clearing writes to storage and keeps mode and boost; another instance is also empty after refresh', () => {
    const storage = memoryStorage();
    const { now } = clock('2026-11-12T10:00:00');
    const a = createTallyStore({ storage, now });
    const b = createTallyStore({ storage, now });
    a.dispatch({ type: 'setMode', mode: 'treasureHours' });
    a.dispatch({
      type: 'setBoost',
      boost: { pirateShop: 2, goldOutfit: 7.5, vehicleDecal: 10 },
    });
    a.dispatch({ type: 'add', n: 3 });
    b.refresh();
    expect(b.view().allTime).toBe(3);
    a.dispatch({ type: 'resetAll' });
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!).records).toEqual([]);
    expect(a.view().mode).toBe('treasureHours');
    b.refresh();
    expect([b.view().allTime, b.view().canUndo, b.view().mode]).toEqual([
      0,
      false,
      'treasureHours',
    ]);
    expect(b.view().boost.pirateShop).toBe(2);
  });
});

describe('tally store refresh', () => {
  it('refresh re-reads storage: sees writes from another instance and notifies subscribers (S-39)', () => {
    const storage = memoryStorage();
    const { now } = clock('2026-11-12T10:00:00');
    const a = createTallyStore({ storage, now });
    const b = createTallyStore({ storage, now });
    let calls = 0;
    b.subscribe(() => calls++);
    a.dispatch({ type: 'add', n: 3 });
    expect(b.view().allTime).toBe(0);
    b.refresh();
    expect(b.view().allTime).toBe(3);
    expect(calls).toBe(1);
  });

  it('refresh returns to the empty view after storage is cleared', () => {
    const storage = memoryStorage();
    const { now } = clock('2026-11-12T10:00:00');
    const store = createTallyStore({ storage, now });
    store.dispatch({ type: 'add', n: 2 });
    storage.data.delete(STORAGE_KEY);
    store.refresh();
    expect(store.view().allTime).toBe(0);
  });
});

describe('tally store v2 (S-56 S-57 S-58)', () => {
  const v1 = (extra: object = {}) =>
    JSON.stringify({
      app: 'chestcounterfn',
      v: 1,
      chest: 'rare',
      records: [[1762934400, 30, 's'], [1762934460, 8, 'r'], [1762935000]],
      ...extra,
    });

  it('S-58: reading a v1 save counts it at the normal rate and rewrites storage as v2', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: v1() });
    const store = createTallyStore({
      storage,
      now: clock('2026-11-12T10:00:00').now,
    });
    expect(store.status()).toEqual({ state: 'ok' });
    expect(store.view().allTime).toBe(38);
    expect(store.view().mode).toBe('standard');
    expect(store.view().boost).toEqual(DEFAULT_BOOST);
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!)).toEqual({
      app: 'chestcounterfn',
      v: 2,
      mode: 's',
      boost: [1.5, 7.5, 10],
      records: [
        [1762934400, 30],
        [1762934460, 8],
      ],
    });
  });

  it('S-58: importing a v1 backup is accepted, and storage is v2 afterwards', () => {
    const storage = memoryStorage();
    const store = createTallyStore({
      storage,
      now: clock('2026-11-12T10:00:00').now,
    });
    const parsed = store.parseBackup(
      v1({ exportedAt: '2026-11-01T00:00:00Z' })
    );
    expect(parsed).toMatchObject({
      ok: true,
      preview: { incoming: { allTime: 38 } },
    });
    if (!parsed.ok) throw new Error('parse');
    store.importBackup(parsed.backup);
    expect(store.view().allTime).toBe(38);
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!).v).toBe(2);
  });

  it('setMode / setBoost / setTotal write to storage and a new instance reads them back', () => {
    const storage = memoryStorage();
    const { now } = clock('2026-11-12T10:00:00');
    const store = createTallyStore({ storage, now });
    store.dispatch({ type: 'setMode', mode: 'treasureHours' });
    store.dispatch({
      type: 'setBoost',
      boost: { pirateShop: 2, goldOutfit: 7.5, vehicleDecal: 10 },
    });
    store.dispatch({ type: 'add', n: 100 });
    store.dispatch({ type: 'setTotal', total: 4000 });
    const saved = JSON.parse(storage.data.get(STORAGE_KEY)!);
    expect(saved.mode).toBe('t');
    expect(saved.boost).toEqual([2, 7.5, 10]);
    expect(saved.records[0].slice(1)).toEqual([100, [2, 7.5, 10]]);
    expect(saved.records[1].slice(1)).toEqual([3900, 'start']);

    const again = createTallyStore({ storage, now }).view();
    expect([again.allTime, again.mode, again.boost.pirateShop]).toEqual([
      4000,
      'treasureHours',
      2,
    ]);
    expect([again.today, again.bestDay, again.days]).toEqual([100, 100, 1]);
  });

  it('setTotal not above All time, or setMode / setBoost with the same value: no-op, no storage write', () => {
    const storage = memoryStorage();
    const store = createTallyStore({
      storage,
      now: clock('2026-11-12T10:00:00').now,
    });
    store.dispatch({ type: 'setTotal', total: 0 });
    store.dispatch({ type: 'setMode', mode: 'standard' });
    store.dispatch({ type: 'setBoost', boost: DEFAULT_BOOST });
    expect(storage.data.size).toBe(0);
    store.dispatch({ type: 'add', n: 10 });
    const before = storage.data.get(STORAGE_KEY);
    store.dispatch({ type: 'setTotal', total: 10 });
    store.dispatch({ type: 'setTotal', total: 3 });
    expect(storage.data.get(STORAGE_KEY)).toBe(before);
  });

  describe('Treasure Hours returns to Standard across days (S-63)', () => {
    const saved = (modeOn: string | undefined) =>
      encode({
        mode: 'treasureHours',
        ...(modeOn ? { modeOn } : {}),
        boost: DEFAULT_BOOST,
        records: [{ kind: 'open', at: 1762934400, n: 3 }],
      });
    const stored = (storage: ReturnType<typeof memoryStorage>) =>
      JSON.parse(storage.data.get(STORAGE_KEY)!);

    it('modeOn is yesterday on load: switch back to Standard and write the save back', () => {
      const storage = memoryStorage({ [STORAGE_KEY]: saved('2026-11-11') });
      const store = createTallyStore({
        storage,
        now: clock('2026-11-12T10:00:00').now,
      });
      expect(store.view().mode).toBe('standard');
      expect(store.view().allTime).toBe(3);
      expect(stored(storage)).toMatchObject({ mode: 's' });
      expect('modeOn' in stored(storage)).toBe(false);
      store.dispatch({ type: 'add', n: 1 });
      expect(stored(storage).records.at(-1)).toHaveLength(2); // normal record
    });

    it('missing modeOn on load is treated as expired; modeOn of today keeps Treasure Hours without rewriting', () => {
      const missing = memoryStorage({ [STORAGE_KEY]: saved(undefined) });
      const now = clock('2026-11-12T10:00:00').now;
      expect(createTallyStore({ storage: missing, now }).view().mode).toBe(
        'standard'
      );
      const raw = saved('2026-11-12');
      const today = memoryStorage({ [STORAGE_KEY]: raw });
      expect(createTallyStore({ storage: today, now }).view().mode).toBe(
        'treasureHours'
      );
      expect(today.data.get(STORAGE_KEY)).toBe(raw);
    });

    it('switching to Treasure Hours writes modeOn, and it still holds the same day after a refresh (new store)', () => {
      const storage = memoryStorage();
      const now = clock('2026-11-12T10:00:00').now;
      const store = createTallyStore({ storage, now });
      store.dispatch({ type: 'setMode', mode: 'treasureHours' });
      expect(stored(storage)).toMatchObject({
        mode: 't',
        modeOn: '2026-11-12',
      });
      expect(createTallyStore({ storage, now }).view().mode).toBe(
        'treasureHours'
      );
    });

    it('page left open across midnight: tick switches back to Standard, writes back and notifies; a tick on the same day does nothing', () => {
      const storage = memoryStorage();
      const { c, now } = clock('2026-11-12T23:58:00');
      const store = createTallyStore({ storage, now });
      store.dispatch({ type: 'setMode', mode: 'treasureHours' });
      let calls = 0;
      store.subscribe(() => calls++);
      store.tick();
      expect([store.view().mode, calls]).toEqual(['treasureHours', 0]);

      c.t = new Date('2026-11-13T00:01:00');
      store.tick();
      expect(store.view().mode).toBe('standard');
      expect(calls).toBe(1);
      expect(stored(storage)).toMatchObject({ mode: 's' });
      store.tick();
      expect(calls).toBe(1);
    });

    it('a +1 after midnight but before the tick is also recorded as Standard', () => {
      const storage = memoryStorage();
      const { c, now } = clock('2026-11-12T23:59:00');
      const store = createTallyStore({ storage, now });
      store.dispatch({ type: 'setMode', mode: 'treasureHours' });
      store.dispatch({ type: 'add', n: 1 });
      c.t = new Date('2026-11-13T00:00:30');
      store.dispatch({ type: 'add', n: 1 });
      const records = store.view().records;
      expect(records.map((r) => r.kind)).toEqual(['treasure', 'open']);
      expect(store.view().mode).toBe('standard');
    });

    it('importing a backup with a modeOn of yesterday: data is imported and the mode falls back to Standard', () => {
      const storage = memoryStorage();
      const store = createTallyStore({
        storage,
        now: clock('2026-11-12T10:00:00').now,
      });
      const parsed = store.parseBackup(saved('2026-11-10'));
      if (!parsed.ok) throw new Error('parse');
      store.importBackup(parsed.backup);
      expect(store.view().allTime).toBe(3);
      expect(store.view().mode).toBe('standard');
      expect(stored(storage).mode).toBe('s');
    });
  });
});
