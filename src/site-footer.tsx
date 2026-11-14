import { chest_footer_disclaimer } from '@/messages';

const SITE_URL = 'https://chestcounterfn.com';
const REPO_URL = 'https://github.com/calvin12312/fortnite-chest-counter';

export function ChestFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-(--fn-mute) sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <p>{chest_footer_disclaimer()}</p>
      <nav className="flex flex-wrap gap-x-5 gap-y-2 font-(family-name:--fn-cond) text-base font-extrabold tracking-wide text-white uppercase italic">
        <a href={SITE_URL} className="hover:text-(--fn-yellow)">
          chestcounterfn.com
        </a>
        <a href={REPO_URL} className="hover:text-(--fn-yellow)">
          Source
        </a>
      </nav>
    </footer>
  );
}
