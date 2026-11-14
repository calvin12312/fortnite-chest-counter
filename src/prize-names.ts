import {
  chest_prize_name_gizmo,
  chest_prize_name_gold_outfit,
  chest_prize_name_jam_track,
  chest_prize_name_loading_screen,
  chest_prize_name_pickaxe_backbling,
  chest_prize_name_pirate_shop,
  chest_prize_name_vehicle_decal,
} from '@/messages';

import type { PrizeId } from './odds';

/** Localised display name of each prize, shared by the odds views. */
export const prizeNames = {
  goldOutfit: chest_prize_name_gold_outfit,
  pirateShop: chest_prize_name_pirate_shop,
  vehicleDecal: chest_prize_name_vehicle_decal,
  pickaxeBackbling: chest_prize_name_pickaxe_backbling,
  jamTrack: chest_prize_name_jam_track,
  loadingScreen: chest_prize_name_loading_screen,
  gizmo: chest_prize_name_gizmo,
} satisfies Record<PrizeId, () => string>;
