/** Interface language. Only English for now; add a code here and a table in index.ts to add a language. */
export type Lang = 'en';

export const LANGS: readonly Lang[] = ['en'];

/** Locale used to format numbers and money. */
export const localeOf = (lang: Lang) => ({ en: 'en-US' })[lang];
