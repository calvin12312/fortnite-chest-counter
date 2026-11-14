import { chest_nav_backup, chest_nav_label, chest_nav_wordmark } from '@/messages';

/** Wordmark (the page's h1) and one anchor link to the backup row. */
export function ChestHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4 sm:px-7">
      <h1 className="m-0 font-(family-name:--fn-display) text-lg font-normal tracking-wide whitespace-nowrap text-white uppercase italic sm:text-3xl">
        <a href="/">{chest_nav_wordmark()}</a>
      </h1>
      <nav
        aria-label={chest_nav_label()}
        className="flex items-center gap-3 font-(family-name:--fn-cond) text-sm font-extrabold tracking-wide whitespace-nowrap text-white uppercase italic sm:gap-6 sm:text-lg"
      >
        <a href="#backup" className="hover:text-(--fn-yellow)">
          {chest_nav_backup()}
        </a>
      </nav>
    </header>
  );
}
