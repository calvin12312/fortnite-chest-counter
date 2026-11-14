import { useEffect, useRef } from 'react';

import {
  chest_counter_odometer_label,
  chest_counter_odometer_label_one,
} from '@/messages';

const MIN_CELLS = 4;
const FLIP_MS = 180;

function Cell({ digit, lead }: Readonly<{ digit: string; lead: boolean }>) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(digit);
  useEffect(() => {
    if (prev.current === digit) return;
    prev.current = digit;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    ref.current?.animate(
      [
        { transform: 'perspective(400px) rotateX(-75deg)', opacity: 0.35 },
        { transform: 'perspective(400px) rotateX(0deg)', opacity: 1 },
      ],
      { duration: FLIP_MS, easing: 'ease-out' }
    );
  }, [digit]);

  return (
    <span
      ref={ref}
      data-lead={lead ? 'true' : undefined}
      className={
        lead
          ? 'grid h-28 place-items-center overflow-hidden rounded-md bg-[linear-gradient(180deg,#24409c_0%,#1b3288_100%)] shadow-[inset_0_-5px_0_#142670] sm:h-[150px]'
          : 'grid h-28 place-items-center overflow-hidden rounded-md bg-[linear-gradient(180deg,transparent_calc(50%_-_1px),#c9d6ee_calc(50%_-_1px),#c9d6ee_calc(50%_+_1px),transparent_calc(50%_+_1px)),linear-gradient(180deg,#ffffff_0%,#eaf1ff_100%)] shadow-[inset_0_-5px_0_#b4c4e6] sm:h-[150px]'
      }
    >
      <b
        className={`font-(family-name:--fn-cond) text-[112px] leading-none font-extrabold tabular-nums sm:text-[150px] ${
          lead ? 'text-white/15' : 'text-(--fn-ink)'
        }`}
      >
        {digit}
      </b>
    </span>
  );
}

/** Mechanical flip window: at least four cells, grows with the number of digits. */
export function Odometer({ value }: Readonly<{ value: number }>) {
  const s = String(value).padStart(MIN_CELLS, '0');
  const firstNonZero = s.search(/[1-9]/);
  const firstReal = firstNonZero === -1 ? s.length - 1 : firstNonZero;
  return (
    <div
      role="img"
      aria-label={(value === 1
        ? chest_counter_odometer_label_one
        : chest_counter_odometer_label)({
        count: value.toLocaleString('en-US'),
      })}
      data-testid="odometer"
      className="grid gap-1.5 sm:gap-2"
      style={{ gridTemplateColumns: `repeat(${s.length}, minmax(0, 1fr))` }}
    >
      {s.split('').map((d, i) => (
        // Digits are aligned from the right; the key is the place value, so existing cells are not remounted when a digit is added.
        // biome-ignore lint/suspicious/noArrayIndexKey: the key is derived from the place value, not the raw index
        <Cell key={s.length - i} digit={d} lead={i < firstReal} />
      ))}
    </div>
  );
}
