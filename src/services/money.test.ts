import { describe, expect, it } from 'vitest';
import {
  type MatchEvent,
  applyEvents,
  cashoutRemainingS,
  newMatch,
  projectedCash,
  splitDeposit,
  standings,
  wipeLoss,
} from './money';
import { DEFAULT_ASSUMPTIONS } from './rules';

const play = (events: MatchEvent[], round: 'round1' | 'final' = 'round1', a = DEFAULT_ASSUMPTIONS) =>
  applyEvents(newMatch(round), events, a);

describe('deposit split', () => {
  it('knockout: the listed bonus on insert, the rest stored', () => {
    expect(splitDeposit('round1', 1)).toEqual({ value: 10_000, bonus: 2_000, stored: 8_000 });
    expect(splitDeposit('round1', 3)).toEqual({ value: 15_000, bonus: 3_000, stored: 12_000 });
    // Vaults 5 & 6: the wiki lists $4,000, 20 % would be $4,400 (UNKNOWN, configurable)
    expect(splitDeposit('round2', 5)).toEqual({ value: 22_000, bonus: 4_000, stored: 18_000 });
    expect(splitDeposit('round2', 5, { ...DEFAULT_ASSUMPTIONS, vault56Bonus: 'share' })).toEqual({
      value: 22_000,
      bonus: 4_400,
      stored: 17_600,
    });
  });

  it('final: whole box on completion by default, split if assumed', () => {
    expect(splitDeposit('final', 1)).toEqual({ value: 25_000, bonus: 0, stored: 25_000 });
    expect(splitDeposit('final', 1, { ...DEFAULT_ASSUMPTIONS, finalUsesInsertSplit: true })).toEqual({
      value: 25_000,
      bonus: 5_000,
      stored: 20_000,
    });
  });
});

describe('match events', () => {
  it('vault, deposit and completion: $1,000 + $2,000 + $8,000', () => {
    let s = play([{ type: 'vaultOpened', team: 'us' }, { type: 'deposit', team: 'us' }]);
    expect(s.cash.us).toBe(3_000);
    expect(s.cashouts).toHaveLength(1);
    expect(projectedCash(s, 'us')).toBe(11_000);
    s = applyEvents(s, [{ type: 'completed', cashoutId: 1 }]);
    expect(s.cash.us).toBe(11_000);
    expect(s.cashouts).toHaveLength(0);
    expect(s.completedCashouts).toBe(1);
  });

  it('the next box value follows the boxes inserted, and can be overridden', () => {
    const s = play([
      { type: 'deposit', team: 'b' },
      { type: 'deposit', team: 'c' },
      { type: 'completed', cashoutId: 1 },
      { type: 'deposit', team: 'us' }, // 3rd box: vault 3, $15,000
    ]);
    expect(s.cash.us).toBe(3_000);
    expect(s.cashouts.find((c) => c.owner === 'us')?.stored).toBe(12_000);
    expect(play([{ type: 'deposit', team: 'us', vault: 5 }]).cash.us).toBe(4_000);
  });

  it('a steal moves the stored cash to the thief, +$1,000 in knockout, $0 in the final', () => {
    let s = play([{ type: 'deposit', team: 'us' }, { type: 'stolen', cashoutId: 1, by: 'b' }]);
    expect(s.cash).toMatchObject({ us: 2_000, b: 1_000 });
    s = applyEvents(s, [{ type: 'completed', cashoutId: 1 }]);
    expect(s.cash).toMatchObject({ us: 2_000, b: 9_000 });

    const f = play([{ type: 'deposit', team: 'us' }, { type: 'stolen', cashoutId: 1, by: 'b' }], 'final');
    expect(f.cash).toMatchObject({ us: 0, b: 0 });
  });

  it('a steal keeps the timer (assumption) or restarts it', () => {
    const events: MatchEvent[] = [
      { type: 'deposit', team: 'us' },
      { type: 'setTime', timeLeftS: 500 },
      { type: 'stolen', cashoutId: 1, by: 'b' },
    ];
    expect(cashoutRemainingS(play(events), play(events).cashouts[0])).toBe(60);
    const restarted = play(events, 'round1', { ...DEFAULT_ASSUMPTIONS, stealRestartsTimer: true });
    expect(cashoutRemainingS(restarted, restarted.cashouts[0])).toBe(130);
  });

  it('team wipe: -15 % of total cash in knockout rounds, 0 in the final by default', () => {
    const s = play([{ type: 'setCash', team: 'us', cash: 20_000 }, { type: 'teamWiped', team: 'us' }]);
    expect(s.cash.us).toBe(17_000);
    expect(s.usAlive).toBe(0);
    expect(wipeLoss('final', 20_000)).toBe(0);
    expect(wipeLoss('final', 20_000, { ...DEFAULT_ASSUMPTIONS, finalWipeLossShare: 0.15 })).toBe(3_000);
  });

  it('Double Jeopardy: the second inserter loses 50 % if it does not own the station at the end', () => {
    // B deposits; we insert a second box into B's station (we do not become owner by default), B keeps it
    const s = play([
      { type: 'setCash', team: 'us', cash: 10_000 },
      { type: 'deposit', team: 'b' },
      { type: 'deposit', team: 'us', cashoutId: 1 },
    ]);
    expect(s.cash.us).toBe(12_000); // +$2,000 bonus for the extra box (assumption)
    expect(s.cashouts[0]).toMatchObject({ owner: 'b', stored: 16_000, boxes: 2, jeopardy: 'us' });
    const end = applyEvents(s, [{ type: 'completed', cashoutId: 1 }]);
    expect(end.cash).toMatchObject({ us: 6_000, b: 18_000 });

    // Same, but we steal it back before the end: no loss, we get both boxes
    const stolen = applyEvents(s, [
      { type: 'stolen', cashoutId: 1, by: 'us' },
      { type: 'completed', cashoutId: 1 },
    ]);
    expect(stolen.cash.us).toBe(12_000 + 1_000 + 16_000);
  });

  it('final round: first team to $50,000 wins', () => {
    const s = play(
      [
        { type: 'setCash', team: 'b', cash: 30_000 },
        { type: 'deposit', team: 'b' },
        { type: 'completed', cashoutId: 1 },
        { type: 'setCash', team: 'us', cash: 60_000 },
      ],
      'final',
    );
    expect(s.cash.b).toBe(55_000);
    expect(s.winner).toBe('b');
  });

  it('ignores impossible events and never goes negative', () => {
    const s = play([
      { type: 'stolen', cashoutId: 42, by: 'b' },
      { type: 'completed', cashoutId: 42 },
      { type: 'setCash', team: 'us', cash: -500 },
      { type: 'deposit', team: 'd' }, // team D does not exist in the final
    ], 'final');
    expect(s).toEqual({ ...newMatch('final'), cash: { us: 0, b: 0, c: 0, d: 0 } });
    // A third station does not exist: only 2 at once
    const three = play([{ type: 'deposit', team: 'b' }, { type: 'deposit', team: 'c' }, { type: 'deposit', team: 'us' }]);
    expect(three.cashouts).toHaveLength(2);
    expect(three.cash.us).toBe(0);
  });

  it('standings by projected cash', () => {
    const s = play([
      { type: 'setCash', team: 'b', cash: 9_000 },
      { type: 'setCash', team: 'c', cash: 4_000 },
      { type: 'deposit', team: 'us' },
    ]);
    expect(standings(s).map((x) => [x.team, x.projected, x.place])).toEqual([
      ['us', 10_000, 1],
      ['b', 9_000, 2],
      ['c', 4_000, 3],
      ['d', 0, 4],
    ]);
  });
});
