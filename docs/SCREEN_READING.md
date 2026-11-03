# Screen reading: plan only (not implemented)

Status: **proposal, waiting for approval.** There is no capture code in the app. Nothing here gets implemented until
(1) the owner approves this plan and (2) real HUD captures at the owner's resolution are in the repo (`captures/`).
v1 stays manual input.

## Goal

Fill in automatically what the player now types: **each team's cash** (top left of the HUD, per the owner's
screenshots), and if it proves reliable, the **round clock**. Everything else stays manual (who stole, who was wiped,
who carries the box). The advisor and money model do not change: screen reading only produces the same events
(`setCash`, `setTime`) as the buttons.

## Risk, stated plainly

- THE FINALS uses Easy Anti-Cheat. Embark allows overlays and assistants only if they do not alter gameplay or give an
  unfair advantage, and its ban policy says even unintentional use of external software interacting with the game
  can lead to violations. **Embark has published nothing about screen capture or OCR.** No one can say this is safe.
- Reading pixels is the least intrusive method that exists (no memory, no injection, no hooks, no game files), but
  "least intrusive" is not "allowed". Advice derived from it could still be judged an unfair advantage.
- Recommendation: before shipping it, **ask Embark support in writing** and keep the answer in the repo
  (`docs/EMBARK_ANSWER.md`). If they say no, the feature is not built.

## Constraints (non-negotiable)

1. **Opt-in and off by default.** A settings switch, off at every launch until turned on in that session (no
   "remember").
2. Before the first frame, a **blocking warning** the player must accept: "Embark has no official statement on screen
   reading tools. Using it is at your own risk and may break their rules. Manual input works without it."
3. **Read-only pixels of the game window** through Electron `desktopCapturer`, the window picked by the player from
   the system list (never the whole desktop, never another process's memory). In the main process: no access to the
   game process, its files, input or windows beyond that capture.
4. **Low rate:** 1 frame per second at most, only the small regions to read are kept; frames are never saved to disk
   unless the player presses "save a calibration frame".
5. Still a **separate normal window**. No overlay on the game, no always-on-top.
6. A visible "Reading screen" indicator and a one-click stop. Manual values always win over read values.
7. Read values are only used after they agree on **2 consecutive frames** and pass sanity checks (cash ≥ 0, changes
   that match a known event size or a manual correction), otherwise ignored.

## What to read

| Item | Where | Why | Priority |
| --- | --- | --- | --- |
| Team cash (all teams) | top left (owner's screenshots) | the main manual chore today; drives standings and advice | 1 |
| Round clock | **UNKNOWN** until captures | keeps cashout timers right | 2 |
| Our team alive (0-3) | **UNKNOWN** until captures | wipe risk in the advice | 3, only if trivially reliable |

Not planned: cashout station state, steals, who carries the box. They need the 3D scene or icons that move, and
reading them would get closer to "gameplay assistance".

The current season (started 2026-10-20) lists a **"Game HUD Rework"**: positions and fonts must come from captures
of this season, at the owner's settings, not from older guides or videos.

## How calibration would work

1. The player plays borderless windowed or windowed (exclusive fullscreen often captures as a black frame) and presses
   "save a calibration frame" during a match, with all teams' cash visible.
2. On that frame the app shows the HUD and the player **drags a box over each team's cash** (and the clock, if used).
   Boxes are stored as fractions of the frame (resolution independent), with the resolution and HUD scale they were
   taken at. A change of resolution asks to recalibrate.
3. Reading: crop each box, scale it ×2-3, threshold it (the cash text is light on a dark backdrop, to be confirmed on
   captures), then read digits. Two options to compare on the captures, picking the more accurate:
   - **Digit templates:** the HUD uses one font; cut `0-9`, `$` and `,` from the captures once and match them. Fast,
     no dependency, exact on a fixed font and scale.
   - **Tesseract.js** with a digits-only whitelist, as Deadlock Blueprint does. More tolerant, heavier, slower.
4. Each team box also needs the team's identity: by **position order** (if the HUD lists teams in a fixed order) or by
   team colour. UNKNOWN until captures.

## Tests before it can ship

- `tests/screen/`: the owner's captures, each with the values a human reads on it (`cases.json`).
- A Vitest/Electron replay runs the reader on every capture: **100 % of cash values exact** (a wrong cash is worse
  than none), clock within 1 s.
- Captures at other scales (simulated by resizing) to see how fragile the calibration is.

## What is needed from the owner

1. Approval of this plan (or changes to it).
2. The captures, committed to `captures/` (or dragged into the chat): several frames per round type, with cash values
   that differ (including a 5-6 digit value and $0), a running cashout, and if possible a team wipe.
3. Resolution, display mode (fullscreen / borderless / windowed) and HUD scale used.
4. Ideally, Embark's written answer about screen-reading tools.
