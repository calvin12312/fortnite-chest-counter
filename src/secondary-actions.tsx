import { useRef, useState } from 'react';

import {
  chest_counter_add_multiple,
  chest_counter_undid_many,
  chest_counter_undid_one,
  chest_counter_undid_start,
  chest_counter_undo,
} from '@/messages';

import { AddMultiple } from './add-multiple';
import type { Tally } from './tally';

const m = {
  add_multiple: chest_counter_add_multiple,
  undid_start: chest_counter_undid_start,
  undid_many: chest_counter_undid_many,
  undid_one: chest_counter_undid_one,
  undo: chest_counter_undo,
};

const BTN =
  'h-[46px] -skew-x-[5deg] border-[3px] border-(--fn-ink) bg-[#1c46c4] font-(family-name:--fn-cond) text-base font-extrabold tracking-wide text-white uppercase italic shadow-[inset_0_2px_0_rgba(255,255,255,0.22),0_4px_0_var(--fn-ink)] enabled:cursor-pointer enabled:active:translate-y-[3px] enabled:active:shadow-[0_1px_0_var(--fn-ink)] disabled:cursor-default disabled:bg-[#14307f] disabled:text-white/35 disabled:shadow-[0_4px_0_var(--fn-ink)] sm:text-[19px]';

/**
 * Main action row under the mode toggle: Undo and Add multiple (+ the batch panel and the polite
 * live region). Set total and Reset all are quiet links in the storage row. The live region
 * takes no space while it is empty, so nothing opens a gap between this row and Today.
 */
export function SecondaryActions({
  t,
  announcement,
  onAnnounce,
}: {
  t: Tally;
  announcement: string;
  onAnnounce: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  /** Closes the batch panel and hands focus back to its button. */
  const closePanel = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  const undo = () => {
    const last = t.lastRecord;
    if (!last) return;
    if (last.kind === 'start') {
      onAnnounce(m.undid_start({ n: last.n.toLocaleString('en-US') }));
    } else if (last.n === 1) {
      onAnnounce(m.undid_one());
    } else {
      onAnnounce(m.undid_many({ n: last.n }));
    }
    t.undo();
  };

  return (
    <div className="pb-1">
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        <button
          type="button"
          className={BTN}
          onClick={undo}
          disabled={!t.canWrite || !t.canUndo}
        >
          {m.undo()}
        </button>
        <button
          ref={toggleRef}
          type="button"
          className={BTN}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          disabled={!t.canWrite}
        >
          {m.add_multiple()}
        </button>
      </div>
      {open && (
        <div className="mt-2.5">
          <AddMultiple
            onAdd={(n) => {
              onAnnounce('');
              t.add(n);
            }}
            onClose={closePanel}
          />
        </div>
      )}
      <p
        aria-live="polite"
        data-testid="undo-announcement"
        className={`m-0 font-(family-name:--fn-cond) text-sm font-bold text-(--fn-mute) ${
          announcement ? 'mt-2.5 min-h-5' : ''
        }`}
      >
        {announcement}
      </p>
    </div>
  );
}
