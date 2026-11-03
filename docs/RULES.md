# Ranked Cashout rules (with sources)

Pages read on **2026-11-03**. All of them fetched fine (HTTP 200, no DNS errors). Every number in `src/services/rules.ts`
comes from this file; if it is not here, it is a configurable assumption, not a game fact.

| Id | Source | Who publishes it | "Last updated" on the page |
| --- | --- | --- | --- |
| **[W]** | https://www.thefinals.wiki/wiki/Ranked_Cashout | THE FINALS Wiki (community wiki, **not Embark**) | "This page was last edited on 21 October 2026, at 07:58" (revision 78901) |
| **[E80]** | https://id.embark.games/the-finals/support/faq/80-ranked-cashout | Embark Help Center (official) | "Last Updated: 2026-03-02" |
| **[E117]** | https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs | Embark Help Center (official) | "Last Updated: 2026-10-22" |
| **[WS]** | https://www.thefinals.wiki/wiki/Seasons | THE FINALS Wiki (community) | read 2026-11-03, used only for the season dates |

**Important:** the two official Embark pages contain **no money numbers at all** (no vault values, no deposit split,
no wipe penalty). Every money and timer number below comes from the community wiki [W]. It is the best source found,
current and detailed, but it is not Embark's word. Treat it as "documented by the community", and correct it from
your own matches when it is wrong.

## 0. Is Ranked Cashout the live ranked mode? — Yes

- [E80] (official, 2026-03-02): "Ranked Cashout is the competitive mode in THE FINALS."
- [E117] (official, updated 2026-10-22): "Rank Score (RS) is the points-based system that determines your standing
  in the Ranked Cashout of THE FINALS."
- [W] (edited 2026-10-21): "Ranked Cashout is the primary competitive mode of THE FINALS".
- [WS]: the current season started **2026-10-20** (listed as "PRIME TIME", "October 20 2026 - February 4 2027
  (TBC)"). Season 3 (June 13 – September 26, 2024) lists "ranked Terminal Attack": that is the season the VideoGamer
  article describes. Cashout has been the ranked mode again since, and is in both official pages updated in 2026.

Conclusion: Ranked Cashout is live as of 2026-11-03. Caveat: [WS] says the current season brings a "Game HUD Rework";
[W] was edited one day after the season started, but no page says whether any money rule changed this season.

## 1. Tournament structure

| Rule | Value | Source |
| --- | --- | --- |
| Teams per tournament | 8 teams, 24 contestants (3 per team) | [W] |
| Round 1 (knockout / qualifying) | 8 teams split into two matches of 4 teams (3v3v3v3) | [W] |
| Round 2 (knockout / qualifying) | the 4 remaining teams, one match | [W] |
| Who advances from a knockout round | the **top 2 teams by cash**; the bottom 2 are eliminated | [W] |
| Final round | the last 2 teams, "rules similar to Head2Head", 3v3 | [W] |
| How the final is won | "The first team to reach $50,000 wins the tournament." | [W] |
| Number of rounds played | 1–3 (a team eliminated in round 1 plays one) | [W] |
| Knockout round length | 9.5 min ("Qual. rounds - 9.5 min") | [W] infobox |
| Final round length | 14 min maximum | [W] infobox |
| Who wins the final if no one reaches $50,000 in 14 min | **UNKNOWN** | — |
| Tie-break for 2nd place in a knockout round | **UNKNOWN** | — |
| Is cash in a running (not completed) cashout counted at round end | **UNKNOWN** (overtime exists so it can finish, see §4) | — |
| Game Show Events | disabled | [W] |
| Scoreboard during the match | does not show seedings, Rank Scores or gameplay stats (shown after elimination) | [W] |
| Whether other teams' cash is visible during the match | **UNKNOWN** from these pages (the HUD shows team cash in Cashout, but no source here says so for ranked) | — |

## 2. Vaults and Cash Boxes

| Rule | Value | Source |
| --- | --- | --- |
| Vaults at the start of a knockout round | 2 | [W] |
| Maximum vaults in a knockout round | 6 | [W] table "Number of Vaults spawning in Ranked Cashout" |
| Vaults at the start / maximum in the final round | 1 / 3 | [W] same table |
| New vault | one after each **completed** deposit; only 2 active at a time | [W] |
| Cash Box value, vaults 1 & 2 | $10,000 each | [W] "First two Vaults: $10,000 each" (also the "Cash Box Index" table) |
| Cash Box value, vaults 3 & 4 | $15,000 each | [W] "Next pair: $15,000 each" |
| Cash Box value, vaults 5 & 6 | $22,000 each | [W] "Final pair: $22,000 each" |
| Cash Box value in the final round | $25,000 | [W] "Final Round: … with Vaults worth $25,000" |
| Cash Box value range | $10,000 – $25,000 | [W] Cash Box infobox |
| Opening a vault (interacting) | +$1,000 to the team | [W] (rules and "Ways to Gain Cash") |
| Vault open timer | 20 s, then the Cash Box is ejected | [W] ("twenty second timer"; infobox "opening time 20s") |
| Vault "windup time" | 15 s (infobox only; meaning not explained) | [W] infobox |
| Does opening a vault give $1,000 in the final round too | **UNKNOWN** (not stated per round) | — |
| A Cash Box has no value until it is inserted in a Cashout Station | stated | [W] |

## 3. Deposit (inserting a Cash Box) and cashout

| Rule | Value | Source |
| --- | --- | --- |
| On insert, knockout rounds | **20 %** of the box value instantly to the inserting team; **80 %** stored in the station | [W] "When a Cash Box is deposited, 20% of its value is instantly awarded to the team, while the remaining 80% is stored" and "In the knockout rounds … 20% of its initial value" |
| On completion | the team that **controls the station when the timer ends** gets everything stored in it | [W] "All Cash in the Cashout Station – Completing a Deposit" |
| Who owns a cashout at the start | the last team to hold the Cash Box before it was absorbed | [W] |
| Insert bonus listed in "Ways to Gain Cash" | $2,000 (vaults 1&2), $3,000 (vaults 3&4), **$4,000** (vaults 5&6) | [W] |
| **Conflict** | 20 % of $22,000 is $4,400, not $4,000. Either the box is $20,000 or the bonus is not exactly 20 %. The code uses the listed bonus ($4,000) and stores `value − bonus`; see `rules.ts` | [W] (internal conflict) |
| Is the 20 % split used in the final round | **UNKNOWN** — [W] says the split applies "in the knockout rounds" only | — |
| Several Cash Boxes in one station | allowed; the stored value adds up | [W] |
| Does inserting into another team's running station make you the owner | **UNKNOWN** — ownership of a *new* cashout goes to the last holder of the box; Double Jeopardy's wording ("if their team is not the owner") suggests the inserter can stay a non-owner, so the code assumes ownership does not change | [W] |
| Does each extra box also pay its 20 % on insert | **UNKNOWN** (assumed yes, configurable) | — |
| Double Jeopardy (since Season 9) | inserting a **second** Cash Box into an already active station marks the inserting team; if that team does **not** own the station when its timer ends, it **instantly loses 50 % of its total cash** | [W] |
| Double Jeopardy when the second box goes into your **own** running station | **UNKNOWN** — the wording ("an already active Cashout Station") does not exclude it; the advisor assumes it applies | — |
| Cashout duration, knockout rounds | **conflict**: "2:10" (Cashout Station section) vs "takes 2 minutes" (Deposit Process); code uses 2:10, configurable | [W] |
| Cashout duration, final round | 2:00 | [W] |
| Overtime | if a cashout cannot finish before the round ends, up to 1 min of overtime is added | [W] |
| At overtime | inactive stations, vaults and Cash Boxes despawn | [W] |
| Stations active at once | 2; a new one spawns after each completed deposit | [W] |

## 4. Steals

| Rule | Value | Source |
| --- | --- | --- |
| Steal time, knockout rounds | 7 s of interaction | [W] |
| Steal reward, knockout rounds | +$1,000 to the stealing team | [W] |
| Steal time, final round | 6 s | [W] |
| Steal reward, final round | $0 | [W] |
| Effect of a steal | the stealing team becomes the owner; it gets the stored value if it still owns the station when the timer ends | [W] |
| Does the timer reset or continue after a steal | **UNKNOWN** from these pages | — |
| Does the original depositor keep its 20 % after a steal | **UNKNOWN** (it was "instantly awarded"; the advisor assumes it is kept) | — |

## 5. Eliminations, wipes and respawns

| Rule | Value | Source |
| --- | --- | --- |
| Eliminating a contestant | +$500 | [W] "Ways to Gain Cash" |
| Same in the final round | **UNKNOWN** (not stated per round) | — |
| Individual respawn timer | 30 s (both round types) | [W] |
| Individual respawn while your team owns a cashout (knockout) | 15 s | [W] |
| Team wipe, knockout rounds | the whole team respawns together after **27 s**, without spending coins, and loses **15 % of the team's total cash** | [W] infobox "Qual. round - 27s respawn & 15% of team's total cash" and Respawn System |
| Team wipe, final round | respawn together after **25 s** | [W] |
| Cash lost on a wipe in the final round | **UNKNOWN** (the infobox gives only "25s respawn") | — |
| Where the 15 % goes (destroyed, or to the killers) | **UNKNOWN** | — |
| Respawn coins | 2 at the start, +1 at the start of each round; respawn near your cashout or teammates; without coins only a revive or a team wipe brings you back | [W] |

## 6. Rank Score (RS)

| Rule | Value | Source |
| --- | --- | --- |
| Winning a match earns RS, losing deducts RS | stated | [E117] |
| What the amount depends on | "your placement, your teammates' and opponents' ranks, and overall match outcome" | [E117] |
| Seeding | teams are seeded 1–8 by MMR; underperforming your seed costs more RS, outperforming earns more | [W] |
| Personal performance | the Season 11 entry lists "Per Contestant Personal Performance RS" | [WS] |
| **Exact RS formula** | **UNKNOWN** (no source gives one) | — |
| Placement rounds | 4 | [E80] |
| Leagues | Bronze, Silver, Gold, Platinum, Diamond (4 tiers each, 2,500 RS per tier, Bronze 4 = 0–2,499 … Diamond 1 = 47,500+), Ruby = top 500 | [E80] |
| Party matchmaking | based on the highest-ranked player in the party | [E80] |
| Inactivity decay | none ("not currently implemented") | [E117] |

Because the RS formula is unknown, the advisor does **not** optimise Rank Score. It optimises the thing the rules make
decisive: **finishing in the top 2 of a knockout round** (by cash), and **reaching $50,000 first** in the final.

## 7. Hypotheses from the task, checked

| Hypothesis (from web search) | Verdict |
| --- | --- |
| Vault values $10k / $15k / $22k for vault pairs 1-2 / 3-4 / 5-6 | **Confirmed by [W]** (knockout rounds). Final round: $25k. Not in any Embark page. |
| ~20 % on deposit, ~80 % on completed cashout | **Confirmed by [W] for knockout rounds**, with the $4,000-vs-$4,400 conflict for vaults 5&6. Final round: UNKNOWN. |
| Team wipe = −15 % of current money and a 25 s team respawn | **Partly**: −15 % and **27 s** in knockout rounds; **25 s** is the final round, whose money penalty is UNKNOWN. |
| 8 teams / 24 players split into two four-team matches | **Confirmed by [W]** (round 1); round 2 is one four-team match, the final is 1v1 team. |
| Rank Score awarded for winning | **Confirmed by [E117]**; amount depends on placement, ranks, outcome; formula UNKNOWN. |

## 8. Things worth asking Embark (or checking in your own matches)

The full, maintained list is [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md).

1. Is the deposit bonus for vaults 5 & 6 $4,000 or $4,400? Is the box $22,000?
2. Does the 20 / 80 split apply in the final round?
3. Is a wipe in the final round penalised, and where does the 15 % go?
4. Does Double Jeopardy apply when the second box goes into your own station?
5. After a steal, does the cashout timer continue or restart?
6. If two teams tie for 2nd at the end of a knockout round, who advances? Who wins a final that times out?
7. Did the current season's HUD rework change any of these numbers?
