import { useEffect, useId, useMemo, useState } from 'react';

import {
  chest_odds_source,
  chest_prize_col_chance,
  chest_prize_col_prize,
  chest_prize_col_rate,
  chest_prize_note,
  chest_prize_odds,
  chest_prize_show,
  chest_prize_title,
} from '@/messages';

import { formatChance, prizeChances, PRIZES, SOURCE } from './odds';
import { prizeNames } from './prize-names';
import type { TallyRecord } from './tally/types';

const m = {
  colChance: chest_prize_col_chance,
  colPrize: chest_prize_col_prize,
  colRate: chest_prize_col_rate,
  note: chest_prize_note,
  odds: chest_prize_odds,
  show: chest_prize_show,
  source: chest_odds_source,
  title: chest_prize_title,
  names: prizeNames,
};

const number = new Intl.NumberFormat('en-US');

/** Per-device convenience: remembers that the visitor folded the table away. */
const FOLD_KEY = 'chest-counter.prizes-folded';

/**
 * Seven-tier prize table: Epic's normal drop rate and the visitor's chance of at
 * least one of each prize over every logged chest so far. All seven rows look the same.
 * The source link to Epic's article sits under it.
 */
export function PrizeTable({ records }: { records: readonly TallyRecord[] }) {
  const titleId = useId();
  const bodyId = useId();
  const chances = useMemo(() => prizeChances(records), [records]);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem(FOLD_KEY) === '1') setOpen(false);
    } catch {
      // storage blocked: stay open
    }
  }, []);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      if (next) localStorage.removeItem(FOLD_KEY);
      else localStorage.setItem(FOLD_KEY, '1');
    } catch {
      // storage blocked: the fold just isn't remembered
    }
  };

  return (
    <div data-testid="prize-odds" className="grid gap-1">
      <h3 id={titleId} className="m-0">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex w-full cursor-pointer items-center justify-between gap-2 border-0 bg-transparent p-0 text-left font-(family-name:--fn-cond) text-sm font-bold tracking-wider text-(--fn-mute) uppercase hover:text-white sm:tracking-widest"
        >
          {m.title()}
          <span className="flex shrink-0 items-center gap-1.5">
            {!open && (
              <span
                aria-hidden="true"
                className="text-xs tracking-wide whitespace-nowrap text-(--fn-yellow) normal-case"
              >
                {m.show()}
              </span>
            )}
            <svg
              aria-hidden="true"
              viewBox="0 0 12 12"
              className={`size-3 shrink-0 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
            >
              <path
                d="M1 4l5 5 5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </span>
        </button>
      </h3>
      <div id={bodyId} hidden={!open} className="grid gap-1">
        <table
          aria-labelledby={titleId}
          className="w-full border-collapse font-(family-name:--fn-cond) tabular-nums"
        >
          <thead>
            <tr className="border-b border-white/30 align-bottom text-[11px] leading-tight text-(--fn-mute) sm:text-xs">
              <th
                scope="col"
                className="py-0.5 pr-2 pl-2.5 text-left font-bold"
              >
                {m.colPrize()}
              </th>
              <th scope="col" className="py-0.5 pr-2 text-right font-bold">
                {m.colRate()}
              </th>
              <th
                scope="col"
                className="w-[4.5rem] py-0.5 pr-2 text-right font-bold normal-case sm:w-auto"
              >
                {m.colChance()}
              </th>
            </tr>
          </thead>
          <tbody>
            {PRIZES.map(({ id, odds }) => (
              <tr key={id} data-prize={id} className="border-b border-white/15">
                <th
                  scope="row"
                  className="py-[3px] pr-1.5 pl-2 text-left text-sm leading-tight font-bold text-white sm:py-1 sm:pl-2.5 sm:text-base"
                >
                  {m.names[id]()}
                </th>
                <td className="py-[3px] pr-1.5 text-right text-xs font-semibold whitespace-nowrap text-(--fn-mute) sm:py-1 sm:pr-2 sm:text-sm">
                  {m.odds({ n: number.format(odds) })}
                </td>
                <td className="min-w-[4.25rem] py-[3px] pr-2 text-right text-lg leading-tight font-black whitespace-nowrap text-white italic sm:py-1 sm:pr-2.5 sm:text-xl">
                  {formatChance(chances[id])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="m-0 text-[11px] leading-snug text-(--fn-mute) sm:text-xs">
          {m.note()}{' '}
          <a
            href={SOURCE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold whitespace-nowrap text-(--fn-yellow) underline underline-offset-4"
          >
            {m.source()}
          </a>
        </p>
      </div>
    </div>
  );
}
