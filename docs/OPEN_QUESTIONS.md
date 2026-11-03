# Open questions

Everything still unanswered, in one place. When one is answered, write the answer and its source here, update
[`RULES.md`](RULES.md) and the matching constant in `src/services/rules.ts`, and tick the box.

Last reviewed: 2026-11-03.

## Game rules (UNKNOWN in every source read)

Each one is a configurable assumption in `src/services/rules.ts` (`DEFAULT_ASSUMPTIONS`) until answered.

- [ ] **Vault 5 & 6 bonus:** is the bonus on insert $4,000 (the wiki's "Ways to Gain Cash" list) or $4,400 (20 % of
  $22,000)? Is that box really $22,000? — `vault56Bonus`, default $4,000.
- [ ] **Knockout cashout length:** 2:10 or 2:00? The wiki says both. — `knockoutCashoutS`, default 2:10.
- [ ] **Late cashouts:** does a cashout started late last "time left + up to 1 min of overtime", with a 1 min minimum?
  — `lateCashoutShortens`, default yes.
- [ ] **Final round split:** does the 20 % on insert / 80 % on completion split apply in the final? —
  `finalUsesInsertSplit`, default no (whole box on completion).
- [ ] **Final round wipe:** is a team wipe in the final penalised in cash? — `finalWipeLossShare`, default 0.
- [ ] **Where the 15 % goes** after a team wipe in a knockout round: lost, or given to someone?
- [ ] **Final round rewards:** are the $1,000 for opening a vault and the $500 per elimination also paid in the final? —
  `finalPaysVaultAndEliminationRewards`, default yes.
- [ ] **Double Jeopardy on your own station:** does it apply when the second box goes into a station your team
  already owns? — `doubleJeopardyOnOwnStation`, default yes.
- [ ] **Extra box into another team's station:** does the inserting team become the owner? —
  `extraBoxTakesOwnership`, default no.
- [ ] **Extra box bonus:** does each extra box pay its own insert bonus? — `extraBoxPaysBonus`, default yes.
- [ ] **Steal and the timer:** does a steal restart the cashout timer or keep it running? — `stealRestartsTimer`,
  default keeps running.
- [ ] **Depositor's bonus after a steal:** does the team that inserted the box keep its 20 %? Assumed yes.
- [ ] **Round end:** does cash in a cashout that is still running count when the round ends?
- [ ] **Tie for 2nd place** at the end of a knockout round: who advances?
- [ ] **Final that times out** (14 min, nobody at $50,000): who wins?
- [ ] **Other teams' cash:** is it shown on the HUD during a ranked match? (The app assumes the player can read it.)
- [ ] **Rank Score formula:** none published. Embark only says it depends on placement, teammates' and opponents'
  ranks and the match outcome; the wiki adds seeding and, since Season 11, personal performance.
- [ ] **This season's HUD rework** (season started 2026-10-20): did it change any money rule?

## Advisor guesses (not game facts)

- [ ] **Chances by players alive** in `DEFAULT_ODDS` (`src/services/advisor.ts`): to hold a cashout, steal, win a
  vault fight, get wiped. Replace them with rates from real matches if you can track them.
- [ ] **Number of opposing teams** (3 in knockout rounds, 1 in the final) is not used by those chances. Should it be?

## Screen reading (plan in [`SCREEN_READING.md`](SCREEN_READING.md))

- [ ] **Approval** of the plan, or changes to it.
- [ ] **HUD captures** at the owner's settings, committed to `captures/`: several frames per round type, cash values
  that differ (including a 5-6 digit value and $0), a running cashout and, if possible, a team wipe.
- [ ] **Resolution, display mode** (fullscreen / borderless / windowed) **and HUD scale** of those captures.
- [ ] **Where the clock and the "alive" indicator are** on this season's HUD (from the captures).
- [ ] **Team identity on the HUD:** are teams listed in a fixed order, or told apart by colour?
- [ ] **Embark's written answer** about screen-reading tools, saved as `docs/EMBARK_ANSWER.md`.

## Questions to send Embark support

A ready-to-send list for Embark's help center (https://id.embark.games/the-finals/support, the site of the FAQ pages in RULES.md):

1. Is a separate desktop app that reads the pixels of the game window (screen capture and OCR, no memory access, no
   injection, no overlay) allowed alongside THE FINALS under Easy Anti-Cheat and your fair-play rules?
2. In Ranked Cashout, is the insert bonus for vaults 5 & 6 $4,000 or $4,400?
3. Does the 20 % / 80 % split apply in the final round, and is a team wipe penalised in the final?
4. Does Double Jeopardy apply when the second Cash Box goes into a station your own team owns?
5. After a steal, does the cashout timer continue or restart?
6. How are ties for 2nd place broken in a knockout round, and who wins a final that ends without a team at $50,000?
