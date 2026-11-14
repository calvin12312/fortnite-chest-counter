// English copy for the page. Keys mirror the original i18n catalog; {name} placeholders are filled by the helper.

type Params = Record<string, string | number>;

function fmt(template: string, params?: Params): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(params?.[k] ?? `{${k}}`));
}

export const chest_home_title = (params?: Params): string =>
  fmt("Fortnite Chest Counter & Tracker – Pirate Treasure Odds", params);

export const chest_home_description = (params?: Params): string =>
  fmt("Free Fortnite chest counter and tracker. Log every chest you open and see your odds of each Pirate Treasure prize, including Pirate Shop Access. No account needed.", params);

export const chest_nav_label = (params?: Params): string =>
  fmt("Main", params);

export const chest_nav_wordmark = (params?: Params): string =>
  fmt("Fortnite Chest Counter", params);

export const chest_nav_backup = (params?: Params): string =>
  fmt("Backup", params);

export const chest_about_what_title = (params?: Params): string =>
  fmt("What is the Fortnite Chest Counter?", params);

export const chest_about_what_body_1 = (params?: Params): string =>
  fmt("Fortnite Chest Counter is a free tool for counting the chests you open in Fortnite's Pirate Treasure event. Press +1 Chest every time you open one, and the page shows your chance of having found each of the seven Pirate Treasure prizes, including Pirate Shop Access.", params);

export const chest_about_what_body_2 = (params?: Params): string =>
  fmt("You do not need an account and there is nothing to install. Your count is saved on your own device, and you can back it up to a file whenever you like.", params);

export const chest_about_opened_title = (params?: Params): string =>
  fmt("How many chests have you opened?", params);

export const chest_about_opened_body_1 = (params?: Params): string =>
  fmt("Opened some chests before you found this page? If your in-game quests already show how many chests you have opened, press {setTotal} and enter that number, then press {addOne} to keep counting from there.", params);

export const chest_about_opened_body_2 = (params?: Params): string =>
  fmt("If you do not know how many you opened before, just start counting from now.", params);

export const chest_about_rates_title = (params?: Params): string =>
  fmt("Pirate Treasure drop rates", params);

export const chest_about_rates_intro = (params?: Params): string =>
  fmt("These are the normal drop rates for the seven prizes in Pirate Treasure chests, as listed in Epic's help article. For three of the prizes, Epic lists a higher rate during Treasure Hours.", params);

export const chest_about_rates_caption = (params?: Params): string =>
  fmt("Pirate Treasure drop rates and Treasure Hours boosts", params);

export const chest_about_col_boost = (params?: Params): string =>
  fmt("Treasure Hours boost", params);

export const chest_about_boost_value = (params?: Params): string =>
  fmt("{x}x", params);

export const chest_about_boost_none = (params?: Params): string =>
  fmt("Not boosted", params);

export const chest_about_source_lead = (params?: Params): string =>
  fmt("Source:", params);

export const chest_about_source_link = (params?: Params): string =>
  fmt("Epic's help article on Pirate Treasure drop rates", params);

export const chest_about_calc_title = (params?: Params): string =>
  fmt("How your odds are calculated", params);

export const chest_about_calc_body_1 = (params?: Params): string =>
  fmt("For one prize, the chance of getting it at least once is:", params);

export const chest_about_calc_formula = (params?: Params): string =>
  fmt("chance of at least one = 1 − (1 − rate)^chests", params);

export const chest_about_calc_body_2 = (params?: Params): string =>
  fmt("The rate is the prize's drop rate written as a fraction, so a rate of 1 in {odds} is 1/{odds}.", params);

export const chest_about_calc_example = (params?: Params): string =>
  fmt("Example with {chests} chests: {psName} has a rate of 1 in {psOdds}, so the chance of getting it at least once is {psChance}. {lsName} has a rate of 1 in {lsOdds}, so the chance is {lsChance}.", params);

export const chest_about_calc_caveat = (params?: Params): string =>
  fmt("This counter treats every chest as an independent roll at a constant rate. That is the assumption behind the numbers, so read them as an estimate of your chances, not a countdown to a drop.", params);

export const chest_about_calc_hours = (params?: Params): string =>
  fmt("Chests you log in Treasure Hours mode are calculated with the boost that was set when you logged them.", params);

export const chest_about_hours_title = (params?: Params): string =>
  fmt("What are Fortnite Treasure Hours?", params);

export const chest_about_hours_body_1 = (params?: Params): string =>
  fmt("Epic's help article lists higher rates for three prizes during Treasure Hours: {psName} is {psX}x, {goldName} is {goldX}x, and {vehName} is {vehX}x. The other four prizes are not listed as boosted.", params);

export const chest_about_hours_body_2 = (params?: Params): string =>
  fmt("Epic also says these rates may be higher in future Treasure Hours. That is why the Treasure Hours boost in the counter can be edited: choose Treasure Hours, press Edit next to the boost line and enter the multipliers you want. A new boost only applies to chests you log afterwards.", params);

export const chest_about_hours_source_lead = (params?: Params): string =>
  fmt("When Treasure Hours start is up to Epic, so go by the official announcement:", params);

export const chest_about_hours_source_link = (params?: Params): string =>
  fmt("Epic's Treasure Hunters announcement", params);

export const chest_about_faq_title = (params?: Params): string =>
  fmt("Frequently asked questions", params);

export const chest_about_faq_1_q = (params?: Params): string =>
  fmt("How many chests do I need for a 50% chance at Pirate Shop Access?", params);

export const chest_about_faq_1_a = (params?: Params): string =>
  fmt("At the normal rate of 1 in {odds}, about {n} chests gives you a 50% chance of getting Pirate Shop Access at least once. If every one of those chests were opened in Treasure Hours at the default {x}x boost, it would be about {nBoost} chests. Both are estimates, not guarantees.", params);

export const chest_about_faq_2_q = (params?: Params): string =>
  fmt("Does my chance go up with every chest?", params);

export const chest_about_faq_2_a = (params?: Params): string =>
  fmt("Yes. Each chest you open is another try, so the chance of having found a prize at least once keeps rising as your count grows. The counter gives every chest the same rate; it does not assume any extra bonus after a long run of misses.", params);

export const chest_about_faq_3_q = (params?: Params): string =>
  fmt("Can I get the same treasure twice?", params);

export const chest_about_faq_3_a = (params?: Params): string =>
  fmt("According to Epic's help article, Gizmos are the only treasure you can receive more than once.", params);

export const chest_about_faq_4_q = (params?: Params): string =>
  fmt("How do I add chests I have already opened?", params);

export const chest_about_faq_4_a = (params?: Params): string =>
  fmt("Press {setTotal} and enter the total number of chests you have opened so far, or press {addMultiple} to log a batch of 1 to 999 chests at once. Both count toward All time and your odds. A batch is one entry, so Undo removes the whole batch.", params);

export const chest_about_faq_5_q = (params?: Params): string =>
  fmt("Where is my data saved?", params);

export const chest_about_faq_5_a = (params?: Params): string =>
  fmt("In your browser, on this device. The site does not upload your chest history. Use {backup} to export your data to a file and import it on another browser or device. Clearing your browser data removes it.", params);

export const chest_about_faq_6_q = (params?: Params): string =>
  fmt("Do I need an account?", params);

export const chest_about_faq_6_a = (params?: Params): string =>
  fmt("No. The counter and the calculator are free and need no account or sign-up.", params);

export const chest_about_faq_7_q = (params?: Params): string =>
  fmt("How rare is a Weekly Pickaxe or Back Bling?", params);

export const chest_about_faq_7_a = (params?: Params): string =>
  fmt("Epic lists the {name} at 1 in {odds} per chest. If you open {chests} chests, the chance of getting at least one is {chance}. It is a weekly prize slot, not one specific item. This is an estimate, not a guarantee.", params);

export const chest_footer_disclaimer = (params?: Params): string =>
  fmt("Fan-made. Not affiliated with or endorsed by Epic Games. Fortnite is a trademark of Epic Games, Inc.", params);

export const chest_counter_label = (params?: Params): string =>
  fmt("Counter", params);

export const chest_counter_title = (params?: Params): string =>
  fmt("Chests opened", params);

export const chest_counter_add_one = (params?: Params): string =>
  fmt("+1 Chest", params);

export const chest_counter_odometer_label = (params?: Params): string =>
  fmt("{count} chests opened", params);

export const chest_counter_odometer_label_one = (params?: Params): string =>
  fmt("{count} chest opened", params);

export const chest_counter_today = (params?: Params): string =>
  fmt("Today", params);

export const chest_counter_best_day = (params?: Params): string =>
  fmt("Best day", params);

export const chest_counter_milestones = (params?: Params): string =>
  fmt("Milestones", params);

export const chest_counter_milestone_reached = (params?: Params): string =>
  fmt("reached", params);

export const chest_counter_milestone_not_reached = (params?: Params): string =>
  fmt("not reached", params);

export const chest_odds_title = (params?: Params): string =>
  fmt("What if I open more?", params);

export const chest_odds_chests_label = (params?: Params): string =>
  fmt("Chests I plan to open", params);

export const chest_odds_rate_label = (params?: Params): string =>
  fmt("Drop rate", params);

export const chest_odds_rate_treasure_hours = (params?: Params): string =>
  fmt("Treasure Hours ×{x}", params);

export const chest_odds_table_caption = (params?: Params): string =>
  fmt("Pirate Shop Access: chests for a given chance ({rate})", params);

export const chest_odds_row = (params?: Params): string =>
  fmt("{percent}% chance … {chests} chests", params);

export const chest_odds_note = (params?: Params): string =>
  fmt("Chests you already opened don't change these odds — every chest is treated as the same constant chance.", params);

export const chest_odds_note_treasure_hours = (params?: Params): string =>
  fmt("Treasure Hours uses the boost set in the counter: Pirate Shop ×{pirateShop} · Gold Outfit ×{goldOutfit} · Vehicle & Decal ×{vehicleDecal}. Other prizes stay at their normal rate. Epic says future Treasure Hours may be higher.", params);

export const chest_odds_source = (params?: Params): string =>
  fmt("Source: Epic Games Help Center", params);

export const chest_counter_undo = (params?: Params): string =>
  fmt("Undo", params);

export const chest_counter_add_multiple = (params?: Params): string =>
  fmt("Add multiple", params);

export const chest_counter_add_multiple_label = (params?: Params): string =>
  fmt("Number of chests", params);

export const chest_counter_add_multiple_submit = (params?: Params): string =>
  fmt("Add", params);

export const chest_counter_add_multiple_invalid = (params?: Params): string =>
  fmt("Enter a number from 1 to 999.", params);

export const chest_counter_add_multiple_title = (params?: Params): string =>
  fmt("How many chests?", params);

export const chest_counter_add_multiple_quick = (params?: Params): string =>
  fmt("+{n}", params);

export const chest_counter_add_multiple_placeholder = (params?: Params): string =>
  fmt("e.g. 12", params);

export const chest_counter_add_multiple_hint = (params?: Params): string =>
  fmt("1–999", params);

export const chest_counter_add_multiple_cancel = (params?: Params): string =>
  fmt("Cancel", params);

export const chest_counter_reset_all = (params?: Params): string =>
  fmt("Reset all", params);

export const chest_counter_undid_one = (params?: Params): string =>
  fmt("Undid +1 chest", params);

export const chest_counter_undid_many = (params?: Params): string =>
  fmt("Undid +{n} chests", params);

export const chest_counter_storage_note = (params?: Params): string =>
  fmt("Saved on this device. No account.", params);

export const chest_counter_export = (params?: Params): string =>
  fmt("Export", params);

export const chest_counter_import = (params?: Params): string =>
  fmt("Import", params);

export const chest_counter_import_error_not_backup = (params?: Params): string =>
  fmt("This file isn't a Chest Counter FN backup.", params);

export const chest_counter_import_error_newer = (params?: Params): string =>
  fmt("This backup was made by a newer version of this site.", params);

export const chest_counter_import_error_damaged = (params?: Params): string =>
  fmt("This backup is damaged and can't be imported.", params);

export const chest_counter_import_error_too_large = (params?: Params): string =>
  fmt("This file is too large to be a backup.", params);

export const chest_counter_banner_unavailable = (params?: Params): string =>
  fmt("This browser isn't saving your counts. Export before you close this tab.", params);

export const chest_counter_banner_write_failed = (params?: Params): string =>
  fmt("Your last change wasn't saved. Storage is full. Export a backup now.", params);

export const chest_counter_banner_corrupt = (params?: Params): string =>
  fmt("Saved data couldn't be read.", params);

export const chest_counter_banner_newer = (params?: Params): string =>
  fmt("Your data was saved by a newer version of this site. Reload the page.", params);

export const chest_counter_download_raw = (params?: Params): string =>
  fmt("Download saved data", params);

export const chest_counter_start_fresh = (params?: Params): string =>
  fmt("Start fresh", params);

export const chest_counter_import_title = (params?: Params): string =>
  fmt("Replace the data on this device?", params);

export const chest_counter_import_current = (params?: Params): string =>
  fmt("On this device: {summary}", params);

export const chest_counter_import_incoming = (params?: Params): string =>
  fmt("In the backup: {summary}", params);

export const chest_counter_import_warning = (params?: Params): string =>
  fmt("Importing replaces everything saved here. This can't be undone.", params);

export const chest_counter_import_export_first = (params?: Params): string =>
  fmt("Export current data first", params);

export const chest_counter_import_confirm = (params?: Params): string =>
  fmt("Replace data", params);

export const chest_counter_import_cancel = (params?: Params): string =>
  fmt("Cancel", params);

export const chest_counter_reset_title = (params?: Params): string =>
  fmt("Reset all data?", params);

export const chest_counter_reset_warning = (params?: Params): string =>
  fmt("This can't be undone.", params);

export const chest_counter_reset_confirm = (params?: Params): string =>
  fmt("Reset", params);

export const chest_counter_reset_done = (params?: Params): string =>
  fmt("All data reset", params);

export const chest_counter_summary = (params?: Params): string =>
  fmt("{chests} across {days}", params);

export const chest_counter_n_chests = (params?: Params): string =>
  fmt("{n} chests", params);

export const chest_counter_n_chests_one = (params?: Params): string =>
  fmt("{n} chest", params);

export const chest_counter_n_days = (params?: Params): string =>
  fmt("{n} days", params);

export const chest_counter_n_days_one = (params?: Params): string =>
  fmt("{n} day", params);

export const chest_prize_title = (params?: Params): string =>
  fmt("Pirate Treasure prizes: your odds so far", params);

export const chest_prize_show = (params?: Params): string =>
  fmt("Show", params);

export const chest_prize_col_prize = (params?: Params): string =>
  fmt("Prize", params);

export const chest_prize_col_rate = (params?: Params): string =>
  fmt("Normal drop rate", params);

export const chest_prize_col_chance = (params?: Params): string =>
  fmt("Chance you've gotten one so far", params);

export const chest_prize_odds = (params?: Params): string =>
  fmt("1 in {n}", params);

export const chest_prize_note = (params?: Params): string =>
  fmt("Weekly prizes change every week. These odds are for getting at least one of any week's prize across every chest you've logged — not this week's prize.", params);

export const chest_prize_name_gold_outfit = (params?: Params): string =>
  fmt("Weekly Gold Outfit", params);

export const chest_prize_name_pirate_shop = (params?: Params): string =>
  fmt("Pirate Shop Access", params);

export const chest_prize_name_vehicle_decal = (params?: Params): string =>
  fmt("Weekly Vehicle & Decal", params);

export const chest_prize_name_pickaxe_backbling = (params?: Params): string =>
  fmt("Weekly Pickaxe or Backbling", params);

export const chest_prize_name_jam_track = (params?: Params): string =>
  fmt("Weekly Jam Track", params);

export const chest_prize_name_loading_screen = (params?: Params): string =>
  fmt("Weekly Loading Screen", params);

export const chest_prize_name_gizmo = (params?: Params): string =>
  fmt("Gizmo (any)", params);

export const chest_mode_label = (params?: Params): string =>
  fmt("Chest multiplier", params);

export const chest_mode_standard = (params?: Params): string =>
  fmt("Standard", params);

export const chest_mode_treasure_hours = (params?: Params): string =>
  fmt("Treasure Hours", params);

export const chest_mode_boost = (params?: Params): string =>
  fmt("Boost: Pirate Shop ×{pirateShop} · Gold Outfit ×{goldOutfit} · Vehicle & Decal ×{vehicleDecal}", params);

export const chest_mode_edit = (params?: Params): string =>
  fmt("Edit", params);

export const chest_boost_title = (params?: Params): string =>
  fmt("Edit Treasure Hours boost", params);

export const chest_boost_description = (params?: Params): string =>
  fmt("Applies to chests you log from now on. Chests already logged keep the boost they had.", params);

export const chest_boost_pirate_shop = (params?: Params): string =>
  fmt("Pirate Shop", params);

export const chest_boost_gold_outfit = (params?: Params): string =>
  fmt("Gold Outfit", params);

export const chest_boost_vehicle_decal = (params?: Params): string =>
  fmt("Vehicle & Decal", params);

export const chest_boost_invalid = (params?: Params): string =>
  fmt("Enter a number from 1 to 100 with at most one decimal.", params);

export const chest_boost_save = (params?: Params): string =>
  fmt("Save", params);

export const chest_set_total_button = (params?: Params): string =>
  fmt("Set total", params);

export const chest_set_total_empty = (params?: Params): string =>
  fmt("Already opened chests? Set your total", params);

export const chest_set_total_title = (params?: Params): string =>
  fmt("Set your total", params);

export const chest_set_total_description = (params?: Params): string =>
  fmt("Counts toward All time and odds, not toward Today or Best day.", params);

export const chest_set_total_label = (params?: Params): string =>
  fmt("Your total chests", params);

export const chest_set_total_invalid = (params?: Params): string =>
  fmt("Enter a whole number from {min} to 99,999,999.", params);

export const chest_set_total_save = (params?: Params): string =>
  fmt("Save total", params);

export const chest_counter_undid_start = (params?: Params): string =>
  fmt("Undid starting total of {n}", params);

export const chest_counter_add_one_th = (params?: Params): string =>
  fmt("+1 Treasure Hours chest", params);

export const chest_odds_quick_label = (params?: Params): string =>
  fmt("Quick amounts", params);

export const chest_odds_results_title = (params?: Params): string =>
  fmt("Chance of at least one in {n} chests", params);

export const chest_odds_results_title_one = (params?: Params): string =>
  fmt("Chance of at least one in 1 chest", params);

export const chest_odds_col_chance = (params?: Params): string =>
  fmt("Chance of at least one", params);

export const chest_odds_note_rate = (params?: Params): string =>
  fmt("Pirate Shop Access uses Epic's published rate: 1 in 137,500 per chest opened in a normal match. This is an estimate, not a countdown.", params);

export const chest_set_total_current = (params?: Params): string =>
  fmt("You've logged {n} chests.", params);

export const chest_set_total_current_one = (params?: Params): string =>
  fmt("You've logged 1 chest.", params);

export const chest_set_total_description_has_records = (params?: Params): string =>
  fmt("Enter a larger total and the difference is added as a starting total. It counts toward All time and odds, not toward Today or Best day.", params);

export const chest_set_total_reset_hint = (params?: Params): string =>
  fmt("To start over from zero, use Reset all.", params);
