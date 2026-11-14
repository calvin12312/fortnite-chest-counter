import {
  chest_counter_import_current,
  chest_counter_reset_confirm,
  chest_counter_reset_title,
  chest_counter_reset_warning,
} from '@/messages';

import { ConfirmDialog } from './dialog-parts';
import { describe } from './import-dialog';
import type { Summary } from './tally/types';

const m = {
  confirm: chest_counter_reset_confirm,
  current: chest_counter_import_current,
  title: chest_counter_reset_title,
  warning: chest_counter_reset_warning,
};

/** Confirm step before Reset all clears every record. Closed when `summary` is null. */
export function ResetDialog({
  summary,
  onConfirm,
  onCancel,
  onExport,
}: {
  summary: Summary | null;
  onConfirm: () => void;
  onCancel: () => void;
  onExport: () => void;
}) {
  return (
    <ConfirmDialog
      open={summary !== null}
      title={m.title()}
      warning={m.warning()}
      confirmLabel={m.confirm()}
      onConfirm={onConfirm}
      onCancel={onCancel}
      onExport={onExport}
    >
      {summary && (
        <p className="m-0 text-sm">
          {m.current({ summary: describe(summary) })}
        </p>
      )}
    </ConfirmDialog>
  );
}
