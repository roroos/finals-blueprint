/**
 * THE FINALS — Ranked Cashout rules, as constants. Pure, no React.
 *
 * Every number comes from docs/RULES.md, which gives the page, its "last updated" date and the exact wording.
 * Sources (read 2026-11-03):
 *   [W]    https://www.thefinals.wiki/wiki/Ranked_Cashout (community wiki, NOT Embark; last edited 2026-10-21)
 *   [E80]  https://id.embark.games/the-finals/support/faq/80-ranked-cashout (official, updated 2026-03-02)
 *   [E117] https://id.embark.games/the-finals/support/faq/117-ranked-cashout-rank-score-rs (official, 2026-10-22)
 * The official pages give no money numbers: all money and timers below are [W].
 *
 * Two kinds of values:
 *   RULES: stated by a source. Change only when a source changes.
 *   DEFAULT_ASSUMPTIONS: UNKNOWN in every source. Configurable, every field says why it has its default.
 */

export const RULES_VERIFIED_ON = '2026-11-03';

export type Round = 'round1' | 'round2' | 'final';
export type RoundKind = 'knockout' | 'final';

/** Rounds 1 and 2 are knockout ("qualifying") rounds, 4 teams; the final is 2 teams. [W] */
export const roundKind = (round: Round): RoundKind => (round === 'final' ? 'final' : 'knockout');

export const RULES = {
  // Tournament [W] "Tournament Structure"
  TEAMS_PER_TOURNAMENT: 8,
  PLAYERS_PER_TEAM: 3,
  TEAMS_PER_MATCH: { knockout: 4, final: 2 } satisfies Record<RoundKind, number>,
  /** Top 2 by cash advance from a knockout round, bottom 2 are eliminated. [W] */
  KNOCKOUT_QUALIFIERS: 2,
  /** "The first team to reach $50,000 wins the tournament." [W] */
  FINAL_TARGET_CASH: 50_000,
  /** Round length: "Qual. rounds - 9.5 min", "Final round - 14min (max)". [W] infobox */
  ROUND_LENGTH_S: { knockout: 570, final: 840 } satisfies Record<RoundKind, number>,

  // Vaults and Cash Boxes [W] "Vaults", "Cash Box Index", "Tournament Structure"
  /** Cash Box value by vault number (1-based), knockout rounds: $10k / $15k / $22k per pair. [W] */
  KNOCKOUT_BOX_VALUE_BY_VAULT: [10_000, 10_000, 15_000, 15_000, 22_000, 22_000],
  /** "Final Round: … with Vaults worth $25,000". [W] */
  FINAL_BOX_VALUE: 25_000,
  /** "Number of Vaults spawning in Ranked Cashout": starting / maximum. [W] */
  VAULTS_AT_START: { knockout: 2, final: 1 } satisfies Record<RoundKind, number>,
  VAULTS_MAX: { knockout: 6, final: 3 } satisfies Record<RoundKind, number>,
  /** "Interacting with a Vault grants $1,000." [W] (not stated per round, see assumptions) */
  VAULT_OPEN_REWARD: 1_000,
  /** "triggering a twenty second timer" before the Cash Box is ejected. [W] */
  VAULT_OPEN_S: 20,

  // Deposit and cashout [W] "Deposit Process", "Cash Box", "Ways to Gain Cash"
  /** "20% of its value is instantly awarded to the team, while the remaining 80% is stored". Knockout rounds. [W] */
  KNOCKOUT_INSERT_SHARE: 0.2,
  /**
   * Insert bonus listed in "Ways to Gain Cash": $2,000 / $3,000 / $4,000 for vaults 1&2 / 3&4 / 5&6. [W]
   * CONFLICT: 20 % of $22,000 is $4,400. Which one the game pays is UNKNOWN: see DEFAULT_ASSUMPTIONS.vault56Bonus.
   */
  KNOCKOUT_INSERT_BONUS_LISTED: [2_000, 2_000, 3_000, 3_000, 4_000, 4_000],
  /** "Cashout Duration in knockout rounds - 2:10" (but "The deposit process takes 2 minutes"): see assumptions. [W] */
  CASHOUT_S_LISTED: { knockout: 130, final: 120 } satisfies Record<RoundKind, number>,
  /** Infobox "Cashout time Min. 1m Max. 2m10s". [W] */
  CASHOUT_MIN_S: 60,
  /** "up to 1 minute of overtime is added" when a cashout cannot finish in regular time. [W] */
  OVERTIME_MAX_S: 60,
  /** Stations active at once; a new one spawns after each completed deposit. [W] */
  STATIONS_ACTIVE: 2,
  /** Double Jeopardy: the team that inserted a 2nd box into an active station loses 50 % of its total cash if it does
   *  not own the station when the timer ends. Since Season 9. [W] */
  DOUBLE_JEOPARDY_LOSS_SHARE: 0.5,

  // Steals [W] "Cashout Station"
  STEAL_S: { knockout: 7, final: 6 } satisfies Record<RoundKind, number>,
  STEAL_REWARD: { knockout: 1_000, final: 0 } satisfies Record<RoundKind, number>,

  // Eliminations, wipes, respawns [W] "Ways to Gain Cash", "Respawn System", infobox
  /** "$500 – Eliminating a contestant." [W] (not stated per round, see assumptions) */
  ELIMINATION_REWARD: 500,
  /** "Qual. round - 27s respawn & 15% of team's total cash". [W] infobox. Final round: see assumptions. */
  KNOCKOUT_WIPE_LOSS_SHARE: 0.15,
  TEAM_WIPE_RESPAWN_S: { knockout: 27, final: 25 } satisfies Record<RoundKind, number>,
  RESPAWN_S: 30,
  /** Knockout rounds, when your team owns a cashout. [W] */
  RESPAWN_OWNING_CASHOUT_S: 15,
  RESPAWN_COINS_AT_START: 2,
  RESPAWN_COINS_PER_ROUND: 1,
} as const;

/**
 * Everything the sources do not say. Each field is UNKNOWN in docs/RULES.md; the default is a guess and says why.
 * The app passes these to every function so they can be changed without touching the rules.
 */
export interface Assumptions {
  /** UNKNOWN: bonus on insert for vaults 5 & 6. 'listed' = $4,000 ([W] "Ways to Gain Cash"), 'share' = 20 % = $4,400. */
  vault56Bonus: 'listed' | 'share';
  /** UNKNOWN: knockout cashout length, 2:10 ([W] Cashout Station section) or 2:00 ([W] Deposit Process). */
  knockoutCashoutS: number;
  /** UNKNOWN: does the 20 / 80 split apply in the final? [W] says "in the knockout rounds" only, so default no:
   *  in the final the whole box is paid on completion. */
  finalUsesInsertSplit: boolean;
  /** UNKNOWN: share of cash lost on a team wipe in the final ([W] only gives the 25 s respawn). Default 0. */
  finalWipeLossShare: number;
  /** UNKNOWN: does each extra box inserted into a running station pay its own insert bonus? Default yes. */
  extraBoxPaysBonus: boolean;
  /** UNKNOWN: does Double Jeopardy apply when the 2nd box goes into a station your own team owns? [W]'s wording does
   *  not exclude it, so default yes (the safe reading for advice). */
  doubleJeopardyOnOwnStation: boolean;
  /** UNKNOWN: does inserting a box into another team's running station make you its owner? [W] only says the last
   *  holder of the box owns a NEW cashout, and Double Jeopardy talks of the inserter possibly "not the owner", so
   *  default no: the owner stays, you must still steal it. */
  extraBoxTakesOwnership: boolean;
  /** UNKNOWN: does a steal restart the cashout timer? Default no (the timer keeps running). */
  stealRestartsTimer: boolean;
  /** UNKNOWN: a cashout started late lasts `time left + overtime`, never less than 1 min and never more than the full
   *  length. Reading of [W] infobox "Min. 1m Max. 2m10s" with "up to 1 minute of overtime". Default yes. */
  lateCashoutShortens: boolean;
  /** UNKNOWN: are the vault ($1,000) and elimination ($500) rewards also paid in the final? Default yes. */
  finalPaysVaultAndEliminationRewards: boolean;
}

export const DEFAULT_ASSUMPTIONS: Readonly<Assumptions> = {
  vault56Bonus: 'listed',
  knockoutCashoutS: RULES.CASHOUT_S_LISTED.knockout,
  finalUsesInsertSplit: false,
  finalWipeLossShare: 0,
  extraBoxPaysBonus: true,
  doubleJeopardyOnOwnStation: true,
  extraBoxTakesOwnership: false,
  stealRestartsTimer: false,
  lateCashoutShortens: true,
  finalPaysVaultAndEliminationRewards: true,
};

/** Value of the Cash Box from vault `vault` (1-based; past the last vault: the last value). [W] */
export function boxValue(round: Round, vault: number): number {
  if (roundKind(round) === 'final') return RULES.FINAL_BOX_VALUE;
  const values = RULES.KNOCKOUT_BOX_VALUE_BY_VAULT;
  return values[Math.min(Math.max(1, Math.floor(vault)), values.length) - 1];
}

/** 1 → "1-2", 3 → "3-4": the vault pair a vault belongs to (knockout rounds). */
export const vaultPair = (vault: number): 1 | 2 | 3 =>
  Math.min(3, Math.max(1, Math.ceil(Math.max(1, vault) / 2))) as 1 | 2 | 3;

/** Full cashout length in this round. */
export function cashoutFullS(round: Round, a: Assumptions = DEFAULT_ASSUMPTIONS): number {
  return roundKind(round) === 'final' ? RULES.CASHOUT_S_LISTED.final : a.knockoutCashoutS;
}

/** Length of a cashout started with `timeLeftS` in the round (negative = already in overtime). */
export function cashoutDurationS(round: Round, timeLeftS: number, a: Assumptions = DEFAULT_ASSUMPTIONS): number {
  const full = cashoutFullS(round, a);
  if (!a.lateCashoutShortens) return full;
  return Math.min(full, Math.max(RULES.CASHOUT_MIN_S, timeLeftS + RULES.OVERTIME_MAX_S));
}

export const teamsInRound = (round: Round): number => RULES.TEAMS_PER_MATCH[roundKind(round)];
