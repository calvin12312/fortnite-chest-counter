import { decode, encode } from './codec';
import { deriveView, localDateKey, reduce, rollMode, summarize } from './model';
import {
  DEFAULT_BOOST,
  type ParsedBackup,
  type StorageStatus,
  type TallyAction,
  type TallyDoc,
  type TallyView,
} from './types';

export const STORAGE_KEY = 'ccfn.tally';
export const CORRUPT_KEY = 'ccfn.tally.corrupt';

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export interface TallyStore {
  view(): TallyView;
  status(): StorageStatus;
  dispatch(action: TallyAction): void;
  /** Re-read storage and notify subscribers (called after another tab writes, S-39) */
  refresh(): void;
  /** Called as time passes (timer, page becomes visible again): if Treasure Hours has crossed local midnight, switch back to Standard and write back */
  tick(): void;
  parseBackup(text: string): ParsedBackup;
  importBackup(doc: TallyDoc): void;
  exportBackup(): { filename: string; text: string };
  downloadRaw(): { filename: string; text: string };
  startFresh(): void;
  subscribe(fn: () => void): () => void;
}

const EMPTY: TallyDoc = {
  records: [],
  mode: 'standard',
  boost: DEFAULT_BOOST,
};

export function createTallyStore(deps: {
  storage: StorageLike | null;
  now: () => Date;
}): TallyStore {
  const { storage, now } = deps;
  const listeners = new Set<() => void>();
  let doc: TallyDoc = EMPTY;
  let status: StorageStatus = storage
    ? { state: 'ok' }
    : { state: 'unavailable' };
  let cache: { doc: TallyDoc; day: string; view: TallyView } | null = null;

  /** Read the latest storage content and update doc and status. A read failure is treated as unavailable. */
  function load(): void {
    if (!storage) return;
    let raw: string | null;
    try {
      raw = storage.getItem(STORAGE_KEY);
    } catch {
      status = { state: 'unavailable' };
      return;
    }
    if (raw === null) {
      doc = EMPTY;
      status = { state: 'ok' };
      return;
    }
    const res = decode(raw);
    if (res.ok) {
      doc = rollMode(res.doc, now()); // yesterday's Treasure Hours does not carry over to today
      status = { state: 'ok' };
      if (res.migratedFrom !== undefined || doc !== res.doc) write();
    } else if (res.error === 'newerVersion') {
      doc = EMPTY;
      status = { state: 'newerVersion', version: res.version ?? 0 };
    } else {
      let preserved = true;
      try {
        storage.setItem(CORRUPT_KEY, raw);
      } catch {
        preserved = false;
      }
      doc = EMPTY;
      status = { state: 'corrupt', raw, preserved };
    }
  }

  /** Write the whole document back; on failure status becomes writeFailed and in-memory state is not rolled back */
  function write(): void {
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, encode(doc));
      status = { state: 'ok' };
    } catch {
      status = { state: 'writeFailed' };
    }
  }

  function notify(): void {
    for (const fn of [...listeners]) fn();
  }

  function writable(): boolean {
    return (
      status.state !== 'newerVersion' &&
      !(status.state === 'corrupt' && !status.preserved)
    );
  }

  /** Sync with storage before an action: when ok, re-read (merging changes from other tabs); in other states keep the in-memory state */
  function sync(): void {
    if (status.state === 'ok') load();
  }

  load();

  return {
    view() {
      const n = now();
      const day = localDateKey(n);
      if (!cache || cache.doc !== doc || cache.day !== day) {
        cache = { doc, day, view: deriveView(doc, n) };
      }
      return cache.view;
    },
    status: () => status,
    dispatch(action) {
      sync();
      if (!writable()) {
        notify();
        return;
      }
      const next = reduce(rollMode(doc, now()), action, now());
      if (next !== doc) {
        doc = next;
        write();
      }
      notify();
    },
    refresh() {
      load();
      notify();
    },
    tick() {
      if (!writable()) return;
      const next = rollMode(doc, now());
      if (next === doc) return;
      doc = next;
      write();
      notify();
    },
    parseBackup(text) {
      const res = decode(text);
      if (!res.ok) {
        const error =
          res.error === 'newerVersion' ? 'unsupportedVersion' : res.error;
        return {
          ok: false,
          error,
          ...(res.detail ? { detail: res.detail } : {}),
        };
      }
      return {
        ok: true,
        backup: res.doc,
        preview: { current: summarize(doc), incoming: summarize(res.doc) },
      };
    },
    importBackup(next) {
      sync();
      if (!writable()) {
        notify();
        return;
      }
      doc = rollMode(next, now());
      write();
      notify();
    },
    exportBackup() {
      const n = now();
      return {
        filename: `chest-counter-backup-${localDateKey(n)}.json`,
        text: encode(doc, { exportedAt: n }),
      };
    },
    downloadRaw() {
      return {
        filename: `chest-counter-saved-data-${localDateKey(now())}.txt`,
        text: status.state === 'corrupt' ? status.raw : '',
      };
    },
    startFresh() {
      if (status.state !== 'corrupt') return;
      doc = EMPTY;
      status = { state: 'ok' };
      write();
      notify();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
