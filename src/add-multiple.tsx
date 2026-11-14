import { useEffect, useId, useRef, useState } from 'react';

import {
  chest_counter_add_multiple_cancel,
  chest_counter_add_multiple_hint,
  chest_counter_add_multiple_invalid,
  chest_counter_add_multiple_label,
  chest_counter_add_multiple_placeholder,
  chest_counter_add_multiple_quick,
  chest_counter_add_multiple_submit,
  chest_counter_add_multiple_title,
} from '@/messages';
import { Input } from '@/ui/input';

const m = {
  cancel: chest_counter_add_multiple_cancel,
  hint: chest_counter_add_multiple_hint,
  invalid: chest_counter_add_multiple_invalid,
  label: chest_counter_add_multiple_label,
  placeholder: chest_counter_add_multiple_placeholder,
  quick: chest_counter_add_multiple_quick,
  submit: chest_counter_add_multiple_submit,
  title: chest_counter_add_multiple_title,
};

/** One-tap batch sizes. Each adds immediately as a single record. */
const QUICK_COUNTS = [5, 10, 20, 50] as const;

/** Returns an integer in 1..999, otherwise null (digits only; rejects "1e2", "5.5", "-3"). */
function parseBatchCount(raw: string): number | null {
  const s = raw.trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= 999 ? n : null;
}

/**
 * Inline batch-add panel: a visible "How many chests?" heading, quick +5/+10/+20/+50
 * buttons (one tap adds one record and closes), and a custom 1–999 field with Add and
 * Cancel. Esc closes. Focus moves to the heading on open, so a phone keyboard does not
 * cover the quick buttons.
 */
export function AddMultiple({
  onAdd,
  onClose,
}: {
  onAdd: (n: number) => void;
  onClose: () => void;
}) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titleRef.current?.focus(), []);

  const commit = (n: number) => {
    onAdd(n);
    onClose();
  };

  return (
    <section
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="grid gap-3 border-4 border-(--fn-ink) bg-(--fn-panel) p-4 shadow-[inset_0_0_0_2px_rgba(74,163,255,0.55),0_6px_0_var(--fn-ink)]"
    >
      <h3
        ref={titleRef}
        id={titleId}
        tabIndex={-1}
        className="m-0 font-(family-name:--fn-display) text-xl tracking-wide text-white outline-none sm:text-2xl"
      >
        {m.title()}
      </h3>

      <div className="grid grid-cols-4 gap-2">
        {QUICK_COUNTS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => commit(n)}
            className="h-11 -skew-x-[5deg] cursor-pointer border-[3px] border-(--fn-ink) bg-white font-(family-name:--fn-cond) text-xl font-extrabold text-(--fn-ink) italic shadow-[0_4px_0_var(--fn-ink)] active:translate-y-[3px] active:shadow-[0_1px_0_var(--fn-ink)]"
          >
            {m.quick({ n })}
          </button>
        ))}
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const n = parseBatchCount(value);
          if (n === null) {
            setInvalid(true);
            return;
          }
          commit(n);
        }}
        className="grid gap-1.5"
      >
        <div className="flex gap-2.5">
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-label={m.label()}
            aria-invalid={invalid}
            aria-describedby={invalid ? `${hintId} ${errorId}` : hintId}
            placeholder={m.placeholder()}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setInvalid(false);
            }}
            className="h-11 min-w-0 flex-1 rounded-none border-[3px] border-(--fn-ink) bg-(--fn-ink) px-3 font-(family-name:--fn-cond) text-xl font-bold text-white placeholder:text-white/45"
          />
          <button
            type="submit"
            className="h-11 -skew-x-[5deg] cursor-pointer border-[3px] border-(--fn-ink) bg-(--fn-yellow) px-5 font-(family-name:--fn-cond) text-lg font-extrabold tracking-wide text-(--fn-ink) uppercase italic shadow-[0_4px_0_var(--fn-ink)] active:translate-y-[3px] active:shadow-[0_1px_0_var(--fn-ink)]"
          >
            {m.submit()}
          </button>
        </div>
        <p
          id={hintId}
          className="m-0 font-(family-name:--fn-cond) text-sm font-semibold text-(--fn-mute)"
        >
          {m.hint()}
        </p>
        {invalid && (
          <p
            id={errorId}
            role="alert"
            className="m-0 font-(family-name:--fn-cond) text-sm font-bold text-(--fn-yellow)"
          >
            {m.invalid()}
          </p>
        )}
      </form>

      <button
        type="button"
        onClick={onClose}
        className="h-10 cursor-pointer border-[3px] border-white/40 bg-transparent px-4 font-(family-name:--fn-cond) text-base font-extrabold tracking-wide text-white uppercase"
      >
        {m.cancel()}
      </button>
    </section>
  );
}
