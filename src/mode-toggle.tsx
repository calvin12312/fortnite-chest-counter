import { useState } from 'react';

import {
  chest_mode_boost,
  chest_mode_edit,
  chest_mode_label,
  chest_mode_standard,
  chest_mode_treasure_hours,
} from '@/messages';

import { BoostDialog } from './boost-dialog';
import type { Tally } from './tally';
import type { TallyMode } from './tally/types';

const m = {
  boost: chest_mode_boost,
  edit: chest_mode_edit,
  label: chest_mode_label,
  names: {
    standard: chest_mode_standard,
    treasureHours: chest_mode_treasure_hours,
  } satisfies Record<TallyMode, () => string>,
};

const MODES: readonly TallyMode[] = ['standard', 'treasureHours'];

/**
 * Standard / Treasure Hours switch under the big key. New records use the selected
 * mode; Treasure Hours shows its boost line and an Edit dialog for the multipliers.
 */
export function ModeToggle({ t }: { t: Tally }) {
  const [editing, setEditing] = useState(false);
  const { boost } = t;

  return (
    <div className="grid gap-2">
      <fieldset
        aria-label={m.label()}
        className="m-0 grid min-w-0 grid-cols-2 gap-1.5 border-0 p-0 sm:gap-2"
      >
        {MODES.map((mode) => {
          const selected = t.mode === mode;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={selected}
              disabled={!t.canWrite}
              onClick={() => t.setMode(mode)}
              className={`h-10 -skew-x-[5deg] border-[3px] border-(--fn-ink) font-(family-name:--fn-cond) text-base font-extrabold tracking-wide uppercase italic enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? 'bg-white text-(--fn-ink) shadow-[inset_0_-4px_0_var(--fn-sky)]'
                  : 'bg-[rgba(5,13,51,0.55)] text-white/80'
              }`}
            >
              {m.names[mode]()}
            </button>
          );
        })}
      </fieldset>
      {t.mode === 'treasureHours' && (
        <div className="flex items-center justify-between gap-3">
          <p
            data-testid="boost-line"
            className="m-0 font-(family-name:--fn-cond) text-sm leading-snug font-bold text-(--fn-mute) sm:text-base"
          >
            {m.boost({
              pirateShop: String(boost.pirateShop),
              goldOutfit: String(boost.goldOutfit),
              vehicleDecal: String(boost.vehicleDecal),
            })}
          </p>
          <button
            type="button"
            disabled={!t.canWrite}
            onClick={() => setEditing(true)}
            className="h-8 shrink-0 cursor-pointer border-0 bg-transparent px-1 font-(family-name:--fn-cond) text-base font-bold tracking-wider text-(--fn-yellow) uppercase underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {m.edit()}
          </button>
        </div>
      )}
      <BoostDialog
        open={editing}
        boost={boost}
        onCancel={() => setEditing(false)}
        onSave={(next) => {
          t.setBoost(next);
          setEditing(false);
        }}
      />
    </div>
  );
}
