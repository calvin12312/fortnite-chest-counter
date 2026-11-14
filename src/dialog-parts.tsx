import type { ReactNode } from 'react';

import {
  chest_counter_import_cancel,
  chest_counter_import_export_first,
} from '@/messages';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';

/** Footer shared by the chest-counter dialogs: Cancel plus the primary action. */
export function DialogActions({
  onCancel,
  children,
}: {
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <DialogFooter className="-mx-5 -mb-5 rounded-none p-5">
      <Button type="button" variant="outline" onClick={onCancel}>
        {chest_counter_import_cancel()}
      </Button>
      {children}
    </DialogFooter>
  );
}

/** Destructive confirm dialog (import / reset): warning, details, "export first", Cancel + confirm. */
export function ConfirmDialog({
  open,
  title,
  warning,
  confirmLabel,
  onConfirm,
  onCancel,
  onExport,
  children,
}: {
  open: boolean;
  title: string;
  warning: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  onExport: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        showCloseButton={false}
        data-design-theme="fn"
        className="gap-4 rounded-none border-4 border-(--fn-ink) bg-(--fn-panel) p-5 font-(family-name:--fn-body) shadow-[inset_0_0_0_2px_rgba(74,163,255,0.55),0_8px_0_var(--fn-ink)] ring-0"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{warning}</DialogDescription>
        </DialogHeader>
        {children}
        <Button type="button" variant="outline" onClick={onExport}>
          {chest_counter_import_export_first()}
        </Button>
        <DialogActions onCancel={onCancel}>
          <Button type="button" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
