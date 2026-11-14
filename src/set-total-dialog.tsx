import { useId, useState } from 'react';

import {
  chest_set_total_current,
  chest_set_total_current_one,
  chest_set_total_description,
  chest_set_total_description_has_records,
  chest_set_total_invalid,
  chest_set_total_label,
  chest_set_total_reset_hint,
  chest_set_total_save,
  chest_set_total_title,
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
import { MAX_START_N } from './tally/types';

const m = {
  current: chest_set_total_current,
  currentOne: chest_set_total_current_one,
  description: chest_set_total_description,
  descriptionHasRecords: chest_set_total_description_has_records,
  resetHint: chest_set_total_reset_hint,
  invalid: chest_set_total_invalid,
  label: chest_set_total_label,
  save: chest_set_total_save,
  title: chest_set_total_title,
};

const number = new Intl.NumberFormat('en-US');

/** A whole number above `allTime` and at most 99,999,999 (8 digits); else null. Digits only. */
function parseTotal(raw: string, allTime: number): number | null {
  const s = raw.trim();
  if (!/^\d{1,8}$/.test(s)) return null;
  const n = Number(s);
  return n > allTime && n <= MAX_START_N ? n : null;
}

function SetTotalForm({
  allTime,
  onSave,
  onCancel,
}: {
  allTime: number;
  onSave: (total: number) => void;
  onCancel: () => void;
}) {
  const baseId = useId();
  const errorId = `${baseId}-error`;
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const total = parseTotal(value, allTime);
        if (total === null) {
          setInvalid(true);
          return;
        }
        onSave(total);
      }}
      className="grid gap-4"
    >
      <DialogHeader>
        <DialogTitle>{m.title()}</DialogTitle>
        {allTime > 0 ? (
          <DialogDescription className="grid gap-1.5">
            <strong className="font-(family-name:--fn-cond) text-lg font-extrabold text-white">
              {allTime === 1
                ? m.currentOne()
                : m.current({ n: number.format(allTime) })}
            </strong>
            <span>{m.descriptionHasRecords()}</span>
            <span>{m.resetHint()}</span>
          </DialogDescription>
        ) : (
          <DialogDescription>{m.description()}</DialogDescription>
        )}
      </DialogHeader>
      <div className="grid gap-1.5">
        <label
          htmlFor={`${baseId}-total`}
          className="font-(family-name:--fn-cond) text-base font-bold tracking-wide uppercase"
        >
          {m.label()}
        </label>
        <Input
          id={`${baseId}-total`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setInvalid(false);
          }}
          className="h-11 rounded-none border-[3px] border-(--fn-ink) bg-(--fn-ink) px-3 font-(family-name:--fn-cond) text-xl font-bold text-white"
        />
        {invalid && (
          <p
            id={errorId}
            role="alert"
            className="m-0 font-(family-name:--fn-cond) text-sm font-bold text-(--fn-yellow)"
          >
            {m.invalid({ min: number.format(allTime + 1) })}
          </p>
        )}
      </div>
      <DialogActions onCancel={onCancel}>
        <Button type="submit">{m.save()}</Button>
      </DialogActions>
    </form>
  );
}

/** "How many chests have you opened in total?" Adds a start record that tops All time up to the typed total. */
export function SetTotalDialog({
  open,
  allTime,
  onSave,
  onCancel,
}: {
  open: boolean;
  allTime: number;
  onSave: (total: number) => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        showCloseButton={false}
        data-design-theme="fn"
        className="gap-4 rounded-none border-4 border-(--fn-ink) bg-(--fn-panel) p-5 font-(family-name:--fn-body) shadow-[inset_0_0_0_2px_rgba(74,163,255,0.55),0_8px_0_var(--fn-ink)] ring-0"
      >
        <SetTotalForm allTime={allTime} onSave={onSave} onCancel={onCancel} />
      </DialogContent>
    </Dialog>
  );
}
