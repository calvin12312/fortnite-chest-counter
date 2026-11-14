import { useId, useMemo, useState } from 'react';

import {
  chest_mode_standard,
  chest_mode_treasure_hours,
  chest_odds_chests_label,
  chest_odds_col_chance,
  chest_odds_note,
  chest_odds_note_rate,
  chest_odds_note_treasure_hours,
  chest_odds_quick_label,
  chest_odds_rate_label,
  chest_odds_rate_treasure_hours,
  chest_odds_results_title,
  chest_odds_results_title_one,
  chest_odds_row,
  chest_odds_table_caption,
  chest_odds_title,
  chest_prize_col_prize,
} from '@/messages';

import {
  chestsForChance,
  formatChance,
  PRIZES,
  REFERENCE_CHANCES,
  whatIfChances,
  type RateId,
} from './odds';
import { prizeNames } from './prize-names';
import { useTally } from './tally';

const m = {
  chestsLabel: chest_odds_chests_label,
  colChance: chest_odds_col_chance,
  colPrize: chest_prize_col_prize,
  note: chest_odds_note,
  noteRate: chest_odds_note_rate,
  noteTreasureHours: chest_odds_note_treasure_hours,
  quickLabel: chest_odds_quick_label,
  rateLabel: chest_odds_rate_label,
  rateTreasureHours: chest_odds_rate_treasure_hours,
  resultsTitle: chest_odds_results_title,
  resultsTitleOne: chest_odds_results_title_one,
  row: chest_odds_row,
  tableCaption: chest_odds_table_caption,
  title: chest_odds_title,
  rates: {
    standard: chest_mode_standard,
    treasureHours: chest_mode_treasure_hours,
  } satisfies Record<RateId, () => string>,
  names: prizeNames,
};

const number = new Intl.NumberFormat('en-US');
const RATES: readonly RateId[] = ['standard', 'treasureHours'];
/** Default and quick-pick sizes of the next batch. */
const DEFAULT_CHESTS = '100';
const QUICK_CHESTS = [100, 500, 1000] as const;
const MAX_DIGITS = 9;

/**
 * "What if I open more?" panel. The visitor picks how many more chests they plan to open
 * (default 100) and a Standard / Treasure Hours multiplier; the seven prizes show the
 * chance of at least one in that many fresh chests, P = 1 - (1 - m*p)^N. It does not read
 * All time, and its multiplier switch is local state that never touches the counter's
 * record mode; Treasure Hours uses the counter's current boost. Nothing is persisted.
 */
export function OddsPanel() {
  const { boost } = useTally();
  const [chestsText, setChestsText] = useState(DEFAULT_CHESTS);
  const [rate, setRate] = useState<RateId>('standard');
  const resultsId = useId();
  const multiplier = rate === 'treasureHours' ? boost.pirateShop : 1;
  const chests = Number(chestsText);
  const chances = useMemo(
    () => whatIfChances(chests, rate === 'treasureHours' ? boost : null),
    [chests, rate, boost]
  );
  const rateName =
    rate === 'treasureHours'
      ? m.rateTreasureHours({ x: String(boost.pirateShop) })
      : m.rates.standard();
  const resultsTitle =
    chests === 1
      ? m.resultsTitleOne()
      : m.resultsTitle({ n: number.format(chests) });

  return (
    <section
      id="calculator"
      aria-labelledby="odds-title"
      className="grid gap-4 border-4 border-(--fn-ink) bg-[linear-gradient(180deg,#123199_0%,var(--fn-panel)_30%,#0a1f6b_100%)] p-5 pb-6 shadow-[inset_0_0_0_2px_rgba(74,163,255,0.55),0_8px_0_var(--fn-ink)] [clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]"
    >
      <h2
        id="odds-title"
        className="origin-left -skew-x-6 font-(family-name:--fn-display) text-2xl leading-tight tracking-wider text-white uppercase [text-shadow:0_3px_0_var(--fn-ink)] sm:text-3xl"
      >
        {m.title()}
      </h2>

      <div className="grid gap-2">
        <label
          htmlFor="odds-chests"
          className="font-(family-name:--fn-cond) text-base font-bold tracking-wider text-(--fn-mute) uppercase"
        >
          {m.chestsLabel()}
        </label>
        <input
          id="odds-chests"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={chests ? number.format(chests) : ''}
          onChange={(e) =>
            setChestsText(
              e.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS)
            )
          }
          className="h-14 w-full rounded-none border-4 border-(--fn-ink) bg-white px-3 font-(family-name:--fn-cond) text-4xl font-extrabold text-(--fn-ink) tabular-nums"
        />
        <fieldset
          aria-label={m.quickLabel()}
          className="m-0 grid min-w-0 grid-cols-3 gap-2 border-0 p-0"
        >
          {QUICK_CHESTS.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={chests === n}
              onClick={() => setChestsText(String(n))}
              className={`h-10 cursor-pointer border-[3px] border-(--fn-ink) font-(family-name:--fn-cond) text-lg font-extrabold italic tabular-nums ${
                chests === n
                  ? 'bg-white text-(--fn-ink) shadow-[inset_0_-4px_0_var(--fn-line)]'
                  : 'bg-[rgba(5,13,51,0.55)] text-(--fn-mute)'
              }`}
            >
              {number.format(n)}
            </button>
          ))}
        </fieldset>
      </div>

      <fieldset className="m-0 grid min-w-0 grid-cols-2 gap-2 border-0 p-0">
        <legend className="sr-only">{m.rateLabel()}</legend>
        {RATES.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={rate === id}
            onClick={() => setRate(id)}
            className={`h-11 cursor-pointer border-[3px] border-(--fn-ink) font-(family-name:--fn-cond) text-base font-extrabold tracking-wide uppercase italic ${
              rate === id
                ? 'bg-white text-(--fn-ink) shadow-[inset_0_-4px_0_var(--fn-line)]'
                : 'bg-[rgba(5,13,51,0.55)] text-(--fn-mute)'
            }`}
          >
            {m.rates[id]()}
          </button>
        ))}
      </fieldset>

      <div className="grid gap-1.5" data-testid="whatif-odds">
        <h3
          id={resultsId}
          className="m-0 font-(family-name:--fn-cond) text-sm font-bold tracking-widest text-(--fn-mute) uppercase"
        >
          {resultsTitle}
        </h3>
        <table
          aria-labelledby={resultsId}
          className="w-full border-collapse font-(family-name:--fn-cond) tabular-nums"
        >
          <thead className="sr-only">
            <tr>
              <th scope="col">{m.colPrize()}</th>
              <th scope="col">{m.colChance()}</th>
            </tr>
          </thead>
          <tbody>
            {PRIZES.map(({ id }) => {
              return (
                <tr
                  key={id}
                  data-whatif-prize={id}
                  className="border-b border-white/15"
                >
                  <th
                    scope="row"
                    className={`py-1 pr-2 pl-2.5 text-left text-base leading-tight font-bold text-white`}
                  >
                    {m.names[id]()}
                  </th>
                  <td
                    className={`py-1 pr-2.5 text-right text-xl leading-tight font-black whitespace-nowrap text-white italic`}
                  >
                    {formatChance(chances[id])}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2">
        <p className="m-0 font-(family-name:--fn-cond) text-base font-bold tracking-wider text-(--fn-mute) uppercase">
          {m.tableCaption({ rate: rateName })}
        </p>
        <ul
          data-testid="odds-reference"
          className="m-0 list-none border-t-2 border-white/20 p-0"
        >
          {REFERENCE_CHANCES.map((q) => (
            <li
              key={q}
              className="border-b-2 border-white/20 px-0.5 py-1.5 font-(family-name:--fn-cond) text-xl font-semibold text-white tabular-nums"
            >
              {m.row({
                percent: String(Math.round(q * 100)),
                chests: number.format(chestsForChance(q, multiplier)),
              })}
            </li>
          ))}
        </ul>
        <p className="m-0 text-sm leading-snug text-(--fn-mute)">{m.note()}</p>
        <p className="m-0 text-sm leading-snug text-(--fn-mute)">
          {m.noteRate()}
        </p>
        {rate === 'treasureHours' ? (
          <p
            data-testid="whatif-boost"
            className="m-0 text-sm leading-snug text-(--fn-mute)"
          >
            {m.noteTreasureHours({
              pirateShop: String(boost.pirateShop),
              goldOutfit: String(boost.goldOutfit),
              vehicleDecal: String(boost.vehicleDecal),
            })}
          </p>
        ) : null}
      </div>
    </section>
  );
}
