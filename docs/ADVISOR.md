# How the advisor decides (`src/services/advisor.ts`)

`recommend(state)` lists candidate plays, most urgent first. Each one has an **expected money** figure (our banked
cash after the play, on average) and the list of **assumptions** behind it. The app shows the top 3.

## What it optimises

The rules ([RULES.md](RULES.md)) make cash matter only through placement:

- **Knockout rounds (1 and 2):** finish in the **top 2 by cash** of the 4 teams.
- **Final:** reach **$50,000 first**.

The Rank Score formula is UNKNOWN, so the advisor does not try to optimise RS.

## Game facts vs assumptions

| Used by the advisor | Kind |
| --- | --- |
| Box values, the 20 % / 80 % split, steal reward, wipe penalty, Double Jeopardy −50 %, $50,000 target, 2 stations, timers | **Game facts** from the community wiki (see RULES.md), in `rules.ts` |
| Every field of `Assumptions` in `rules.ts` (vault 5-6 bonus, final split, final wipe penalty, ownership after an extra box, …) | **UNKNOWN in the sources**, configurable defaults |
| `Odds` in `advisor.ts`: chance to hold a cashout, steal, win a vault, get wiped, by players alive | **Pure guesses.** No source gives them. Change them freely |
| `vaultsLeftEstimate`: 2 vaults at the start (1 in the final), +1 per completed cashout, minus boxes inserted | **Estimate.** The app cannot see the map |

Default odds, by players alive (0 / 1 / 2 / 3):

| Odds | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| hold a cashout for its full length | 0 | 0.25 | 0.45 | 0.60 |
| complete a steal | 0 | 0.10 | 0.25 | 0.40 |
| get the box from a contested vault | 0 | 0.15 | 0.35 | 0.50 |
| get wiped when taking a fight | 1 | 0.60 | 0.40 | 0.25 |

The chance to hold scales with the time left: `1 − (1 − base) × remaining / full length`. The number of opposing
teams (3 in knockout, 1 in the final) is **not** modelled.

## The rules, by priority (urgency 0-100)

| Play | When | Urgency | Expected gain |
| --- | --- | --- | --- |
| **Hold: team respawn** | our team is wiped | 100 | 0 |
| **Defend the cashbox** | we own a running cashout | 85, +10 if it is **decisive** (it puts us in the top 2, or takes us to $50,000), +4 in its last 30 s | `pHold × stored` (− the Double Jeopardy risk if we added a 2nd box) |
| **Steal** | they own a cashout that **wins them the final** | 98 | `pSteal × (reward + pKeep × stored) − wipe risk` |
| **Hold: safe lead** | knockout, top 2, and still ahead of 3rd even in the worst case | 92 | 0 |
| **Deposit now** | we carry a box and a station is free | 90 | `bonus + pHold × stored` |
| **Deposit now / Hold the box** | we carry a box but both stations run: inserting triggers **Double Jeopardy** | deposit 80 and hold 70 if the deposit's expected gain is positive, otherwise hold 88 and deposit 40 | `bonus + pOwn × gain − (1 − pOwn) × 50 % of our cash` |
| **Avoid a fight** | one of us alive, no cashout of ours | 86 | 0 (the wipe risk avoided is shown) |
| **Steal** | their cashout would **push us out of the top 2** | 84 | as above |
| **Steal** | any other cashout of theirs with at least the steal time left | 70, +8 if we are outside the top 2 | as above |
| **Contest a vault** | nothing carried, a vault probably left, more than 20 s on the clock | 60, +5 if we are outside the top 2 | `pBox × ($1,000 + bonus + pHold × stored) − wipe risk` |
| **Avoid a fight** | no steal or vault with a positive expected gain | 55 | 0 |

Wipe risk = `pWiped × 15 % of our cash` in knockout rounds (the final's penalty is UNKNOWN, default 0).

**Hard rule:** while we own a running cashout, the advisor never suggests a vault, a steal or avoiding the fight. Any
of those would mean leaving the station for nothing. `simulate.test.ts` checks this on 120 simulated rounds.

Ties are broken by expected gain, then a fixed order of plays, so the same state always gives the same advice.

## Known limits

- It sees only what you enter: no positions, health, ammo or enemy loadouts.
- The odds are guesses. If your matches show different rates, change `DEFAULT_ODDS`.
- The tie-break for 2nd place and the result of a final that times out are UNKNOWN. Places use team order on ties.
