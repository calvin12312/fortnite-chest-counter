import { CounterPanel } from './counter-panel';
import { Explainer } from './explainer';
import { OddsPanel } from './odds-panel';
import { ChestShell } from './page-shell';

/** Header, counter and calculator panels side by side on desktop, explainer, footer. */
export function App() {
  return (
    <ChestShell>
      <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:items-start">
          <CounterPanel />
          <OddsPanel />
        </div>
        <Explainer />
      </main>
    </ChestShell>
  );
}
