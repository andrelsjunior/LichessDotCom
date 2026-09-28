/** The page's language, as Lichess sets it on <html> (`fr`, `en-US`…). */
export const pageLang = (): string => document.documentElement.lang;

export const isFrench = (): boolean => pageLang().startsWith('fr');
