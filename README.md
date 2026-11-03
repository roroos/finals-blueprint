# Finals Blueprint

A small desktop app for **THE FINALS — Ranked Cashout**. You tell it what happens in the match (cashout started,
stolen, team wiped, deposit completed…) and it keeps your team's money and suggests the best play right now, with the
expected money of each option and the assumptions behind it.

- Mode: Ranked Cashout only.
- Input: **manual** (big buttons, made for a second monitor or a windowed game).
- Rules last verified: **2026-11-03** (see [`docs/RULES.md`](docs/RULES.md) for every number, its source and what is
  still UNKNOWN).

Not affiliated with or endorsed by Embark Studios. THE FINALS is a trademark of Embark Studios AB.

## Fair play and anti-cheat

THE FINALS uses Easy Anti-Cheat. Embark allows some overlays and assistants only if they do not alter gameplay or give
an unfair advantage, and its ban policy says that even unintentional use of external software interacting with the
game can lead to violations. Embark has published **nothing** about screen reading or OCR tools.

**No one can promise that a third-party tool is safe or "not bannable", and this project does not.** You are
responsible for checking Embark's fair-play rules before using it. If in doubt, ask Embark support in writing and keep
their answer.

What this app does and does not do:

- It never reads game memory, injects code, hooks the game, or touches game files or processes.
- It is a **separate, normal window** (second monitor, or the game windowed). It is not an always-on-top or transparent
  overlay drawn on top of the game.
- v1 has **no screen capture at all**: every input is a button you press. The Electron main process refuses every
  permission request from the page, including screen capture.
- Screen reading may come later, **opt-in and off by default**, reading only pixels of the game window, with an in-app
  warning that Embark has no official statement about it. It is only a plan for now:
  [`docs/SCREEN_READING.md`](docs/SCREEN_READING.md).

## How to run

Requires Node.js 20+.

```bash
npm install
```

```bash
npm run dev
```

`npm run dev` starts Vite on port 5174 and opens the Electron window. To use it in a browser instead, run
`npm run dev:vite` and open http://localhost:5174.

Checks (the same as CI):

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

After a build, `npm start` opens the built app in Electron.

## Using it during a match

1. Pick the round (Round 1, Round 2, Final) and start the clock when the round starts (or set it with −30s / −10s / +10s).
2. Tap what happens: **Picked up box**, **Cashout started**, **Vault opened**, **+1 elimination**, **Team wiped**,
   and for other teams **Vault / Cashout / Wiped** on their row. On a running cashout: **Stolen by …** or **Completed**.
3. Correct any team's cash by typing it in (the HUD is the truth). **Undo** reverts the last tap.
4. **Best plays now** shows the top 3 plays, the expected cash of each and the guesses it relies on
   ([`docs/ADVISOR.md`](docs/ADVISOR.md)).

## Project layout

- `src/services/` — pure TypeScript, no React, each with a Vitest test: game constants with their sources
  (`rules.ts`), money (`money.ts`), the advisor (`advisor.ts`) and simulated rounds used as a regression test
  (`simulate.ts`).
- `src/App.tsx` — the manual-input interface. Four text sizes only (11 / 12 / 14 / 16 px, enforced by
  `src/typeScale.test.ts`).
- `src/i18n/` — interface texts; `en.ts` is the reference and other languages must have the same keys (type-checked).
- `electron/main.cjs` — one plain window, nothing else.
- `docs/` — rules with sources, how the advisor decides, the screen-reading plan.

## License

MIT, see [`LICENSE`](LICENSE).
