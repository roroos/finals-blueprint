# Handover (2026-11-03)

From a cloud session, which could not reach the owner's PC, to a **local session on the owner's Windows PC**, which
can read the HUD screenshots. Conventions and hard rules: [`AGENTS.md`](../AGENTS.md).

## Where things stand

All on `main`, pushed. Each milestone is one commit; typecheck, lint, 40 tests and the build passed locally on each.

| # | Milestone | State |
| --- | --- | --- |
| 1 | Scaffold (Electron, React, TS, Vite, Tailwind, Vitest, ESLint, CI, README, MIT) | done |
| 2 | `docs/RULES.md` from the wiki and Embark's two help-center pages (read 2026-11-03) | done |
| 3 | `rules.ts` + `money.ts` + tests | done |
| 4 | `advisor.ts` + `simulate.ts` + tests, `docs/ADVISOR.md` | done |
| 5 | Manual-input UI; run in a browser (Playwright) and as the built Electron app | done |
| 6 | `docs/SCREEN_READING.md` — plan only, **no implementation** | waiting for approval and captures |
| — | `docs/OPEN_QUESTIONS.md` — every unanswered question, ready-to-send list for Embark | kept up to date |

Verified by running: the rule pages (HTTP 200); Ranked Cashout is the live ranked mode; the money model, the advice
and their invariants on 120 simulated rounds; the UI flows (no console errors); the Electron window is not
always-on-top and refuses `getDisplayMedia`. CI passed on GitHub for the runs that had finished.

Not verified: every money and timer number comes from the community wiki, not Embark; the advisor's chances are
guesses; see `OPEN_QUESTIONS.md`.

## Next task for the local session: read the HUD screenshots

The owner's screenshots are in:

```
C:\Users\roozr\OneDrive\Pictures\Screenshots\Finals
```

The owner says the team money is shown **top left**. This season (started 2026-10-20) has a "Game HUD Rework", so only
these captures count, not older guides.

Steps:

1. Ask the owner for their **resolution, display mode** (fullscreen / borderless / windowed) and **HUD scale**, and
   which round each shot is from.
2. Copy the screenshots into the repo, on a branch, not `main`:
   `git checkout -b captures`, then copy them to `captures/` (keep the original file names), and check none shows an
   Embark ID or other players' names the owner does not want public (the repo may be public).
3. Look at each screenshot and write `captures/README.md`: one row per file with resolution, round, and **the values a
   human reads on it** (each team's cash, the clock, players alive), plus the pixel box of each value (x, y, width,
   height, and as fractions of the frame). These become the test cases of the plan (`tests/screen/cases.json` later).
4. Update `docs/SCREEN_READING.md` with what the captures show: where the cash, clock and alive indicator really are,
   whether teams are listed in a fixed order or told apart by colour, text and backdrop colours, the font (digit
   templates possible?). Tick the matching boxes in `docs/OPEN_QUESTIONS.md`.
5. Commit, push the `captures` branch, and show the owner the result.

**Do not write capture or OCR code.** Implementation waits for the owner's explicit approval of the plan (ideally after
Embark's written answer, see `OPEN_QUESTIONS.md`). Even then: opt-in, off by default, game-window pixels only, a
separate normal window, the in-app warning, never "safe" or "ban-proof".

## Other open work (not started)

- A settings screen for `Assumptions` and `DEFAULT_ODDS` (they are constants in code today).
- More languages (copy `src/i18n/en.ts`, same keys, add the code to `lang.ts` and `index.ts`).
- Packaging (electron-builder) is not set up; `npm start` runs the built app.
