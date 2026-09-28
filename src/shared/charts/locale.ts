import { pageLang } from '#shared/lang.ts';

/** The page's language for `Intl`, or the browser's when the page names none. */
export function chartLocale(): string | undefined {
  const lang = pageLang();
  // Intl throws on an empty locale.
  return lang === '' ? undefined : lang;
}
