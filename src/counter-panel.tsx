import { useEffect, useState } from 'react';

import {
  chest_counter_add_one,
  chest_counter_add_one_th,
  chest_counter_best_day,
  chest_counter_label,
  chest_counter_milestone_not_reached,
  chest_counter_milestone_reached,
  chest_counter_milestones,
  chest_counter_reset_done,
  chest_counter_title,
  chest_counter_today,
  chest_mode_treasure_hours,
  chest_set_total_empty,
} from '@/messages';

import { ModeToggle } from './mode-toggle';
import { Odometer } from './odometer';
import { PrizeTable } from './prize-table';
import { ResetDialog } from './reset-dialog';
import { SecondaryActions } from './secondary-actions';
import { SetTotalDialog } from './set-total-dialog';
import { StorageBanner } from './storage-banner';
import { StorageRow } from './storage-row';
import { useTally } from './tally';

const m = {
  'chest.counter.add_one': chest_counter_add_one,
  'chest.counter.add_one_th': chest_counter_add_one_th,
  'chest.counter.best_day': chest_counter_best_day,
  'chest.counter.label': chest_counter_label,
  'chest.counter.milestone_not_reached': chest_counter_milestone_not_reached,
  'chest.counter.milestone_reached': chest_counter_milestone_reached,
  'chest.counter.milestones': chest_counter_milestones,
  'chest.counter.reset_done': chest_counter_reset_done,
  'chest.counter.title': chest_counter_title,
  'chest.counter.today': chest_counter_today,
  'chest.mode.treasure_hours': chest_mode_treasure_hours,
  'chest.set_total.empty': chest_set_total_empty,
} as const;

const TIER_CLASS = {
  100: 'bg-(--fn-uncommon)',
  500: 'bg-(--fn-rare)',
  1000: 'bg-(--fn-epic)',
  5000: 'bg-(--fn-legendary)',
} as const;

const fmt = (n: number) => n.toLocaleString('en-US');

/** The big key: yellow in Standard, legendary orange (with a "Treasure Hours" line) in Treasure Hours. */
const KEY_FACE = {
  standard:
    'bg-[linear-gradient(180deg,#fff466_0%,var(--fn-yellow)_38%,#ffd400_100%)] shadow-[inset_0_3px_0_rgba(255,255,255,0.85),0_9px_0_var(--fn-yellow-d),0_9px_0_4px_var(--fn-ink)] group-enabled:group-active:shadow-[inset_0_3px_0_rgba(255,255,255,0.85),0_2px_0_var(--fn-yellow-d),0_2px_0_4px_var(--fn-ink)] motion-reduce:group-enabled:group-active:shadow-[inset_0_3px_0_rgba(255,255,255,0.85),0_9px_0_var(--fn-yellow-d),0_9px_0_4px_var(--fn-ink)]',
  treasureHours:
    'bg-[linear-gradient(180deg,#ffc58a_0%,var(--fn-legendary)_38%,#ff7a00_100%)] shadow-[inset_0_3px_0_rgba(255,255,255,0.7),0_9px_0_#b84f00,0_9px_0_4px_var(--fn-ink)] group-enabled:group-active:shadow-[inset_0_3px_0_rgba(255,255,255,0.7),0_2px_0_#b84f00,0_2px_0_4px_var(--fn-ink)] motion-reduce:group-enabled:group-active:shadow-[inset_0_3px_0_rgba(255,255,255,0.7),0_9px_0_#b84f00,0_9px_0_4px_var(--fn-ink)]',
} as const;

const CAP =
  'font-(family-name:--fn-cond) text-sm font-bold tracking-widest text-(--fn-mute) uppercase';

/** First-screen counter: flip window, prize odds, the one big yellow key, mode switch, stats, milestones. */
export function CounterPanel() {
  const t = useTally();
  const [totalOpen, setTotalOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const treasure = t.mode === 'treasureHours';
  // The Set total entry is decided once per page view, when saved data is first
  // read: a device with no chests keeps it after +1, so the +1 key never jumps
  // under the visitor's finger. Setting a total removes it; a page with chests
  // at load never shows it (until the count is back at 0, e.g. after Reset all).
  const [keepEntry, setKeepEntry] = useState<boolean | null>(null);
  useEffect(() => {
    if (keepEntry === null && t.canWrite) setKeepEntry(t.allTime === 0);
  }, [keepEntry, t.canWrite, t.allTime]);
  const showEntry = t.allTime === 0 || keepEntry === true;
  const stats = [
    ['chest.counter.today', t.today],
    ['chest.counter.best_day', t.bestDay],
  ] as const;

  return (
    <section
      aria-label={m['chest.counter.label']()}
      className="grid gap-3.5 border-4 border-(--fn-ink) bg-[linear-gradient(180deg,#123199_0%,var(--fn-panel)_30%,#0a1f6b_100%)] px-3.5 pt-3.5 pb-[18px] shadow-[inset_0_0_0_2px_rgba(74,163,255,0.55),0_8px_0_var(--fn-ink)] [clip-path:polygon(0_0,calc(100%_-_14px)_0,100%_14px,100%_100%,14px_100%,0_calc(100%_-_14px))] sm:px-6 sm:pt-5 sm:pb-[22px] sm:[clip-path:polygon(0_0,calc(100%_-_22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%_-_22px))]"
    >
      <StorageBanner t={t} />

      <div className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 font-(family-name:--fn-cond) text-xl leading-none font-black tracking-wide uppercase italic sm:text-[26px]">
          {m['chest.counter.title']()}
        </h2>
      </div>

      <div className="bg-(--fn-ink) p-2 shadow-[inset_0_4px_0_rgba(0,0,0,0.5)] sm:p-3">
        <Odometer value={t.allTime} />
      </div>

      {showEntry && (
        <button
          type="button"
          onClick={() => setTotalOpen(true)}
          disabled={!t.canWrite}
          data-testid="set-total-empty"
          className="cursor-pointer border-2 border-dashed border-(--fn-yellow)/70 bg-[rgba(5,13,51,0.4)] px-3 py-1.5 text-center font-(family-name:--fn-cond) text-base font-extrabold tracking-wide text-(--fn-yellow) uppercase italic enabled:hover:bg-[rgba(5,13,51,0.7)] disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
        >
          {m['chest.set_total.empty']()}
        </button>
      )}

      <PrizeTable records={t.records} />

      <button
        type="button"
        onClick={() => t.add(1)}
        disabled={!t.canWrite}
        aria-label={treasure ? m['chest.counter.add_one_th']() : undefined}
        data-mode={t.mode}
        className="group block w-full -skew-x-[4deg] border-0 bg-transparent p-0 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 sm:-skew-x-[5deg]"
      >
        <span
          className={`grid h-[150px] place-items-center border-4 border-(--fn-ink) pt-[0.14em] font-(family-name:--fn-display) text-[min(15vw,58px)] leading-none tracking-wider text-(--fn-ink) uppercase transition-[transform,box-shadow] duration-90 ease-out group-enabled:group-active:translate-y-[7px] motion-reduce:transition-none motion-reduce:group-enabled:group-active:translate-y-0 sm:h-[124px] sm:text-7xl ${KEY_FACE[t.mode]}`}
        >
          {treasure ? (
            <span className="grid justify-items-center gap-1.5">
              <span className="text-[min(6.4vw,26px)] leading-none tracking-wide sm:text-3xl">
                {m['chest.mode.treasure_hours']()}
              </span>
              <span aria-hidden="true">{m['chest.counter.add_one']()}</span>
            </span>
          ) : (
            m['chest.counter.add_one']()
          )}
        </span>
      </button>

      <ModeToggle t={t} />

      <SecondaryActions
        t={t}
        announcement={announcement}
        onAnnounce={setAnnouncement}
      />

      <SetTotalDialog
        open={totalOpen}
        allTime={t.allTime}
        onCancel={() => setTotalOpen(false)}
        onSave={(total) => {
          t.setTotal(total);
          setKeepEntry(false);
          setTotalOpen(false);
        }}
      />

      <dl className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
        {stats.map(([key, value]) => (
          <div
            key={key}
            className="flex flex-col items-start gap-0.5 border-l-4 border-(--fn-line) bg-[rgba(5,13,51,0.55)] px-2.5 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2 sm:px-3.5"
          >
            <dt className={CAP}>{m[key]()}</dt>
            <dd
              className="m-0 font-(family-name:--fn-cond) text-[28px] leading-none font-black italic tabular-nums sm:text-[30px]"
              data-testid={key}
            >
              {fmt(value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex items-center justify-between gap-2 sm:justify-start sm:gap-3">
        <span className={`${CAP} min-w-0`}>
          {m['chest.counter.milestones']()}
        </span>
        <ul className="m-0 flex shrink-0 list-none gap-1 p-0 sm:gap-1.5">
          {t.milestones.map(({ at, reached }) => (
            <li
              key={at}
              data-reached={reached ? 'true' : 'false'}
              className={`min-w-[40px] -skew-x-8 border-2 px-1.5 pt-1 pb-px text-center font-(family-name:--fn-cond) text-xl leading-tight font-black italic sm:min-w-[46px] sm:px-2 ${
                reached
                  ? `${TIER_CLASS[at]} border-(--fn-ink) text-(--fn-ink) shadow-[inset_0_2px_0_rgba(255,255,255,0.5)]`
                  : 'border-white/20 bg-[rgba(5,13,51,0.55)] text-white/40'
              }`}
            >
              {fmt(at)}
              <span className="sr-only">
                {' '}
                {reached
                  ? m['chest.counter.milestone_reached']()
                  : m['chest.counter.milestone_not_reached']()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <StorageRow
        t={t}
        onSetTotal={() => setTotalOpen(true)}
        onReset={() => setResetOpen(true)}
      />

      <ResetDialog
        summary={resetOpen ? { allTime: t.allTime, days: t.days } : null}
        onCancel={() => setResetOpen(false)}
        onExport={t.exportBackup}
        onConfirm={() => {
          t.resetAll();
          setResetOpen(false);
          setAnnouncement(m['chest.counter.reset_done']());
        }}
      />
    </section>
  );
}
