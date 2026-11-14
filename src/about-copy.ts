import {
  chest_about_faq_1_a,
  chest_about_faq_1_q,
  chest_about_faq_2_a,
  chest_about_faq_2_q,
  chest_about_faq_3_a,
  chest_about_faq_3_q,
  chest_about_faq_4_a,
  chest_about_faq_4_q,
  chest_about_faq_5_a,
  chest_about_faq_5_q,
  chest_about_faq_6_a,
  chest_about_faq_6_q,
  chest_about_faq_7_a,
  chest_about_faq_7_q,
  chest_counter_add_multiple,
  chest_nav_backup,
  chest_prize_name_pickaxe_backbling,
  chest_set_total_button,
} from '@/messages';

import {
  BASE_ODDS,
  chestsForChance,
  formatChance,
  prizeChances,
  PRIZES,
  type PrizeId,
} from './odds';
import { DEFAULT_BOOST } from './tally/types';

const number = new Intl.NumberFormat('en-US');

/** Chest count in the "How rare is a Weekly Pickaxe or Back Bling?" FAQ answer. */
export const RARITY_FAQ_CHESTS = 100;

/** Chest count of the worked example in "How your odds are calculated". */
export const EXAMPLE_CHESTS = 1000;

/** Normal drop rate of a tier as "1 in N" digits, straight from PRIZES. */
export function oddsOf(id: PrizeId): string {
  const prize = PRIZES.find((p) => p.id === id);
  return number.format(prize ? prize.odds : 0);
}

/** Chance (formatted) of at least one of each tier after `n` standard chests, from prizeChances. */
export function exampleChance(id: PrizeId, n = EXAMPLE_CHESTS): string {
  return formatChance(prizeChances([{ kind: 'open', at: 0, n }])[id]);
}

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * The FAQ as plain text. The visible FAQ and the FAQPage JSON-LD in the head both read
 * this, so the two always match. Numbers come from odds.ts.
 */
export function faqItems(): FaqItem[] {
  return [
    {
      q: chest_about_faq_1_q(),
      a: chest_about_faq_1_a({
        odds: number.format(BASE_ODDS),
        n: number.format(chestsForChance(0.5)),
        x: String(DEFAULT_BOOST.pirateShop),
        nBoost: number.format(chestsForChance(0.5, DEFAULT_BOOST.pirateShop)),
      }),
    },
    { q: chest_about_faq_2_q(), a: chest_about_faq_2_a() },
    { q: chest_about_faq_3_q(), a: chest_about_faq_3_a() },
    {
      q: chest_about_faq_4_q(),
      a: chest_about_faq_4_a({
        setTotal: chest_set_total_button(),
        addMultiple: chest_counter_add_multiple(),
      }),
    },
    {
      q: chest_about_faq_5_q(),
      a: chest_about_faq_5_a({ backup: chest_nav_backup() }),
    },
    { q: chest_about_faq_6_q(), a: chest_about_faq_6_a() },
    {
      q: chest_about_faq_7_q(),
      a: chest_about_faq_7_a({
        name: chest_prize_name_pickaxe_backbling(),
        odds: oddsOf('pickaxeBackbling'),
        chests: number.format(RARITY_FAQ_CHESTS),
        chance: exampleChance('pickaxeBackbling', RARITY_FAQ_CHESTS),
      }),
    },
  ];
}
