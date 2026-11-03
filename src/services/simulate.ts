/**
 * Simulated rounds: random but valid event sequences, replayed through money.ts with the advice at every step.
 * Used as a regression test (simulate.test.ts) for invariants, not to predict real matches: the event mix is
 * arbitrary and seeded, so the same seed always gives the same round.
 */
import { type Advice, type AdvisorOptions, recommend } from './advisor';
import { type MatchEvent, type MatchState, type TeamId, applyEvent, cashoutRemainingS, newMatch, teamsOf } from './money';
import { type Round, DEFAULT_ASSUMPTIONS, RULES } from './rules';

/** Small seeded PRNG (mulberry32): deterministic across runs and platforms. */
export function rng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Step {
  event: MatchEvent;
  before: MatchState;
  after: MatchState;
  advice: Advice[];
}

/** One random event that is valid in `state`. */
export function randomEvent(state: MatchState, random: () => number): MatchEvent {
  const teams = teamsOf(state.round);
  const team = (): TeamId => teams[Math.floor(random() * teams.length)];
  const pick = <T>(xs: T[]) => xs[Math.floor(random() * xs.length)];
  const options: (() => MatchEvent)[] = [
    () => ({ type: 'setTime', timeLeftS: state.timeLeftS - 5 - Math.floor(random() * 40) }),
    () => ({ type: 'vaultOpened', team: team() }),
    () => ({ type: 'setCarrying', carrying: random() < 0.6 }),
    () => ({ type: 'setAlive', alive: Math.floor(random() * 4) }),
    () => ({ type: 'teamWiped', team: team() }),
    () => ({ type: 'elimination', team: team(), count: 1 + Math.floor(random() * 3) }),
  ];
  if (state.cashouts.length < RULES.STATIONS_ACTIVE) options.push(() => ({ type: 'deposit', team: team() }));
  if (state.cashouts.length > 0) {
    options.push(
      () => ({ type: 'deposit', team: team(), cashoutId: pick(state.cashouts).id }),
      () => ({ type: 'stolen', cashoutId: pick(state.cashouts).id, by: team() }),
    );
    const due = state.cashouts.filter((c) => cashoutRemainingS(state, c) === 0);
    if (due.length) options.push(() => ({ type: 'completed', cashoutId: due[0].id }));
    options.push(() => ({ type: 'completed', cashoutId: pick(state.cashouts).id }));
  }
  return pick(options)();
}

export function simulateRound(seed: number, round: Round = 'round1', steps = 60, options: AdvisorOptions = {}): Step[] {
  const random = rng(seed);
  const a = options.assumptions ?? DEFAULT_ASSUMPTIONS;
  let state = newMatch(round);
  const out: Step[] = [];
  for (let i = 0; i < steps && !state.winner; i++) {
    const event = randomEvent(state, random);
    const after = applyEvent(state, event, a);
    out.push({ event, before: state, after, advice: recommend(after, options) });
    state = after;
  }
  return out;
}
