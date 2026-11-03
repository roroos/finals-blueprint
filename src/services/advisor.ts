/**
 * "What to do now" for Ranked Cashout: `recommend(state)` returns the candidate plays, most urgent first, each with
 * the money we expect it to bring and the assumptions behind that number. Pure, no React: App.tsx words the reasons
 * in the interface language. docs/ADVISOR.md explains every rule and its priority.
 *
 * Game facts come from rules.ts / money.ts. The chances below (holding a cashout, stealing, winning a vault fight,
 * getting wiped) are NOT game facts: no source gives them. They are rough guesses by players alive, configurable
 * (`Odds`), and every advice lists them in `assumptions` when it uses them.
 *
 * Goal: the rules make cash decisive only through placement. In a knockout round the target is the top 2 by cash at
 * the end; in the final it is reaching $50,000 first. The Rank Score formula is UNKNOWN, so it is not optimised.
 */
import {
  type Cashout,
  type MatchState,
  type TeamId,
  cashoutRemainingS,
  doubleJeopardyLoss,
  projectedCash,
  splitDeposit,
  standings,
  stealReward,
  wipeLoss,
} from './money';
import {
  type Assumptions,
  DEFAULT_ASSUMPTIONS,
  RULES,
  boxValue,
  cashoutDurationS,
  cashoutFullS,
  roundKind,
} from './rules';

export type AdviceKind = 'depositNow' | 'hold' | 'defendCashout' | 'stealCashout' | 'contestVault' | 'avoidFight';

/** Chances by players of our team alive (index 0..3). ASSUMPTIONS, not game facts (docs/ADVISOR.md). */
export interface Odds {
  /** Holding a cashout for its full length. Shorter remaining time scales the risk down linearly. */
  holdCashout: readonly [number, number, number, number];
  /** Completing a steal (the 6-7 s interaction) on a defended station. */
  steal: readonly [number, number, number, number];
  /** Getting the Cash Box out of a contested vault. */
  winVault: readonly [number, number, number, number];
  /** Getting wiped when we take a fight. */
  wipeInFight: readonly [number, number, number, number];
}

export const DEFAULT_ODDS: Readonly<Odds> = {
  holdCashout: [0, 0.25, 0.45, 0.6],
  steal: [0, 0.1, 0.25, 0.4],
  winVault: [0, 0.15, 0.35, 0.5],
  wipeInFight: [1, 0.6, 0.4, 0.25],
};

/** Numbers an advice depends on that are not game facts. */
export type AssumptionId = keyof Assumptions | `odds.${keyof Odds}` | 'vaultsLeftEstimate';

export type Reason =
  | { code: 'deposit.free'; bonus: number; stored: number; pHold: number }
  | { code: 'deposit.jeopardy'; bonus: number; stored: number; pOwn: number; loss: number; ownStation: boolean }
  | { code: 'hold.waitStation'; freeInS: number; loss: number }
  | { code: 'hold.safeLead'; margin: number }
  | { code: 'hold.respawn'; respawnS: number }
  | { code: 'defend'; stored: number; remainingS: number; pHold: number; decisive: boolean }
  | { code: 'steal'; owner: TeamId; stored: number; reward: number; pSteal: number; threat: 'wins' | 'passesUs' | null }
  | { code: 'vault'; value: number; reward: number; pBox: number }
  | { code: 'avoid.lowAlive'; alive: number; risk: number }
  | { code: 'avoid.noGoodFight'; risk: number };

export interface Advice {
  kind: AdviceKind;
  /** 0-100, higher first. */
  urgency: number;
  /** Expected change of our banked cash if we make this play (may be negative). */
  expectedGain: number;
  /** Our banked cash now + expectedGain. */
  expectedCash: number;
  reason: Reason;
  assumptions: AssumptionId[];
  cashoutId?: number;
}

export interface AdvisorOptions {
  assumptions?: Assumptions;
  odds?: Odds;
}

const KIND_ORDER: AdviceKind[] = ['defendCashout', 'depositNow', 'hold', 'stealCashout', 'contestVault', 'avoidFight'];

const clampAlive = (n: number) => Math.min(3, Math.max(0, Math.round(n))) as 0 | 1 | 2 | 3;
const round100 = (n: number) => Math.round(n / 100) * 100;
const pct = (p: number) => Math.round(p * 100) / 100;

/** Chance to hold a cashout for `remainingS` more seconds with `alive` players. */
export function holdChance(alive: number, remainingS: number, fullS: number, odds: Odds = DEFAULT_ODDS): number {
  const base = odds.holdCashout[clampAlive(alive)];
  const exposure = fullS <= 0 ? 0 : Math.min(1, Math.max(0, remainingS / fullS));
  return pct(1 - (1 - base) * exposure);
}

/** Vaults not opened yet, estimated: 2 at the start (1 in the final), +1 per completed cashout, up to the maximum,
 *  minus the boxes inserted (a box carried by someone and not inserted yet is not seen). */
export function vaultsLeftEstimate(state: MatchState): number {
  const kind = roundKind(state.round);
  const spawned = Math.min(RULES.VAULTS_MAX[kind], RULES.VAULTS_AT_START[kind] + state.completedCashouts);
  return Math.max(0, spawned - state.boxesInserted - (state.usCarrying ? 1 : 0));
}

export function recommend(state: MatchState, options: AdvisorOptions = {}): Advice[] {
  const a = options.assumptions ?? DEFAULT_ASSUMPTIONS;
  const odds = options.odds ?? DEFAULT_ODDS;
  if (state.winner) return [];
  if (state.timeLeftS <= 0 && state.cashouts.length === 0 && !state.usCarrying) return []; // round over

  const kind = roundKind(state.round);
  const cash = state.cash.us;
  const alive = clampAlive(state.usAlive);
  const fullS = cashoutFullS(state.round, a);
  const ours = state.cashouts.filter((c) => c.owner === 'us');
  const theirs = state.cashouts.filter((c) => c.owner !== 'us');
  const freeStation = state.cashouts.length < RULES.STATIONS_ACTIVE;
  const vault = state.boxesInserted + 1;
  const split = splitDeposit(state.round, vault, a);
  const pWipe = odds.wipeInFight[alive];
  const fightRisk = round100(pWipe * wipeLoss(state.round, cash, a));
  const lateOrBonus: AssumptionId[] = [
    ...(kind === 'knockout' && vault >= 5 ? (['vault56Bonus'] as const) : []),
    ...(kind === 'final' ? (['finalUsesInsertSplit'] as const) : []),
    ...(state.timeLeftS < fullS - RULES.OVERTIME_MAX_S ? (['lateCashoutShortens'] as const) : []),
  ];
  const wipeAssumptions: AssumptionId[] = ['odds.wipeInFight', ...(kind === 'final' ? (['finalWipeLossShare'] as const) : [])];

  const advice: Advice[] = [];
  const add = (x: Omit<Advice, 'expectedCash'>) =>
    advice.push({ ...x, expectedGain: round100(x.expectedGain), expectedCash: Math.max(0, round100(cash + x.expectedGain)) });

  const top = standings(state);
  const place = top.find((s) => s.team === 'us')!.place;

  // Team wiped: the team respawns together; nothing to do but wait (our cashouts can still finish)
  if (alive === 0) {
    add({
      kind: 'hold',
      urgency: 100,
      expectedGain: 0,
      reason: { code: 'hold.respawn', respawnS: RULES.TEAM_WIPE_RESPAWN_S[kind] },
      assumptions: [],
    });
  }

  // 1. Our cashouts: defend them. Leaving one is never advised (no vault or steal advice while we own one).
  for (const c of ours) {
    const remainingS = cashoutRemainingS(state, c);
    const pHold = holdChance(alive, remainingS, fullS, odds);
    const decisive = isDecisive(state, c);
    add({
      kind: 'defendCashout',
      urgency: Math.min(99, 85 + (decisive ? 10 : 0) + (remainingS <= 30 ? 4 : 0)),
      expectedGain: pHold * c.stored - (c.jeopardy === 'us' ? (1 - pHold) * doubleJeopardyLoss(cash) : 0),
      reason: { code: 'defend', stored: c.stored, remainingS, pHold, decisive },
      assumptions: ['odds.holdCashout', ...(a.stealRestartsTimer ? (['stealRestartsTimer'] as const) : [])],
      cashoutId: c.id,
    });
  }

  // 2. Carrying a box: it is worth nothing until inserted
  if (state.usCarrying && alive > 0) {
    if (freeStation) {
      const pHold = holdChance(alive, cashoutDurationS(state.round, state.timeLeftS, a), fullS, odds);
      add({
        kind: 'depositNow',
        urgency: 90,
        expectedGain: split.bonus + pHold * split.stored,
        reason: { code: 'deposit.free', bonus: split.bonus, stored: split.stored, pHold },
        assumptions: ['odds.holdCashout', ...lateOrBonus],
      });
    } else {
      // Both stations run: inserting means a second box in a running station, i.e. Double Jeopardy
      const target = ours[0] ?? [...theirs].sort((x, y) => cashoutRemainingS(state, y) - cashoutRemainingS(state, x))[0];
      const ownStation = target.owner === 'us';
      const remainingS = cashoutRemainingS(state, target);
      const pOwn = ownStation
        ? holdChance(alive, remainingS, fullS, odds)
        : pct(odds.steal[alive] * holdChance(alive, remainingS, fullS, odds));
      const bonus = a.extraBoxPaysBonus ? split.bonus : 0;
      const jeopardy = !ownStation || a.doubleJeopardyOnOwnStation;
      const loss = jeopardy ? doubleJeopardyLoss(cash + bonus) : 0;
      const gainIfOwned = ownStation ? split.stored : target.stored + split.stored + stealReward(state.round);
      const ev = bonus + pOwn * gainIfOwned - (1 - pOwn) * loss;
      const freeInS = Math.min(...state.cashouts.map((c) => cashoutRemainingS(state, c)));
      add({
        kind: 'depositNow',
        urgency: ev > 0 ? 80 : 40,
        expectedGain: ev,
        reason: { code: 'deposit.jeopardy', bonus, stored: split.stored, pOwn, loss, ownStation },
        assumptions: [
          ownStation ? 'odds.holdCashout' : 'odds.steal',
          'extraBoxPaysBonus',
          ...(ownStation ? (['doubleJeopardyOnOwnStation'] as const) : (['extraBoxTakesOwnership', 'odds.holdCashout'] as const)),
          ...lateOrBonus,
        ],
        cashoutId: target.id,
      });
      add({
        kind: 'hold',
        urgency: ev > 0 ? 70 : 88,
        expectedGain: 0,
        reason: { code: 'hold.waitStation', freeInS, loss },
        assumptions: [],
      });
    }
  }

  // 3. Safe lead (knockout): even in the worst case we stay ahead of 3rd place
  const margin = safeLeadMargin(state, a);
  if (margin !== null && alive > 0) {
    add({
      kind: 'hold',
      urgency: 92,
      expectedGain: 0,
      reason: { code: 'hold.safeLead', margin },
      assumptions: [],
    });
  }

  if (ours.length === 0 && alive > 0) {
    // 4. Their cashouts: steal
    for (const c of theirs) {
      const remainingS = cashoutRemainingS(state, c);
      if (remainingS < RULES.STEAL_S[kind]) continue; // no time to steal it
      const pSteal = odds.steal[alive];
      const pKeep = holdChance(alive, remainingS - RULES.STEAL_S[kind], fullS, odds);
      const reward = stealReward(state.round);
      const threat = stealThreat(state, c);
      add({
        kind: 'stealCashout',
        urgency: threat === 'wins' ? 98 : threat === 'passesUs' ? 84 : 70 + (place > RULES.KNOCKOUT_QUALIFIERS ? 8 : 0),
        expectedGain: pSteal * (reward + pKeep * c.stored) - fightRisk,
        reason: { code: 'steal', owner: c.owner, stored: c.stored, reward, pSteal, threat },
        assumptions: ['odds.steal', 'odds.holdCashout', ...wipeAssumptions],
        cashoutId: c.id,
      });
    }

    // 5. A vault: only when we carry nothing, a vault is likely left and there is time to open it
    const vaultsLeft = vaultsLeftEstimate(state);
    if (!state.usCarrying && vaultsLeft > 0 && state.timeLeftS > RULES.VAULT_OPEN_S) {
      const pBox = odds.winVault[alive];
      const pHold = holdChance(alive, cashoutDurationS(state.round, state.timeLeftS - RULES.VAULT_OPEN_S, a), fullS, odds);
      const reward = kind === 'knockout' || a.finalPaysVaultAndEliminationRewards ? RULES.VAULT_OPEN_REWARD : 0;
      add({
        kind: 'contestVault',
        urgency: 60 + (place > RULES.KNOCKOUT_QUALIFIERS ? 5 : 0),
        expectedGain: pBox * (reward + split.bonus + pHold * split.stored) - fightRisk,
        reason: { code: 'vault', value: boxValue(state.round, vault), reward, pBox },
        assumptions: ['odds.winVault', 'odds.holdCashout', 'vaultsLeftEstimate', ...wipeAssumptions, ...lateOrBonus],
      });
    }

    // 6. Avoid a fight: one player left, or no fight worth its wipe risk
    const fights = advice.filter((x) => x.kind === 'stealCashout' || x.kind === 'contestVault');
    if (alive === 1) {
      add({
        kind: 'avoidFight',
        urgency: 86,
        expectedGain: 0,
        reason: { code: 'avoid.lowAlive', alive, risk: fightRisk },
        assumptions: wipeAssumptions,
      });
    } else if (!state.usCarrying && fights.every((x) => x.expectedGain <= 0)) {
      add({
        kind: 'avoidFight',
        urgency: 55,
        expectedGain: 0,
        reason: { code: 'avoid.noGoodFight', risk: fightRisk },
        assumptions: wipeAssumptions,
      });
    }
  }

  return advice.sort(
    (x, y) =>
      y.urgency - x.urgency ||
      y.expectedGain - x.expectedGain ||
      KIND_ORDER.indexOf(x.kind) - KIND_ORDER.indexOf(y.kind) ||
      (x.cashoutId ?? 0) - (y.cashoutId ?? 0),
  );
}

/** Our cashout decides the round: in the final it takes us to $50,000; in a knockout round it puts us in the top 2. */
function isDecisive(state: MatchState, c: Cashout): boolean {
  if (roundKind(state.round) === 'final') return state.cash.us + c.stored >= RULES.FINAL_TARGET_CASH;
  const without = { ...state, cashouts: state.cashouts.filter((x) => x.id !== c.id) };
  const placeWithout = standings(without).find((s) => s.team === 'us')!.place;
  const placeWith = standings(state).find((s) => s.team === 'us')!.place;
  return placeWith <= RULES.KNOCKOUT_QUALIFIERS && placeWithout > RULES.KNOCKOUT_QUALIFIERS;
}

/** Their cashout, if it completes: makes them win the final, or pushes us out of the top 2. */
function stealThreat(state: MatchState, c: Cashout): 'wins' | 'passesUs' | null {
  if (roundKind(state.round) === 'final') {
    return state.cash[c.owner] + c.stored >= RULES.FINAL_TARGET_CASH ? 'wins' : null;
  }
  // Is the owner ranked below us by banked cash, and would completing push us out of the top 2?
  const banked = { ...state, cashouts: [] };
  const afterCompletion = { ...banked, cash: { ...state.cash, [c.owner]: state.cash[c.owner] + c.stored } };
  const before = standings(banked).find((s) => s.team === 'us')!.place;
  const after = standings(afterCompletion).find((s) => s.team === 'us')!.place;
  return before <= RULES.KNOCKOUT_QUALIFIERS && after > RULES.KNOCKOUT_QUALIFIERS ? 'passesUs' : null;
}

/**
 * Knockout rounds: how far ahead of the best team outside the top 2 we stay in the worst case (we lose our running
 * cashouts and get wiped; they get every running cashout that is not theirs, a steal reward, and one more full box if
 * there is time). Null when we are not safe.
 */
function safeLeadMargin(state: MatchState, a: Assumptions): number | null {
  if (roundKind(state.round) !== 'knockout') return null;
  const rows = standings(state);
  const us = rows.find((s) => s.team === 'us')!;
  if (us.place > RULES.KNOCKOUT_QUALIFIERS) return null;
  const worstUs = state.cash.us - wipeLoss(state.round, state.cash.us, a);
  const vault = state.boxesInserted + 1;
  const timeForBox = state.timeLeftS > RULES.VAULT_OPEN_S;
  const threats = rows.filter((s) => s.team !== 'us');
  // Two teams can stay above us; we are safe if at most one other team can catch us
  const catching = threats.filter((t) => {
    const best =
      state.cash[t.team] +
      state.cashouts.reduce((sum, c) => sum + c.stored, 0) +
      RULES.STEAL_REWARD.knockout +
      (timeForBox ? RULES.VAULT_OPEN_REWARD + boxValue(state.round, vault) : 0);
    return best >= worstUs;
  });
  if (catching.length >= RULES.KNOCKOUT_QUALIFIERS) return null;
  const others = threats.filter((t) => !catching.includes(t)).map((t) => projectedCash(state, t.team));
  return Math.max(0, worstUs - Math.max(0, ...others));
}
