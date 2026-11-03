import { describe, expect, it } from 'vitest';
import { holdChance, recommend, vaultsLeftEstimate } from './advisor';
import { type MatchEvent, applyEvents, newMatch } from './money';
import { type Round } from './rules';

const at = (events: MatchEvent[], round: Round = 'round1') => applyEvents(newMatch(round), events);
const kinds = (events: MatchEvent[], round: Round = 'round1') => recommend(at(events, round)).map((x) => x.kind);

describe('advisor', () => {
  it('start of a round: contest a vault (expected money shown with its assumptions)', () => {
    const [first] = recommend(newMatch('round1'));
    expect(first.kind).toBe('contestVault');
    // 0.5 x ($1,000 + $2,000 + 0.6 x $8,000) = $3,900, no wipe risk at $0
    expect(first.expectedGain).toBe(3_900);
    expect(first.assumptions).toEqual(expect.arrayContaining(['odds.winVault', 'odds.holdCashout']));
  });

  it('carrying a box with a free station: deposit now, first', () => {
    const advice = recommend(at([{ type: 'setCarrying', carrying: true }]));
    expect(advice[0]).toMatchObject({ kind: 'depositNow', reason: { code: 'deposit.free', bonus: 2_000, stored: 8_000 } });
    expect(advice.map((x) => x.kind)).not.toContain('contestVault');
  });

  it('carrying a box, both stations taken by others: Double Jeopardy, waiting wins when cash is high', () => {
    const advice = recommend(
      at([
        { type: 'setCash', team: 'us', cash: 30_000 },
        { type: 'deposit', team: 'b' },
        { type: 'deposit', team: 'c' },
        { type: 'setCarrying', carrying: true },
      ]),
    );
    expect(advice[0]).toMatchObject({ kind: 'hold', reason: { code: 'hold.waitStation' } });
    const deposit = advice.find((x) => x.kind === 'depositNow')!;
    expect(deposit.reason).toMatchObject({ code: 'deposit.jeopardy', ownStation: false });
    expect(deposit.expectedGain).toBeLessThan(0);
  });

  it('our cashout: defend it, and nothing that means leaving it', () => {
    const advice = recommend(at([{ type: 'deposit', team: 'us' }]));
    expect(advice[0]).toMatchObject({ kind: 'defendCashout', cashoutId: 1 });
    expect(advice.map((x) => x.kind)).not.toContain('contestVault');
    expect(advice.map((x) => x.kind)).not.toContain('stealCashout');
  });

  it('defending gets more likely to pay as the timer runs out', () => {
    expect(holdChance(3, 130, 130)).toBe(0.6);
    expect(holdChance(3, 0, 130)).toBe(1);
    expect(holdChance(1, 65, 130)).toBeGreaterThan(holdChance(1, 130, 130));
  });

  it('final: a cashout that makes them win is the top priority to steal', () => {
    const advice = recommend(
      at([{ type: 'setCash', team: 'b', cash: 30_000 }, { type: 'deposit', team: 'b' }], 'final'),
    );
    expect(advice[0]).toMatchObject({ kind: 'stealCashout', reason: { threat: 'wins', reward: 0 } });
  });

  it('final: our cashout that wins the tournament is decisive', () => {
    const advice = recommend(
      at([{ type: 'setCash', team: 'us', cash: 30_000 }, { type: 'deposit', team: 'us' }], 'final'),
    );
    expect(advice[0]).toMatchObject({ kind: 'defendCashout', reason: { decisive: true, stored: 25_000 } });
  });

  it('knockout: a steal that keeps us in the top 2 is flagged', () => {
    const advice = recommend(
      at([
        { type: 'setCash', team: 'us', cash: 12_000 },
        { type: 'setCash', team: 'b', cash: 20_000 },
        { type: 'setCash', team: 'c', cash: 6_000 },
        { type: 'deposit', team: 'c', vault: 3 },
      ]),
    );
    expect(advice.find((x) => x.kind === 'stealCashout')?.reason).toMatchObject({ threat: 'passesUs' });
  });

  it('knockout: a safe lead says hold', () => {
    const late = at([
      { type: 'setCash', team: 'us', cash: 40_000 },
      { type: 'setCash', team: 'b', cash: 30_000 },
      { type: 'setCash', team: 'c', cash: 3_000 },
      { type: 'setTime', timeLeftS: 15 },
    ]);
    expect(recommend(late)[0]).toMatchObject({ kind: 'hold', reason: { code: 'hold.safeLead' } });
  });

  it('one player left and no cashout: avoid fights', () => {
    expect(kinds([{ type: 'setAlive', alive: 1 }])[0]).toBe('avoidFight');
  });

  it('team wiped: wait for the 27 s team respawn (25 s in the final)', () => {
    expect(recommend(at([{ type: 'teamWiped', team: 'us' }]))[0].reason).toEqual({ code: 'hold.respawn', respawnS: 27 });
    expect(recommend(at([{ type: 'teamWiped', team: 'us' }], 'final'))[0].reason).toEqual({ code: 'hold.respawn', respawnS: 25 });
  });

  it('no vault advice when no vault is likely left', () => {
    const s = at([
      { type: 'deposit', team: 'b' },
      { type: 'deposit', team: 'c' },
      { type: 'completed', cashoutId: 1 },
      { type: 'completed', cashoutId: 2 },
      { type: 'deposit', team: 'd' },
      { type: 'deposit', team: 'b' },
    ]);
    expect(vaultsLeftEstimate(s)).toBe(0);
    expect(recommend(s).map((x) => x.kind)).not.toContain('contestVault');
  });

  it('round over: no advice', () => {
    expect(recommend(at([{ type: 'setTime', timeLeftS: 0 }]))).toEqual([]);
  });
});
