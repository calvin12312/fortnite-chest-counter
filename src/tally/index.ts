import { useSyncExternalStore } from 'react';

import { MAX_BYTES } from './codec';
import {
  createTallyStore,
  STORAGE_KEY,
  type StorageLike,
  type TallyStore,
} from './store';
import {
  DEFAULT_BOOST,
  type Boost,
  type ParsedBackup,
  type StorageStatus,
  type TallyDoc,
  type TallyMode,
  type TallyView,
} from './types';

/** The only entry point for the UI. Built on useSyncExternalStore: SSR and the first hydrate return an empty, read-only view. */

export type Tally = TallyView & {
  status: StorageStatus;
  /** Not newerVersion, and not a corrupt state with preserved false */
  canWrite: boolean;
  add(n: number): void;
  undo(): void;
  /** Clear all records (keeping mode and boost), using the same storage path as counting */
  resetAll(): void;
  /** Top All time up to total by appending a starting-total record; a no-op when total is not greater than All time */
  setTotal(total: number): void;
  setMode(mode: TallyMode): void;
  /** Only affects records added afterwards */
  setBoost(boost: Boost): void;
  /** Parse only, without changing data; oversized files are rejected before their content is read */
  parseBackup(file: File): Promise<ParsedBackup>;
  importBackup(doc: TallyDoc): void;
  /** Trigger a browser download of chest-counter-backup-<date>.json */
  exportBackup(): void;
  /** Exits from the corrupt state: download the raw text / discard it and start fresh (the raw text stays under the backup key) */
  downloadRaw(): void;
  startFresh(): void;
};

const RECOMPUTE_MS = 60_000;

const EMPTY_VIEW: TallyView = {
  today: 0,
  bestDay: 0,
  allTime: 0,
  days: 0,
  hasEarlierDays: false,
  milestones: [
    { at: 100, reached: false },
    { at: 500, reached: false },
    { at: 1000, reached: false },
    { at: 5000, reached: false },
  ],
  canUndo: false,
  canReset: false,
  mode: 'standard',
  boost: DEFAULT_BOOST,
  records: [],
  lastRecord: null,
};

function download(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

const actions = {
  add: (n: number) => {
    getStore().dispatch({ type: 'add', n });
  },
  undo: () => getStore().dispatch({ type: 'undo' }),
  resetAll: () => getStore().dispatch({ type: 'resetAll' }),
  setTotal: (total: number) => {
    getStore().dispatch({ type: 'setTotal', total });
  },
  setMode: (mode: TallyMode) => getStore().dispatch({ type: 'setMode', mode }),
  setBoost: (boost: Boost) => getStore().dispatch({ type: 'setBoost', boost }),
  parseBackup: async (file: File): Promise<ParsedBackup> => {
    if (file.size > MAX_BYTES) return { ok: false, error: 'tooLarge' };
    let text: string;
    try {
      text = await file.text();
    } catch {
      return { ok: false, error: 'notJson' };
    }
    return getStore().parseBackup(text);
  },
  importBackup: (doc: TallyDoc) => getStore().importBackup(doc),
  exportBackup: () => {
    const { filename, text } = getStore().exportBackup();
    download(filename, text, 'application/json');
  },
  downloadRaw: () => {
    const { filename, text } = getStore().downloadRaw();
    download(filename, text, 'text/plain');
  },
  startFresh: () => getStore().startFresh(),
};

const SERVER_SNAPSHOT: Tally = {
  ...EMPTY_VIEW,
  status: { state: 'ok' },
  canWrite: false,
  ...actions,
};

function browserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null; // access is disabled: in-memory mode
  }
}

let store: TallyStore | null = null;
function getStore(): TallyStore {
  store ??= createTallyStore({
    storage: browserStorage(),
    now: () => new Date(),
  });
  return store;
}

let cached: { view: TallyView; status: StorageStatus; snap: Tally } | null =
  null;
function getSnapshot(): Tally {
  const s = getStore();
  const view = s.view();
  const status = s.status();
  if (!cached || cached.view !== view || cached.status !== status) {
    cached = {
      view,
      status,
      snap: {
        ...view,
        status,
        canWrite: !(
          status.state === 'newerVersion' ||
          (status.state === 'corrupt' && !status.preserved)
        ),
        ...actions,
      },
    };
  }
  return cached.snap;
}

function subscribe(onChange: () => void): () => void {
  const s = getStore();
  const unsubscribe = s.subscribe(onChange);
  const onStorage = (e: StorageEvent) => {
    // a null key means the entire storage was cleared
    if (e.key === null || e.key === STORAGE_KEY) s.refresh();
  };
  // The view is memoized by local date; after a notification, getSnapshot returns a new view when the date changes.
  // Tick first so Treasure Hours that crossed local midnight switches back to Standard here
  const refreshTime = () => {
    s.tick();
    onChange();
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible') refreshTime();
  };
  const timer = window.setInterval(refreshTime, RECOMPUTE_MS);
  window.addEventListener('storage', onStorage);
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    unsubscribe();
    window.clearInterval(timer);
    window.removeEventListener('storage', onStorage);
    document.removeEventListener('visibilitychange', onVisible);
  };
}

export function useTally(): Tally {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}
