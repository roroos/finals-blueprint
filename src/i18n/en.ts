/**
 * English interface texts: the reference table. Every other language must have exactly the same keys and parameter
 * types (the `Messages` type, enforced by TypeScript). A message is a string or a function of its parameters.
 */
export const MESSAGES_EN = {
  'app.title': 'Finals Blueprint',
  'app.subtitle': 'Ranked Cashout money calculator and play advisor',
  'app.rulesVerified': (date: string) => `Rules last verified ${date}`,
  'fairplay.short':
    "Manual input only. This app does not read game memory, inject, hook, or capture the screen. Check Embark's fair-play rules yourself: no one can promise a third-party tool is safe.",
};

/** The shape every language table must have: same keys, same parameters. */
export type Messages = { [K in keyof typeof MESSAGES_EN]: (typeof MESSAGES_EN)[K] };
