import {
  chest_counter_banner_corrupt,
  chest_counter_banner_newer,
  chest_counter_banner_unavailable,
  chest_counter_banner_write_failed,
  chest_counter_download_raw,
  chest_counter_start_fresh,
} from '@/messages';

import type { Tally } from './tally';

const BTN =
  'h-8 -skew-x-[5deg] border-[3px] border-(--fn-ink) bg-[#1c46c4] px-3 font-(family-name:--fn-cond) text-sm font-extrabold tracking-wide text-white uppercase italic shadow-[inset_0_2px_0_rgba(255,255,255,0.22),0_3px_0_var(--fn-ink)] enabled:cursor-pointer enabled:active:translate-y-[2px]';

/** Storage problem notice at the top of the counter panel; renders nothing when storage is fine. */
export function StorageBanner({ t }: { t: Tally }) {
  const { status } = t;
  let text: string;
  switch (status.state) {
    case 'ok':
      return null;
    case 'unavailable':
      text = chest_counter_banner_unavailable();
      break;
    case 'writeFailed':
      text = chest_counter_banner_write_failed();
      break;
    case 'corrupt':
      text = chest_counter_banner_corrupt();
      break;
    case 'newerVersion':
      text = chest_counter_banner_newer();
      break;
  }
  return (
    <div
      role="alert"
      data-testid="storage-banner"
      data-state={status.state}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-2 border-(--fn-yellow) bg-[rgba(5,13,51,0.7)] px-3 py-2"
    >
      <p className="m-0 flex-1 font-(family-name:--fn-cond) text-sm font-bold text-(--fn-yellow)">
        {text}
      </p>
      {status.state === 'corrupt' && (
        <div className="flex gap-2.5">
          <button type="button" className={BTN} onClick={t.downloadRaw}>
            {chest_counter_download_raw()}
          </button>
          <button type="button" className={BTN} onClick={t.startFresh}>
            {chest_counter_start_fresh()}
          </button>
        </div>
      )}
    </div>
  );
}
