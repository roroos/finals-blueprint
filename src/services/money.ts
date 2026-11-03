/**
 * Money state of one Ranked Cashout round and the events that change it. Pure, no React: every function returns a
 * new state. Numbers come from rules.ts; what the sources leave UNKNOWN comes from `Assumptions`.
 *
 * Time: `timeLeftS` counts down the round clock. Negative values are overtime (at most RULES.OVERTIME_MAX_S). A
 * cashout stores when it ends on that clock (`endsAtS`), so setting the clock moves every cashout with it.
 */
import {
  type Assumptions,
  DEFAULT_ASSUMPTIONS,
  type Round,
  RULES,
  boxValue,
  cashoutDurationS,
  roundKind,
  teamsInRound,
} from './rules';

/** 'us' is the player's team; the others are labelled B, C, D in the interface. */
export type TeamId = 'us' | 'b' | 'c' | 'd';
export const ALL_TEAMS: readonly TeamId[] = ['us', 'b', 'c', 'd'];
export const teamsOf = (round: Round): TeamId[] => ALL_TEAMS.slice(0, teamsInRound(round));

export interface Cashout {
  id: number;
  owner: TeamId;
  /** Money paid to the owner when the timer ends (80 % of each box in knockout rounds). */
  stored: number;
  boxes: number;
  /** Round clock value when it completes. */
  endsAtS: number;
  /** Team that inserted a second box (Double Jeopardy), if any. */
  jeopardy: TeamId | null;
}

export interface MatchState {
  round: Round;
  timeLeftS: number;
  cash: Record<TeamId, number>;
  cashouts: Cashout[];
  /** Boxes inserted so far this round: the next box is assumed to come from vault `boxesInserted + 1`. */
  boxesInserted: number;
  completedCashouts: number;
  /** Players of our team alive now (0 = wiped, waiting for the team respawn). */
  usAlive: number;
  /** Our team carries a Cash Box that is not inserted yet. */
  usCarrying: boolean;
  /** Final round only: the team that reached the target first. */
  winner: TeamId | null;
  nextCashoutId: number;
}

export type MatchEvent =
  | { type: 'newRound'; round: Round }
  | { type: 'setTime'; timeLeftS: number }
  | { type: 'setCash'; team: TeamId; cash: number }
  | { type: 'setAlive'; alive: number }
  | { type: 'setCarrying'; carrying: boolean }
  | { type: 'vaultOpened'; team: TeamId }
  /** A box inserted by `team`, into running cashout `cashoutId` (Double Jeopardy) or a free station. `vault` overrides
   *  the vault number the box came from. */
  | { type: 'deposit'; team: TeamId; cashoutId?: number; vault?: number }
  | { type: 'stolen'; cashoutId: number; by: TeamId }
  | { type: 'completed'; cashoutId: number }
  | { type: 'teamWiped'; team: TeamId }
  | { type: 'elimination'; team: TeamId; count?: number };

const clampMoney = (n: number) => Math.max(0, Math.round(n));
const zeroCash = (): Record<TeamId, number> => ({ us: 0, b: 0, c: 0, d: 0 });

export function newMatch(round: Round = 'round1'): MatchState {
  return {
    round,
    timeLeftS: RULES.ROUND_LENGTH_S[roundKind(round)],
    cash: zeroCash(),
    cashouts: [],
    boxesInserted: 0,
    completedCashouts: 0,
    usAlive: RULES.PLAYERS_PER_TEAM,
    usCarrying: false,
    winner: null,
    nextCashoutId: 1,
  };
}

/** Bonus paid on insert and value stored in the station, for the box from vault `vault`. */
export function splitDeposit(
  round: Round,
  vault: number,
  a: Assumptions = DEFAULT_ASSUMPTIONS,
): { value: number; bonus: number; stored: number } {
  const value = boxValue(round, vault);
  if (roundKind(round) === 'final' && !a.finalUsesInsertSplit) return { value, bonus: 0, stored: value };
  const index = Math.min(Math.max(1, Math.floor(vault)), RULES.KNOCKOUT_INSERT_BONUS_LISTED.length) - 1;
  const bonus =
    roundKind(round) === 'knockout' && (index < 4 || a.vault56Bonus === 'listed')
      ? RULES.KNOCKOUT_INSERT_BONUS_LISTED[index]
      : Math.round(value * RULES.KNOCKOUT_INSERT_SHARE);
  return { value, bonus, stored: value - bonus };
}

/** Cash a team loses when it is wiped. */
export function wipeLoss(round: Round, cash: number, a: Assumptions = DEFAULT_ASSUMPTIONS): number {
  const share = roundKind(round) === 'final' ? a.finalWipeLossShare : RULES.KNOCKOUT_WIPE_LOSS_SHARE;
  return Math.round(Math.max(0, cash) * share);
}

/** Cash lost by a Double Jeopardy team that does not own the station at the end. */
export const doubleJeopardyLoss = (cash: number) => Math.round(Math.max(0, cash) * RULES.DOUBLE_JEOPARDY_LOSS_SHARE);

export const stealReward = (round: Round) => RULES.STEAL_REWARD[roundKind(round)];

const pays = (round: Round, a: Assumptions) => roundKind(round) === 'knockout' || a.finalPaysVaultAndEliminationRewards;

/** Seconds before a cashout completes (0 = due now). */
export const cashoutRemainingS = (state: MatchState, c: Cashout) => Math.max(0, state.timeLeftS - c.endsAtS);

/** Cash plus everything stored in the cashouts a team owns now. */
export function projectedCash(state: MatchState, team: TeamId): number {
  return state.cash[team] + state.cashouts.filter((c) => c.owner === team).reduce((sum, c) => sum + c.stored, 0);
}

export interface Standing {
  team: TeamId;
  cash: number;
  projected: number;
  /** 1-based, by projected cash; ties keep team order (tie-break UNKNOWN in the rules). */
  place: number;
}

export function standings(state: MatchState): Standing[] {
  return teamsOf(state.round)
    .map((team) => ({ team, cash: state.cash[team], projected: projectedCash(state, team) }))
    .sort((x, y) => y.projected - x.projected || ALL_TEAMS.indexOf(x.team) - ALL_TEAMS.indexOf(y.team))
    .map((s, i) => ({ ...s, place: i + 1 }));
}

function withCash(state: MatchState, team: TeamId, delta: number): MatchState {
  const cash = { ...state.cash, [team]: clampMoney(state.cash[team] + delta) };
  const winner =
    state.winner ??
    (roundKind(state.round) === 'final' && cash[team] >= RULES.FINAL_TARGET_CASH ? team : null);
  return { ...state, cash, winner };
}

const inRound = (state: MatchState, team: TeamId) => teamsOf(state.round).includes(team);

/** Applies one event. Invalid events (unknown cashout, team not in this round) leave the state unchanged. */
export function applyEvent(state: MatchState, event: MatchEvent, a: Assumptions = DEFAULT_ASSUMPTIONS): MatchState {
  switch (event.type) {
    case 'newRound':
      return newMatch(event.round);

    case 'setTime':
      return {
        ...state,
        timeLeftS: Math.round(
          Math.min(RULES.ROUND_LENGTH_S[roundKind(state.round)], Math.max(-RULES.OVERTIME_MAX_S, event.timeLeftS)),
        ),
      };

    case 'setCash':
      if (!inRound(state, event.team)) return state;
      return withCash({ ...state, cash: { ...state.cash, [event.team]: 0 } }, event.team, event.cash);

    case 'setAlive':
      return { ...state, usAlive: Math.min(RULES.PLAYERS_PER_TEAM, Math.max(0, Math.round(event.alive))) };

    case 'setCarrying':
      return { ...state, usCarrying: event.carrying };

    case 'vaultOpened':
      if (!inRound(state, event.team) || !pays(state.round, a)) return state;
      return withCash(state, event.team, RULES.VAULT_OPEN_REWARD);

    case 'deposit': {
      if (!inRound(state, event.team)) return state;
      const vault = event.vault ?? state.boxesInserted + 1;
      const { bonus, stored } = splitDeposit(state.round, vault, a);
      const target = event.cashoutId === undefined ? undefined : state.cashouts.find((c) => c.id === event.cashoutId);
      if (event.cashoutId !== undefined && !target) return state;
      if (!target && state.cashouts.length >= RULES.STATIONS_ACTIVE) return state; // no free station
      let next: MatchState = {
        ...state,
        boxesInserted: state.boxesInserted + 1,
        usCarrying: event.team === 'us' ? false : state.usCarrying,
      };
      if (target) {
        const jeopardy =
          target.jeopardy ?? (target.owner !== event.team || a.doubleJeopardyOnOwnStation ? event.team : null);
        next = {
          ...next,
          cashouts: next.cashouts.map((c) =>
            c.id === target.id
              ? { ...c, stored: c.stored + stored, boxes: c.boxes + 1, owner: a.extraBoxTakesOwnership ? event.team : c.owner, jeopardy }
              : c,
          ),
        };
        return a.extraBoxPaysBonus ? withCash(next, event.team, bonus) : next;
      }
      const cashout: Cashout = {
        id: state.nextCashoutId,
        owner: event.team,
        stored,
        boxes: 1,
        endsAtS: state.timeLeftS - cashoutDurationS(state.round, state.timeLeftS, a),
        jeopardy: null,
      };
      next = { ...next, cashouts: [...next.cashouts, cashout], nextCashoutId: state.nextCashoutId + 1 };
      return withCash(next, event.team, bonus);
    }

    case 'stolen': {
      const target = state.cashouts.find((c) => c.id === event.cashoutId);
      if (!target || !inRound(state, event.by) || target.owner === event.by) return state;
      const endsAtS = a.stealRestartsTimer
        ? state.timeLeftS - cashoutDurationS(state.round, state.timeLeftS, a)
        : target.endsAtS;
      const next = {
        ...state,
        cashouts: state.cashouts.map((c) => (c.id === target.id ? { ...c, owner: event.by, endsAtS } : c)),
      };
      return withCash(next, event.by, stealReward(state.round));
    }

    case 'completed': {
      const target = state.cashouts.find((c) => c.id === event.cashoutId);
      if (!target) return state;
      let next: MatchState = {
        ...state,
        cashouts: state.cashouts.filter((c) => c.id !== target.id),
        completedCashouts: state.completedCashouts + 1,
      };
      next = withCash(next, target.owner, target.stored);
      if (target.jeopardy && target.jeopardy !== target.owner) {
        next = withCash(next, target.jeopardy, -doubleJeopardyLoss(next.cash[target.jeopardy]));
      }
      return next;
    }

    case 'teamWiped': {
      if (!inRound(state, event.team)) return state;
      const next = withCash(state, event.team, -wipeLoss(state.round, state.cash[event.team], a));
      return event.team === 'us' ? { ...next, usAlive: 0, usCarrying: false } : next;
    }

    case 'elimination':
      if (!inRound(state, event.team) || !pays(state.round, a)) return state;
      return withCash(state, event.team, RULES.ELIMINATION_REWARD * Math.max(1, Math.round(event.count ?? 1)));
  }
}

export const applyEvents = (state: MatchState, events: MatchEvent[], a: Assumptions = DEFAULT_ASSUMPTIONS) =>
  events.reduce((s, e) => applyEvent(s, e, a), state);
