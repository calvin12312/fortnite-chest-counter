import {
  chest_counter_import_confirm,
  chest_counter_import_current,
  chest_counter_import_incoming,
  chest_counter_import_title,
  chest_counter_import_warning,
  chest_counter_n_chests,
  chest_counter_n_chests_one,
  chest_counter_n_days,
  chest_counter_n_days_one,
  chest_counter_summary,
} from '@/messages';

import { ConfirmDialog } from './dialog-parts';
import type { Summary } from './tally/types';

const m = {
  confirm: chest_counter_import_confirm,
  current: chest_counter_import_current,
  incoming: chest_counter_import_incoming,
  title: chest_counter_import_title,
  warning: chest_counter_import_warning,
  chests: chest_counter_n_chests,
  chestsOne: chest_counter_n_chests_one,
  days: chest_counter_n_days,
  daysOne: chest_counter_n_days_one,
  summary: chest_counter_summary,
};

const fmt = (n: number) => n.toLocaleString('en-US');

export function describe(s: Summary): string {
  const n = fmt(s.allTime);
  const d = fmt(s.days);
  return m.summary({
    chests: s.allTime === 1 ? m.chestsOne({ n }) : m.chests({ n }),
    days: s.days === 1 ? m.daysOne({ n: d }) : m.days({ n: d }),
  });
}

/** Confirm step before an import overwrites local data. Closed when `preview` is null. */
export function ImportDialog({
  preview,
  onConfirm,
  onCancel,
  onExport,
}: {
  preview: { current: Summary; incoming: Summary } | null;
  onConfirm: () => void;
  onCancel: () => void;
  onExport: () => void;
}) {
  return (
    <ConfirmDialog
      open={preview !== null}
      title={m.title()}
      warning={m.warning()}
      confirmLabel={m.confirm()}
      onConfirm={onConfirm}
      onCancel={onCancel}
      onExport={onExport}
    >
      {preview && (
        <ul className="m-0 grid list-none gap-1 p-0 text-sm">
          <li>{m.current({ summary: describe(preview.current) })}</li>
          <li>{m.incoming({ summary: describe(preview.incoming) })}</li>
        </ul>
      )}
    </ConfirmDialog>
  );
}
