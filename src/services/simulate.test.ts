import { describe, expect, it } from 'vitest';
import { recommend } from './advisor';
import { ALL_TEAMS } from './money';
import { type Round } from './rules';
import { simulateRound } from './simulate';

const ROUNDS: Round[] = ['round1', 'round2', 'final'];
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

describe('simulated rounds (invariants)', () => {
  it('the same seed gives the same round and the same advice', () => {
    expect(simulateRound(7)).toEqual(simulateRound(7));
  });

  for (const round of ROUNDS) {
    it(`${round}: money never negative, advice deterministic and well-formed`, () => {
      for (const seed of SEEDS) {
        for (const step of simulateRound(seed, round)) {
          const s = step.after;
          for (const t of ALL_TEAMS) expect(s.cash[t]).toBeGreaterThanOrEqual(0);
          for (const c of s.cashouts) expect(c.stored).toBeGreaterThan(0);
          expect(s.cashouts.length).toBeLessThanOrEqual(2);
          expect(recommend(s)).toEqual(step.advice);
          for (const x of step.advice) {
            expect(x.expectedCash).toBeGreaterThanOrEqual(0);
            expect(Number.isFinite(x.expectedGain)).toBe(true);
            expect(x.urgency).toBeGreaterThanOrEqual(0);
            expect(x.urgency).toBeLessThanOrEqual(100);
          }
          const urgencies = step.advice.map((x) => x.urgency);
          expect(urgencies).toEqual([...urgencies].sort((p, q) => q - p));
        }
      }
    });

    it(`${round}: a cashout in progress is never advised to be abandoned`, () => {
      for (const seed of SEEDS) {
        for (const { after: s, advice } of simulateRound(seed, round)) {
          const ours = s.cashouts.filter((c) => c.owner === 'us');
          if (ours.length === 0 || s.winner) continue;
          for (const c of ours) expect(advice.some((x) => x.kind === 'defendCashout' && x.cashoutId === c.id)).toBe(true);
          // No play that means leaving the station
          expect(advice.filter((x) => ['contestVault', 'stealCashout', 'avoidFight'].includes(x.kind))).toEqual([]);
          // Defending ranks above anything but depositing a carried box, waiting for a station, or the team respawn
          const first = advice.find((x) => x.kind !== 'depositNow' && !(x.kind === 'hold'));
          expect(first?.kind).toBe('defendCashout');
        }
      }
    });
  }

  it('final round: stops at the winner', () => {
    for (const seed of SEEDS) {
      const steps = simulateRound(seed, 'final', 200);
      const last = steps[steps.length - 1].after;
      if (last.winner) expect(recommend(last)).toEqual([]);
      for (const { after } of steps.slice(0, -1)) expect(after.winner).toBeNull();
    }
  });
});
