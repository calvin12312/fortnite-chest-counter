import {
  chest_about_boost_none,
  chest_about_boost_value,
  chest_about_calc_body_1,
  chest_about_calc_body_2,
  chest_about_calc_caveat,
  chest_about_calc_example,
  chest_about_calc_formula,
  chest_about_calc_hours,
  chest_about_calc_title,
  chest_about_col_boost,
  chest_about_faq_title,
  chest_about_hours_body_1,
  chest_about_hours_body_2,
  chest_about_hours_source_lead,
  chest_about_hours_source_link,
  chest_about_hours_title,
  chest_about_opened_body_1,
  chest_about_opened_body_2,
  chest_about_opened_title,
  chest_about_rates_caption,
  chest_about_rates_intro,
  chest_about_rates_title,
  chest_about_source_lead,
  chest_about_source_link,
  chest_about_what_body_1,
  chest_about_what_body_2,
  chest_about_what_title,
  chest_counter_add_one,
  chest_prize_col_prize,
  chest_prize_col_rate,
  chest_prize_odds,
  chest_set_total_button,
} from '@/messages';

import { EXAMPLE_CHESTS, exampleChance, faqItems, oddsOf } from './about-copy';
import { PRIZES, SOURCE, type PrizeId } from './odds';
import { prizeNames } from './prize-names';
import { DEFAULT_BOOST } from './tally/types';

const m = {
  boostNone: chest_about_boost_none,
  boostValue: chest_about_boost_value,
  calcBody1: chest_about_calc_body_1,
  calcBody2: chest_about_calc_body_2,
  calcCaveat: chest_about_calc_caveat,
  calcExample: chest_about_calc_example,
  calcFormula: chest_about_calc_formula,
  calcHours: chest_about_calc_hours,
  calcTitle: chest_about_calc_title,
  colBoost: chest_about_col_boost,
  colPrize: chest_prize_col_prize,
  colRate: chest_prize_col_rate,
  faqTitle: chest_about_faq_title,
  hoursBody1: chest_about_hours_body_1,
  hoursBody2: chest_about_hours_body_2,
  hoursSourceLead: chest_about_hours_source_lead,
  hoursSourceLink: chest_about_hours_source_link,
  hoursTitle: chest_about_hours_title,
  addOne: chest_counter_add_one,
  odds: chest_prize_odds,
  openedBody1: chest_about_opened_body_1,
  openedBody2: chest_about_opened_body_2,
  openedTitle: chest_about_opened_title,
  ratesCaption: chest_about_rates_caption,
  ratesIntro: chest_about_rates_intro,
  ratesTitle: chest_about_rates_title,
  sourceLead: chest_about_source_lead,
  setTotal: chest_set_total_button,
  sourceLink: chest_about_source_link,
  whatBody1: chest_about_what_body_1,
  whatBody2: chest_about_what_body_2,
  whatTitle: chest_about_what_title,
  names: prizeNames,
};

const H2 =
  'm-0 font-(family-name:--fn-display) text-2xl tracking-wide italic sm:text-3xl';
const H3 =
  'm-0 font-(family-name:--fn-cond) text-xl font-extrabold tracking-wide text-white';
const P = 'm-0 text-(--fn-mute)';
/** Epic's Treasure Hunters announcement; Treasure Hours start times are listed by Epic, not here. */
const HOURS_ANNOUNCEMENT_URL =
  'https://communities.epicgames.com/thread/set-sail-for-fortnite-treasure-hunters-the-greatest-adventure-of-all-time/Pmud';
const LINK = 'font-semibold text-(--fn-yellow) underline underline-offset-4';

/**
 * Server-rendered explainer under the counter and calculator: what the tool is, the
 * seven-tier drop-rate table, how odds are calculated, Treasure Hours and the FAQ.
 * All facts come from Epic's help article (SOURCE) or from how this site behaves;
 * every number is computed from odds.ts. The FAQ text is shared with the head's
 * FAQPage JSON-LD through `faqItems()`. Prose is capped at a readable width.
 */
export function Explainer() {
  const faq = faqItems();
  const boostOf = (id: PrizeId) => {
    const key = PRIZES.find((p) => p.id === id)?.boostKey;
    return key ? DEFAULT_BOOST[key] : null;
  };

  return (
    <div className="grid gap-12 py-8">
      <section aria-labelledby="about-what" className="grid max-w-3xl gap-3">
        <h2 id="about-what" className={H2}>
          {m.whatTitle()}
        </h2>
        <p className={P}>{m.whatBody1()}</p>
        <p className={P}>{m.whatBody2()}</p>
      </section>

      <section aria-labelledby="about-opened" className="grid max-w-3xl gap-3">
        <h2 id="about-opened" className={H2}>
          {m.openedTitle()}
        </h2>
        <p className={P}>
          {m.openedBody1({
            setTotal: m.setTotal(),
            addOne: m.addOne(),
          })}
        </p>
        <p className={P}>{m.openedBody2()}</p>
      </section>

      <section aria-labelledby="about-rates" className="grid max-w-3xl gap-3">
        <h2 id="about-rates" className={H2}>
          {m.ratesTitle()}
        </h2>
        <p className={P}>{m.ratesIntro()}</p>
        <table className="w-full border-collapse font-(family-name:--fn-cond) tabular-nums">
          <caption className="sr-only">{m.ratesCaption()}</caption>
          <thead>
            <tr className="border-b-2 border-white/30 text-left text-sm tracking-wider text-(--fn-mute) uppercase">
              <th scope="col" className="py-1.5 pr-2 pl-2.5 font-bold">
                {m.colPrize()}
              </th>
              <th scope="col" className="py-1.5 pr-2 font-bold">
                {m.colRate()}
              </th>
              <th scope="col" className="py-1.5 pr-2.5 font-bold">
                {m.colBoost()}
              </th>
            </tr>
          </thead>
          <tbody>
            {PRIZES.map(({ id }) => {
              const boost = boostOf(id);
              return (
                <tr
                  key={id}
                  data-prize={id}
                  className="border-b border-white/15"
                >
                  <th
                    scope="row"
                    className={`py-1.5 pr-2 pl-2.5 text-left text-base leading-tight font-bold text-white`}
                  >
                    {m.names[id]()}
                  </th>
                  <td className="py-1.5 pr-2 text-sm font-semibold whitespace-nowrap text-white sm:text-base">
                    {m.odds({ n: oddsOf(id) })}
                  </td>
                  <td
                    className={`py-1.5 pr-2.5 text-sm font-semibold sm:text-base ${
                      boost === null ? 'text-(--fn-mute)' : 'text-white'
                    }`}
                  >
                    {boost === null
                      ? m.boostNone()
                      : m.boostValue({ x: String(boost) })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="m-0 text-sm text-(--fn-mute)">
          {m.sourceLead()}{' '}
          <a
            href={SOURCE.url}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK}
          >
            {m.sourceLink()}
          </a>
        </p>
      </section>

      <section aria-labelledby="about-calc" className="grid max-w-3xl gap-3">
        <h2 id="about-calc" className={H2}>
          {m.calcTitle()}
        </h2>
        <p className={P}>{m.calcBody1()}</p>
        <p className="m-0 border-l-4 border-(--fn-yellow) bg-white/5 px-3 py-2 font-(family-name:--fn-cond) text-lg font-bold text-white">
          {m.calcFormula()}
        </p>
        <p className={P}>{m.calcBody2({ odds: oddsOf('pirateShop') })}</p>
        <p className={P}>
          {m.calcExample({
            chests: EXAMPLE_CHESTS.toLocaleString('en-US'),
            psName: m.names.pirateShop(),
            psOdds: oddsOf('pirateShop'),
            psChance: exampleChance('pirateShop'),
            lsName: m.names.loadingScreen(),
            lsOdds: oddsOf('loadingScreen'),
            lsChance: exampleChance('loadingScreen'),
          })}
        </p>
        <p className={P}>{m.calcCaveat()}</p>
        <p className={P}>{m.calcHours()}</p>
      </section>

      <section aria-labelledby="about-hours" className="grid max-w-3xl gap-3">
        <h2 id="about-hours" className={H2}>
          {m.hoursTitle()}
        </h2>
        <p className={P}>
          {m.hoursBody1({
            psName: m.names.pirateShop(),
            psX: String(DEFAULT_BOOST.pirateShop),
            goldName: m.names.goldOutfit(),
            goldX: String(DEFAULT_BOOST.goldOutfit),
            vehName: m.names.vehicleDecal(),
            vehX: String(DEFAULT_BOOST.vehicleDecal),
          })}
        </p>
        <p className={P}>
          {m.hoursBody2()} {m.hoursSourceLead()}{' '}
          <a
            href={HOURS_ANNOUNCEMENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK}
          >
            {m.hoursSourceLink()}
          </a>
        </p>
      </section>

      <section aria-labelledby="about-faq" className="grid max-w-3xl gap-4">
        <h2 id="about-faq" className={H2}>
          {m.faqTitle()}
        </h2>
        {faq.map(({ q, a }) => (
          <div key={q} className="grid gap-1">
            <h3 className={H3}>{q}</h3>
            <p className={P}>{a}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
