import { useEffect, useRef, useState } from 'react';

import {
  chest_counter_export,
  chest_counter_import,
  chest_counter_import_error_damaged,
  chest_counter_import_error_newer,
  chest_counter_import_error_not_backup,
  chest_counter_import_error_too_large,
  chest_counter_reset_all,
  chest_counter_storage_note,
  chest_set_total_button,
} from '@/messages';

import { ImportDialog } from './import-dialog';
import type { Tally } from './tally';
import type { BackupError, ParsedBackup } from './tally/types';

const m = {
  export: chest_counter_export,
  import: chest_counter_import,
  note: chest_counter_storage_note,
  resetAll: chest_counter_reset_all,
  setTotal: chest_set_total_button,
};

const ERRORS: Record<BackupError, () => string> = {
  notJson: chest_counter_import_error_not_backup,
  notOurBackup: chest_counter_import_error_not_backup,
  unsupportedVersion: chest_counter_import_error_newer,
  invalidRecord: chest_counter_import_error_damaged,
  tooLarge: chest_counter_import_error_too_large,
};

const LINK_BTN =
  'h-8 cursor-pointer border-0 bg-transparent px-0 font-(family-name:--fn-cond) text-base font-bold tracking-wide text-(--fn-mute) underline underline-offset-4 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50';

const HIGHLIGHT_MS = 1500;

const BTN =
  'h-9 -skew-x-[5deg] border-[3px] border-(--fn-ink) bg-[#1c46c4] px-4 font-(family-name:--fn-cond) text-base font-extrabold tracking-wide text-white uppercase italic shadow-[inset_0_2px_0_rgba(255,255,255,0.22),0_3px_0_var(--fn-ink)] enabled:cursor-pointer enabled:active:translate-y-[2px] disabled:cursor-default disabled:bg-[#14307f] disabled:text-white/35';

type Ready = Extract<ParsedBackup, { ok: true }>;

/**
 * Panel footer: storage note, Export, Import (file pick -> validate -> confirm -> replace), and the
 * quiet Set total / Reset all links. The dialogs behind the two links belong to the counter panel.
 */
export function StorageRow({
  t,
  onSetTotal,
  onReset,
}: {
  t: Tally;
  onSetTotal: () => void;
  onReset: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<Ready | null>(null);
  const [highlight, setHighlight] = useState(false);
  const hash = useHash();

  useEffect(() => {
    if (hash !== 'backup') return;
    setHighlight(true);
    const id = window.setTimeout(() => setHighlight(false), HIGHLIGHT_MS);
    return () => window.clearTimeout(id);
  }, [hash]);

  const onPick = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = ''; // same file can be picked again
    if (!file) return;
    const res = await t.parseBackup(file);
    if (res.ok) {
      setError('');
      setPending(res);
    } else {
      setError(ERRORS[res.error]());
    }
  };

  return (
    <div
      id="backup"
      data-highlight={highlight ? 'true' : 'false'}
      className={`grid scroll-mt-4 gap-2 border-2 px-3 py-2.5 transition-colors motion-safe:data-[highlight=true]:animate-pulse ${
        highlight
          ? 'border-(--fn-yellow)'
          : 'border-transparent border-t-(--fn-line)'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="m-0 font-(family-name:--fn-cond) text-sm font-bold text-(--fn-mute)">
          {m.note()}
        </p>
        <div className="flex gap-2.5">
          <button
            type="button"
            className={BTN}
            onClick={t.exportBackup}
            disabled={!t.canWrite}
          >
            {m.export()}
          </button>
          <button
            type="button"
            className={BTN}
            onClick={() => inputRef.current?.click()}
            disabled={!t.canWrite}
          >
            {m.import()}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            hidden
            data-testid="backup-file"
            onChange={(e) => void onPick(e.target.files?.[0])}
          />
        </div>
      </div>
      <div className="flex gap-5">
        <button
          type="button"
          className={LINK_BTN}
          onClick={onSetTotal}
          disabled={!t.canWrite}
        >
          {m.setTotal()}
        </button>
        <button
          type="button"
          className={LINK_BTN}
          onClick={onReset}
          disabled={!t.canWrite || !t.canReset}
        >
          {m.resetAll()}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="m-0 font-(family-name:--fn-cond) text-sm font-bold text-[#ff8a8a]"
        >
          {error}
        </p>
      )}
      <ImportDialog
        preview={pending?.preview ?? null}
        onExport={t.exportBackup}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) t.importBackup(pending.backup);
          setPending(null);
        }}
      />
    </div>
  );
}

/** Current URL hash without the leading `#`; updates on `hashchange`. */
function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash.slice(1));
  useEffect(() => {
    const onChange = () => setHash(window.location.hash.slice(1));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}
