import type { ReactNode } from 'react';

import { ChestFooter } from './site-footer';
import { ChestHeader } from './site-header';

/** fn-themed page frame: background, header and footer. */
export function ChestShell({ children }: { children: ReactNode }) {
  return (
    <div
      data-design-theme="fn"
      className="flex min-h-screen touch-pan-x touch-pan-y flex-col bg-(--fn-deep) [background-image:repeating-linear-gradient(115deg,rgba(255,255,255,0.045)_0_22px,transparent_22px_64px),var(--gradient-page)] font-(family-name:--fn-body) text-white"
    >
      <ChestHeader />
      <div className="flex-1">{children}</div>
      <ChestFooter />
    </div>
  );
}
