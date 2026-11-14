import { useId, useState } from 'react';

import {
  chest_boost_description,
  chest_boost_gold_outfit,
  chest_boost_invalid,
  chest_boost_pirate_shop,
  chest_boost_save,
  chest_boost_title,
  chest_boost_vehicle_decal,
} from '@/messages';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';
import { Input } from '@/ui/input';

import { DialogActions } from './dialog-parts';
import { isValidBoostValue, type Boost } from './tally/types';

const m = {
  description: chest_boost_description,
  invalid: chest_boost_invalid,
  save: chest_boost_save,
  title: chest_boost_title,
};

const FIELDS = [
  ['pirateShop', chest_boost_pirate_shop],
  ['goldOutfit', chest_boost_gold_outfit],
  ['vehicleDecal', chest_boost_vehicle_decal],
] as const satisfies readonly (readonly [keyof Boost, () => string])[];

/** 1..100 with at most one decimal; rejects "1.25", "1e1", "-3", "". */
function parseBoostValue(raw: string): number | null {
  const s = raw.trim();
  if (!/^\d{1,3}(\.\d)?$/.test(s)) return null;
  const n = Number(s);
  return isValidBoostValue(n) ? n : null;
}

function BoostForm({
  boost,
  onSave,
  onCancel,
}: {
  boost: Boost;
  onSave: (boost: Boost) => void;
  onCancel: () => void;
}) {
  const baseId = useId();
  const errorId = `${baseId}-error`;
  const [values, setValues] = useState<Record<keyof Boost, string>>({
    pirateShop: String(boost.pirateShop),
    goldOutfit: String(boost.goldOutfit),
    vehicleDecal: String(boost.vehicleDecal),
  });
  const [invalid, setInvalid] = useState<ReadonlySet<keyof Boost>>(new Set());

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = {} as Boost;
        const bad = new Set<keyof Boost>();
        for (const [key] of FIELDS) {
          const n = parseBoostValue(values[key]);
          if (n === null) bad.add(key);
          else parsed[key] = n;
        }
        if (bad.size > 0) {
          setInvalid(bad);
          return;
        }
        onSave(parsed);
      }}
      className="grid gap-4"
    >
      <DialogHeader>
        <DialogTitle>{m.title()}</DialogTitle>
        <DialogDescription>{m.description()}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        {FIELDS.map(([key, label]) => (
          <div
            key={key}
            className="grid grid-cols-[1fr_6rem] items-center gap-3"
          >
            <label
              htmlFor={`${baseId}-${key}`}
              className="font-(family-name:--fn-cond) text-base font-bold tracking-wide uppercase"
            >
              {label()} ×
            </label>
            <Input
              id={`${baseId}-${key}`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={invalid.has(key)}
              aria-describedby={invalid.size > 0 ? errorId : undefined}
              value={values[key]}
              onChange={(e) => {
                setValues((v) => ({ ...v, [key]: e.target.value }));
                setInvalid(new Set());
              }}
              className="h-10 rounded-none border-[3px] border-(--fn-ink) bg-(--fn-ink) px-3 text-right font-(family-name:--fn-cond) text-xl font-bold text-white"
            />
          </div>
        ))}
      </div>
      {invalid.size > 0 && (
        <p
          id={errorId}
          role="alert"
          className="m-0 font-(family-name:--fn-cond) text-sm font-bold text-(--fn-yellow)"
        >
          {m.invalid()}
        </p>
      )}
      <DialogActions onCancel={onCancel}>
        <Button type="submit">{m.save()}</Button>
      </DialogActions>
    </form>
  );
}

/** Edit the Treasure Hours multipliers. Saved values only affect records logged afterwards. */
export function BoostDialog({
  open,
  boost,
  onSave,
  onCancel,
}: {
  open: boolean;
  boost: Boost;
  onSave: (boost: Boost) => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        showCloseButton={false}
        data-design-theme="fn"
        className="gap-4 rounded-none border-4 border-(--fn-ink) bg-(--fn-panel) p-5 font-(family-name:--fn-body) shadow-[inset_0_0_0_2px_rgba(74,163,255,0.55),0_8px_0_var(--fn-ink)] ring-0"
      >
        <BoostForm boost={boost} onSave={onSave} onCancel={onCancel} />
      </DialogContent>
    </Dialog>
  );
}
