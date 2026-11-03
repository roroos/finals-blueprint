# Finals Blueprint — guide for AI agents and contributors

Read this first, then [`docs/HANDOVER.md`](docs/HANDOVER.md) for where the work stands and what to do next.

## What it is

A desktop app (Electron + React + TypeScript + Vite + Tailwind) for **THE FINALS — Ranked Cashout only**. The player
enters match events by hand; the app keeps every team's cash and recommends the best play now, with expected cash
and the assumptions behind it. A separate normal window, never an overlay.

## Hard rules

1. **Do not invent game numbers.** Every number in `src/services/rules.ts` comes from [`docs/RULES.md`](docs/RULES.md),
   which gives the source URL and the page's "last updated" date. Anything not stated by a source is **UNKNOWN** in
   the docs and a field of `Assumptions` (`DEFAULT_ASSUMPTIONS`) in code, with a comment starting with `UNKNOWN:`.
   `rules.test.ts` enforces that comment. Unanswered questions live in [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md).
2. **Anti-cheat stance.** Never read game memory, inject, hook, or touch game files or processes. No always-on-top or
   transparent overlay. **No screen-capture code** until the owner approves [`docs/SCREEN_READING.md`](docs/SCREEN_READING.md);
   then it is opt-in, off by default, game-window pixels only, with the in-app warning. Never claim the tool is safe
   or ban-proof, anywhere.
3. **Report honestly**: say what was run and tested versus assumed.
4. One commit per milestone or change; `npm run typecheck && npm run lint && npm test && npm run build` green on every
   commit. No lockfile churn or generated data without a reason.

## Layout

- `src/services/` — pure TypeScript, no React, each file with a Vitest test:
  - `rules.ts`: sourced constants (`RULES`) and configurable `Assumptions` for every UNKNOWN.
  - `money.ts`: match state and the event reducer (`applyEvent`): vault, deposit split, steal, completion, Double
    Jeopardy, wipe, eliminations, standings, final-round winner.
  - `advisor.ts`: `recommend(state): Advice[]`, most urgent first, with `expectedGain` / `expectedCash`, a typed
    `reason` (worded by the UI) and `assumptions`. Guessed chances are in `DEFAULT_ODDS`. Explained in
    [`docs/ADVISOR.md`](docs/ADVISOR.md).
  - `simulate.ts`: seeded random rounds; `simulate.test.ts` checks invariants (money ≥ 0, deterministic advice, a
    running cashout of ours is never advised to be abandoned).
- `src/App.tsx` — manual-input UI. Dark theme. **Four text sizes only** (`text-small` 11, `text-body` 12, `text-title`
  14, `text-heading` 16 px, variables in `src/index.css`), enforced by `src/typeScale.test.ts`.
- `src/i18n/` — `en.ts` is the reference table; every language must have the same keys (the `Messages` type). The UI
  never hardcodes text.
- `electron/main.cjs` — one plain window; refuses every permission request, including screen capture.
- `docs/` — `RULES.md`, `ADVISOR.md`, `SCREEN_READING.md`, `OPEN_QUESTIONS.md`, `HANDOVER.md`.

## Commands

- `npm install`, then `npm run dev` (Vite on port 5174 + Electron) or `npm run dev:vite` (browser only).
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm start` (built app in Electron).
- CI (`.github/workflows/ci.yml`, Ubuntu, Node 20): typecheck, lint, test, build.
